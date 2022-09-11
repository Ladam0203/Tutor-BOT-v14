const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 80

app.use(bodyParser.json())

var status = {
  running: false,
  clock: -1
}

app.post('/', function(request, response){
   status = request.body;
   //response.send(status);    // echo the result back
   console.log("Status object received:" + JSON.stringify(request.body))
});

app.get('/', (request, response) => {
  response.send(JSON.stringify(status));
  console.log("Status object sent:" + JSON.stringify(status))
})

app.listen(port, () => {
  console.log(`WomBot Status API listening on port ${port}`)
}) 