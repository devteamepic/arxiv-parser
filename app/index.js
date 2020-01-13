const axios = require('axios')

axios.get('http://export.arxiv.org/api/query?search_query=all:electron')
  .then(response => {
    console.log(response.data)
  })
