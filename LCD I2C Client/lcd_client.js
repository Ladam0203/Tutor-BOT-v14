const http = require('http')
const url = 'http://localhost:80/';

const LCD = require('raspberrypi-liquid-crystal');
const lcd = new LCD( 1, 0x27, 16, 2 );
lcd.beginSync();

clock = 0;
lcd.printLineSync(0, 'Uptime:');
lcd.printLineSync(1, clock);

setInterval(updateClock, 1000);

function updateClock() {
    http.get(url, res => {
        let data = "";
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          if (data = "Online") {
            clock++;
            lcd.printLineSync(0, 'Uptime:');
            lcd.printLineSync(1, new Date(clock * 1000).toISOString().slice(11,19));
          }
        })
      }).on('error', err => {
        console.log(err.message);
      }).end();
}