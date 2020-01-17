const createCsvWriter = require('csv-writer').createObjectCsvWriter

const csvWriter = createCsvWriter({
  path: 'data.csv',
  header: [
    { id: 'id', title: 'id' },
    { id: 'lastUpdatedDate', title: 'updatedDate' },
    { id: 'publishedDate', title: 'publishedDate' },
    { id: 'title', title: 'title' },
    { id: 'summary', title: 'summary' },
    { id: 'authors', title: 'authors' },
    { id: 'downloadLink', title: 'downloadLink' },
    { id: 'filePath', title: 'filePath' }
  ]
})

module.exports = csvWriter
