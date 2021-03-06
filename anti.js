const net = require('net');
const app = require('express')();
const http = require('http');
const socketIO = require('socket.io');
const notifier = require('node-notifier');
const axios = require('axios');
const { ANSWER_MODE, INVENTORY } = require('./constants/commands');
const { getByRfidTag, apiUrl } = require('./util/api');
const getTags = require('./util/getTags');

const port = process.env.PORT || 3001;

const server = http.createServer(app);
const io = socketIO(server);

require('dotenv').config();

server.listen(port, async () => {
  try {
    const response = await axios.post(`${apiUrl}/auth/login`, {
      username: process.env.API_LOGIN,
      password: process.env.API_PWD,
    });
    if (response.status === 401 || response.status === 404) {
      return console.log(response.data);
    }

    axios.defaults.headers.post.Authorization = `Bearer ${response.data.token}`;

    console.log('Logged in successfully!');
    console.log(`Listener service started on ${port}`);

    const reader = new net.Socket();

    reader.setEncoding('ascii');

    reader
      .connect(process.env.READER_PORT, process.env.READER_IP, () => {})
      .on('error', (error) => console.log(error));

    reader.on('connect', (data) => {
      console.log('UHF Reader connected');

      // Set to Answer mode
      reader.write(ANSWER_MODE);

      console.log('Client connected!');

      const SET = new Set();

      let interval;

      const message = 'RFID Lookup request received';
      console.log(message);

      // Send inventory command
      interval = setInterval(() => {
        reader.write(INVENTORY);
      }, 100);

      reader.on('data', async (data) => {
        const tags = getTags(data);
        if (Array.isArray(tags)) {
          tags.forEach(async (tag) => {
            if (!SET.has(tag)) {
              SET.add(tag);
              console.log('hash: ', tag);
              try {
                const [bookItem] = await getByRfidTag(tag, {
                  token: response.data.token,
                });
                if (bookItem) socket.emit('bookItemDetails', bookItem);
              } catch (error) {
                console.log(error);
              }
            }
          });
        }
      });

      reader.on('error', (error) => {
        console.log('UHF Reader error!', error);
      });

      reader.on('close', (error) => {
        console.log('Client destroyed:', reader.destroyed);
        console.log('UHF Reader connection closed!', error);
        clearInterval(interval);
      });
    });
  } catch (error) {
    console.error(
      'Error ocurred! Check if server is up or check your login/password...',
    );
    console.log(error);
    process.exit(-1);
  }
});
