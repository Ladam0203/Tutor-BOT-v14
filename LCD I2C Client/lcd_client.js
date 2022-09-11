const http = require('http')
const url = 'http://localhost:80/';

const LCD = require('raspberrypi-liquid-crystal');
const lcd = new LCD( 1, 0x27, 16, 2 );
lcd.beginSync();

clock = 0;

const status = {
    running: true,
    clock: clock
}

lcd.printLineSync(0, 'Uptime:');
lcd.printLineSync(1, clock);

setInterval(updateLCD, 1000);

function updateLCD() {
    postStatus(status);
    status = getStatus();
}

function postStatus(status) {
    const options = {
      protocol: 'http:',
      hostname: 'localhost',
      port: 80,
      path: '/',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
      }
  };


  const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
          data += chunk;
      });

      res.on('end', () => {
          console.log("Status sent");
      });

  }).on("error", (err) => {
      console.log("Error: ", err.message);
  });

  req.write(status);
  req.end();
}

function getStatus(status) {
  http.get(url, (res) => {
    let data = '';

    // called when a data chunk is received.
    res.on('data', (chunk) => {
        data += chunk;
    });

    // called when the complete response is received.
    res.on('end', () => {
        console.log("Status received");
    });

    }).on("error", (err) => {
        console.log("Error: ", err.message);
    });

    return data;
}