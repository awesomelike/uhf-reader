const net = require('net');
const app = require('express')();
const http = require('http');
const socketIO = require('socket.io');
const sanitizeSet = require('./util/sanitize');

const port = process.env.PORT || 3001;


const server = http.createServer(app);
const io = socketIO(server);

const SET = new Set();
const book = {};

require('dotenv').config();

server.listen(port, () => {
  console.log(`Listener started on ${port}`);
  const client = new net.Socket();
  
  client.setEncoding('ascii');

  client.connect(process.env.READER_PORT, process.env.READER_IP, () => {});
  
  sanitizeSet(SET);

  client.on('connect', (data) => {
    console.log('UHF Reader connected');
    
    let bytes = Buffer.from([0x04, 0xff, 0x21, 0x19, 0x95], "ascii");
    client.write(bytes);

    io.on('connection', (socket) => {
      console.log('Client connected!');
      socket.on('bookId', (bookId) => {
        book.bookId = bookId;
        
        client.on('data', (data) => {
          let buffer = Buffer.from(data, "ascii");
          const hash = buffer.toString('hex', 0, buffer.length);
          if (!SET.has(hash)) {
            SET.add(hash); 
            socket.emit('bookItem', { bookId, rfidTag: hash });
          }
          // client.removeListener('data');
        });
      });
    });
    client.on('close', (error) => {
      console.log(client.destroyed);
      console.log('UHF Reader connection closed!', error);
    });
  });
});