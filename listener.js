const net = require('net');
const app = require('express')();
const http = require('http');
const socketIO = require('socket.io');
const notifier = require('node-notifier');
const { getByRfidTag } = require('./util/api');

const port = process.env.PORT || 3001;

const server = http.createServer(app);
const io = socketIO(server);

const book = {};

require('dotenv').config();

const calculateHashFromBuffer = (data) => {
  let buffer = Buffer.from(data, "ascii");
  return buffer.toString('hex', 0, buffer.length);
}

server.listen(port, () => {
  console.log(`Listener started on ${port}`);
  const client = new net.Socket();
  
  client.setEncoding('ascii');
  
  client.connect(process.env.READER_PORT, process.env.READER_IP, () => {});
  
  client.on('connect', (data) => {
    console.log('UHF Reader connected');
    
    let bytes = Buffer.from([0x04, 0xff, 0x21, 0x19, 0x95], "ascii");
    client.write(bytes);
    
    io.on('connection', (socket) => {
      console.log('Client connected!');
      const SET = new Set();

      socket.on('bookId', (bookId) => {
        console.log(`Client sent bookId=${bookId}`);
        book.bookId = bookId;
        
        notifier.notify({
          title: 'The reader is ready to listen',
          message: `Received book id: ${bookId}`,
        });
        
        client.on('data', (data) => {
          
          const hash = calculateHashFromBuffer(data);
	  
          if (!(SET.has(hash))) {
            SET.add(hash);
	          console.log('hash: ', hash); 
            socket.emit('bookItem', { bookId, rfidTag: hash });
          }
          
        });
      });
      
      socket.on('rfidTag', () => {
        client.on('data', (data) => {
          const hash = calculateHashFromBuffer(data);
          const bookItem = await getByRfidTag(hash);
          socket.emit('bookItemDetails', bookItem);
        });
      });

      socket.on('delete', (data) => {
        console.log('Delete request received, hash:', data.rfidTag);
        SET.delete(data.rfidTag);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
        client.removeAllListeners();
        SET.clear();  
      });

      socket.on('error', (error) => {
        console.log('Socket error:', error);
      });

    });
    
    client.on('error', (error) => {
      console.log('UHF Reader error!', error);
    });

    client.on('close', (error) => {
      console.log('Client destroyed:', client.destroyed);
      console.log('UHF Reader connection closed!', error);
    });
  });
});