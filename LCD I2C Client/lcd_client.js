const http = require('http')
const url = 'http://localhost:80/';

const LCD = require('raspberrypi-liquid-crystal');
const lcd = new LCD( 1, 0x27, 16, 2 );
lcd.beginSync();

const options = {
    protocol: 'http:',
    hostname: 'http://localhost',
    port: 80,
    path: '/',
    method: 'POST',
};

clock = 0;
lcd.printLineSync(0, 'Uptime:');
lcd.printLineSync(1, clock);

setInterval(updateClock, 1000);

function updateClock() {
    http.get(url, res => {
        let data = clock;
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          console.log("Status received: " + clock);
        })
      }).on('error', err => {
        console.log(err.message);
      }).end();

	const data = clock;
	const req = http.request(options, (res) => {
	    let data = clock;

	    res.on('data', (chunk) => {
		data += chunk;
	    });

	    res.on('end', () => {
		console.log("Status sent: " + clock);
	    });

	}).on("error", (err) => {
	    console.log("Error: ", err.message);
	});

	req.write(data);
	req.end();
}