const net = require('net');
const app = require('express')();
const http = require('http');
const socketIO = require('socket.io');
const notifier = require('node-notifier');
const { getByRfidTag, apiUrl } = require('./util/api');
const axios = require('axios');
const port = process.env.PORT || 3001;

const server = http.createServer(app);
const io = socketIO(server);

const book = {};

require('dotenv').config();

const calculateHashFromBuffer = (data) => {
  let buffer = Buffer.from(data, "ascii");
  return buffer.toString('hex', 0, buffer.length);
}

server.listen(port, async () => {
  try {
    const response = await axios.post(`${apiUrl}/auth/login`, {
      username: process.env.API_LOGIN,
      password: process.env.API_PWD,
    });
    if (response.status === 401 || response.status === 404) {
      return console.log(response.data);
    }

    axios.defaults.headers.post['Authorization'] = `Bearer ${response.data.token}`;

    console.log('Logged in successfully!');
    console.log(`Listener service started on ${port}`);
    
    const client = new net.Socket();
    
    client.setEncoding('ascii');
    
    client.connect(process.env.READER_PORT, process.env.READER_IP, () => {})
      .on('error', (error) => console.log(error));
    
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
            
          })
            .on('error', (err) => console.log(err));
        });
        
        socket.on('rfidTag', () => {
          console.log('RFID Lookup request received');
          
          notifier.notify({
            title: 'RFID lookup request received!',
            message: `RFID lookup request received`,
          });
          
          client.on('data', async (data) => {
            const hash = calculateHashFromBuffer(data);
            if (!(SET.has(hash))) {
              SET.add(hash);
              console.log('hash: ', hash);
              try {
                const [bookItem] = await getByRfidTag(hash, { token: response.data.token });
                if (bookItem) socket.emit('bookItemDetails', bookItem);  
              } catch (error) {
                console.log(error);
              }
            }
          });
        });
  
        socket.on('delete', (data) => {
          console.log('Delete request received, hash:', data.rfidTag);
          SET.delete(data.rfidTag);
        });
        
        socket.on('disconnect', () => {
          console.log('Client disconnected');
          client.removeAllListeners();
          socket.removeAllListeners();
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
  } catch (error) {
    console.error('Error ocurred! Check if server is up or check your login/password...');
    console.log(error);
    process.exit(-1);
  }
  
});