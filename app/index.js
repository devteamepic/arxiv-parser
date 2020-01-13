const express = require('express')
const axios = require('axios')
const converter = require('xml-js')
var rawData = null
var downloadLink = null
const fs = require('fs')
const request = require('request')

const app = express()
const port = 3000

app.listen(port, () => {
  console.log('app listens on port 3000')
})

axios.get('http://export.arxiv.org/api/query?search_query=all:electron')
  .then(response => {
    rawData = converter.xml2js(response.data, { compact: true, spaces: 2 }).feed
    downloadLink = rawData.entry[0].link[2]._attributes.href

    const file = fs.createWriteStream('file.pdf')
    new Promise((resolve, reject) => {
      request({
        uri: downloadLink + '.pdf',
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
