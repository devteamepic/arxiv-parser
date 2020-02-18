const axios = require('axios')
const converter = require('xml-js')
const fs = require('fs')
const request = require('request')
const csvWriter = require('./csvWriter')
const archiver = require('archiver')
const separators = [' ', '\\+', '-', '\\(', '\\)', '\\*', '/', ':', '\\?']

const time = 2500
const output = fs.createWriteStream(__dirname + '/../data.zip')

var data = null
var downloadLinkHolder = null
var url = 'http://export.arxiv.org/api/query?search_query=all:thesis+AND+all:biology&max_results='
var amountOfData = 10
var progress = 0
var chunk = 0
var fileCounter = 0
var allData = []
var j = 0
var archive = archiver('zip', {
  zlib: { level: 9 }
})

axios.interceptors.response.use(function (response) {
    if (response.statusText !== 'OK') {
	console.log('asdf')
        return Promise.reject(response);
    }
    return response;
}, function (error) {
    // Do something with response error
    amountOfData--
    j++
    if (amountOfData > fileCounter) {
	setTimeout(() => {
	    fetchData(j)
	}, time)
    }
});

/**
 * Function to adjust filenames to CamelCaseStandard
 * @param {string} str Incoming document title name to prettify to CamelCaseStandard
 */
const prettifyFileName = (str) => {
  var splittedString = str.toLowerCase().split(new RegExp(separators.join('|'), 'g'))
  for (var i = 0; i < splittedString.length; i++) {
    splittedString[i] = splittedString[i].charAt(0).toUpperCase() + splittedString[i].substring(1)
  }

  return splittedString.join('') + '.pdf'
}

/**
 * Function to adjust summary to some standard
 * @param {string} str 
 */
const prettifySummary = (str) => {
  var splittedString = str.toLowerCase().split(new RegExp(separators.join('|'), 'g'))
  for (var i = 0; i < splittedString.length; i++) {
    splittedString[i] = splittedString[i].charAt(0).toUpperCase() + splittedString[i].substring(1)
  }
  
  return splittedString.join(' ')
}

/**
 * @param {string} str 
 */
const deleteNewLine = (str) => {
  var newStr = ''
  for (var i = 0; i < str.length; i++) {
    if (!(str[i] === '\n' || str[i] === '\r')) {
      newStr += str[i]
    }
  }

  return newStr
}

/**
 * @param {int} j The amount of iterations of recursion
 */
const fetchData = (j) => {
  if (data[j] !== undefined && data[j].hasOwnProperty('title') && !data[j].title._text.includes('\\')){
    for (var k = 0; k < data[j].link.length; k++) {
      if (data[j].link[k]._attributes.title === 'pdf') {
        downloadLinkHolder = data[j].link[k]._attributes.href + '.pdf'
      }
    }

    var authors = ''

    if (!data[j].author.length) {
      authors = data[j].author.name._text
    } else {
      for (var i = 0; i < data[j].author.length; i++) {
        authors += data[j].author[i].name._text + ', '
      }
    }

    data[j].title._text = deleteNewLine(data[j].title._text)
    data[j].title._text = prettifyFileName(data[j].title._text)

    var singleWork = {
      id: data[j].id._text,
      lastUpdatedDate: data[j].updated._text,
      publishedDate: data[j].published._text,
      title: data[j].title._text,
      summary: data[j].summary._text,
      authors: authors,
      category: data[j].category[0] ? data[j].category[0]._attributes.term : data[j].category._attributes.term,
      metaData: data[j]['arxiv:comment'] ? data[j]['arxiv:comment']._text : 0,
      downloadLink: downloadLinkHolder,
      filePath: './files/' + data[j].title._text
    }

    singleWork.summary = deleteNewLine(singleWork.summary)
    singleWork.summary = prettifySummary(singleWork.summary)

    allData.push(singleWork)

    const file = fs.createWriteStream('./files/' + singleWork.title)
    new Promise((resolve, reject) => {
      request({
        uri: singleWork.downloadLink,
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
          'Cache-Control': 'max-age=0',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
        },
        /* GZIP true for most of the websites now, disable it if you don't need it */
        gzip: true
      })
        .pipe(file)
        .on('finish', () => {
          progress += chunk
          fileCounter++
          process.stdout.write('\r\x1b[K')
          process.stdout.write('Progress: ' + progress + '% Files: ' + fileCounter + ' / ' + amountOfData)
          if (fileCounter == amountOfData) {
            csvWriter
              .writeRecords(allData)
              .then(() => {
                console.log('\n data added to data.csv, Done!')
                const dataPath = __dirname + '/../data.csv'
                archive.directory(__dirname + '/../files/', 'files')
                archive.append(fs.createReadStream(dataPath), { name: 'data.csv' })
                archive.finalize()
                resolve()
              })
          }
          resolve()
	        j++
	        if (fileCounter < amountOfData) {
	         	setTimeout(() => {
	         		fetchData(j)
	          }, time)
	        }
        })
        .on('error', (error) => {
          csvWriter
            .writeRecords(allData)
            .then(() => {
              console.log('\n data added to data.csv, Done!')
            })
          reject(error)
        })
        .on('socket', function(socket) {
          socket.on('error', function (error) {
            console.log('socket error: ' + error)
            reject(error);
          });
        });
    })
      .catch(error => {
        csvWriter
          .writeRecords(allData)
          .then(() => {
            console.log('\n data added to data.csv, Done!')
          })
        console.log(`Something happened: ${error}`)
      })
  } else {
	  amountOfData--
	  j++
	  if (amountOfData > fileCounter) {
		  setTimeout(() => {
			  fetchData(j)
		  }, time)
	  }
  }
}

if (process.argv[2] && process.argv[2] <= 3000) amountOfData = process.argv[2]
else if (process.argv[2] && process.argv[2] > 3000) {
  console.log('The amount of data must not exceed 3000')
  return
}
url += amountOfData
chunk = 100 / amountOfData
archive.pipe(output)
axios.get(url)
  .then(response => {
    data = converter.xml2js(response.data, { compact: true, spaces: 2 }).feed
    data = data.entry

    fetchData(j)
  })
