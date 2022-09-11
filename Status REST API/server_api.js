const express = require('express')
const app = express()
const port = 80

app.get('/', (req, res) => {
  //res.header("Content-Type",'application/json');
  res.send("Online");
  console.log("Staus requested")
})

app.listen(port, () => {
  console.log(`WomBot Status API listening on port ${port}`)
})