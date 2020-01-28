const express = require('express')
const axios = require('axios')
const converter = require('xml-js')
const fs = require('fs')
const request = require('request')
const csvWriter = require('./csvWriter')

var rawData = null
var downloadLinkHolder = null
var url = 'http://export.arxiv.org/api/query?search_query=all:phd&max_results='
var amountOfData = 10
var progress = 0
var chunk = 0
var fileCounter = 0
var allData = []
var time = 10000
var j = 0

const app = express()
const port = 3000
const separators = [' ', '\\+', '-', '\\(', '\\)', '\\*', '/', ':', '\\?', '&#92']
const nullLink = {'link': undefined}

/**
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
 * @param {string} str Removes newlines from the text
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

app.listen(port, () => {
  if (process.argv[2] && process.argv[2] <= 3000) amountOfData = process.argv[2]
  else if (process.argv[2] && process.argv[2] > 3000) {
    console.log('The amount of data must not exceed 3000')
    return
  }
  console.log('app listens on port 3000')
  url += amountOfData
  chunk = 100 / amountOfData
  fetchData(j)
})

const fetchData = (j) => {
  axios.get(url)
    .then(response => {
      rawData = converter.xml2js(response.data, { compact: true, spaces: 2 }).feed

	  if (typeof(rawData.entry[j].link) !== undefined) {
          for (var k = 0; k < rawData.entry[j].link.length; k++) {
            if (rawData.entry[j].link[k]._attributes.title === 'pdf') {
              downloadLinkHolder = rawData.entry[j].link[k]._attributes.href + '.pdf'
            }
          }

          var authors = ''

          if (!rawData.entry[j].author.length) {
            authors = rawData.entry[j].author.name._text
          } else {
            for (var i = 0; i < rawData.entry[j].author.length; i++) {
              authors += rawData.entry[j].author[i].name._text + ', '
            }
          }

          rawData.entry[j].title._text = deleteNewLine(rawData.entry[j].title._text)
          rawData.entry[j].title._text = prettifyFileName(rawData.entry[j].title._text)

          var singleWork = {
            id: rawData.entry[j].id._text,
            lastUpdatedDate: rawData.entry[j].updated._text,
            publishedDate: rawData.entry[j].published._text,
            title: rawData.entry[j].title._text,
            summary: rawData.entry[j].summary._text,
            authors: authors,
            downloadLink: downloadLinkHolder,
            filePath: './files/' + rawData.entry[j].title._text
          }

          singleWork.summary = deleteNewLine(singleWork.summary)

          allData.push(singleWork)

          const file = fs.createWriteStream('./files/' + singleWork.title)
          // console.log('Downloading: ' + singleWork.title)
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
                // if (j % 100 === 0) {
                //   time += 600000
                // }
                progress += chunk
                fileCounter++
                process.stdout.write('\r\x1b[K')
                process.stdout.write('Progress: ' + progress + '% Files: ' + fileCounter + ' / ' + amountOfData)
                if (fileCounter == amountOfData) {
                  csvWriter
                    .writeRecords(allData)
                    .then(() => {
                      console.log('\n data added to data.csv, Done!')
                      resolve()
                    })
                }
                resolve()
		j++
		if (j < amountOfData) {
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
                  console.log('asdfsadfasfd')
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
		  j++
		  if (amountOfData > j) {
			  setTimeout(() => {
				  fetchData(j)
			  }, time)
		  }
	  }
    })
}
