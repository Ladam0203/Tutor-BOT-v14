const http = require('http')
const url = 'http://localhost:80/';
http.get(url, res => {
  let data = "";
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    data = JSON.parse(data);
    console.log(data);
  })
}).on('error', err => {
  console.log(err.message);
}).end();