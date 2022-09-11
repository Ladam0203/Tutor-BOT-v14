const express = require('express')
const app = express()
const port = 80

const data = {
  status: "Offline"
}

app.post('/', function(request, response){
  data = JSON.parse(request.body);      // your JSON
   //response.send(request.body);    // echo the result back
   console.log("Status object received.")
});

app.get('/', (req, res) => {
  //res.header("Content-Type",'application/json');
  res.send(data);
  console.log("Status object sent.")
})

app.listen(port, () => {
  console.log(`WomBot Status API listening on port ${port}`)
}) //accasd