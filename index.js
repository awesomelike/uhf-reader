const net = require('net');
const app = require('express')();
const dummy = require('./data/catalog.json');
const notifiy = require('./util/notify');
const { sendLog } = require('./util/api');
const sanitizeSet = require('./util/sanitize');
require('dotenv').config();
const { ACTIVE_MODE } = require('./constants/commands');

const SET = new Set();

const handleData = (data) => {
  const buffer = Buffer.from(data, 'ascii');
  const hash = buffer.toString('hex', 0, buffer.length);
  const book = dummy.find((object) => object.rfid === hash);
  if (book) {
    if (!SET.has(hash)) {
      console.log(hash);
      SET.add(hash);
      // sendLog(book);
      if (book.isBorrowed === false) notifiy(book);
    }
  }
};

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server started on ${port}`);
  const client = new net.Socket();
  client.setEncoding('ascii');

  client.connect(process.env.READER_PORT, process.env.READER_IP, () => {});
  console.log('Connecting: ', client.connecting);

  client.on('connect', (data) => {
    console.log('UHF Reader connected');

    // let bytes = Buffer.from([0x04, 0xff, 0x21, 0x19, 0x95], "ascii");
    client.write(ACTIVE_MODE);

    // We periodically (each 30s) clear the set
    sanitizeSet(SET);
    client.on('data', (data) => {
      handleData(data);
      client.removeListener('data', () => console.log('removeListener'));
    });

    client.on('timeout', () => {
      console.log('socket timeout!');
    });

    client.on('close', (error) => {
      console.log(client.destroyed);
      console.log('UHF Reader connection closed!', error);
    });

    client.on('error', (error) => {
      console.log(error);
    });
  });
});
