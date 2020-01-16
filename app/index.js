const express = require('express')
const axios = require('axios')
const converter = require('xml-js')
const fs = require('fs')
const request = require('request')

var rawData = null

const app = express()
const port = 3000
const separators = [' ', '\\+', '-', '\\(', '\\)', '\\*', '/', ':', '\\?']

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
  console.log('app listens on port 3000')
})

axios.get('http://export.arxiv.org/api/query?search_query=all:electron')
  .then(response => {
    rawData = converter.xml2js(response.data, { compact: true, spaces: 2 }).feed

    var authors = []
    for (var i = 0; i < rawData.entry[0].author.length; i++) {
      authors.push({ name: rawData.entry[0].author[i].name._text })
    }

    var singleWork = {
      id: rawData.entry[0].id._text,
      lastUpdatedDate: rawData.entry[0].updated._text,
      publishedDate: rawData.entry[0].published._text,
      title: rawData.entry[0].title._text,
      summary: rawData.entry[0].summary._text,
      journalRef: rawData.entry[0]['arxiv:journal_ref']._text,
      authors: authors,
      downloadLink: rawData.entry[0].link[2]._attributes.href + '.pdf'
    }

    singleWork.title = prettifyFileName(singleWork.title)
    singleWork.summary = deleteNewLine(singleWork.summary)

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
          console.log('The file is finished downloading.')
          resolve()
        })
        .on('error', (error) => {
          reject(error)
        })
    })
      .catch(error => {
        console.log(`Something happened: ${error}`)
      })
  })
