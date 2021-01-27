const net = require('net');
const app = require('express')();
const http = require('http');
const socketIO = require('socket.io');
const notifier = require('node-notifier');
const { ANSWER_MODE, INVENTORY } = require('./constants/commands');
const getTags = require('./util/getTags');

const port = process.env.PORT || 3001;

const server = http.createServer(app);
const io = socketIO(server);

require('dotenv').config();

server.listen(port, async () => {
  try {
    console.log(`Listener service started on ${port}`);

    let reader = new net.Socket();

    reader.setEncoding('ascii');

    reader
      .connect(process.env.READER_PORT, process.env.READER_IP, () => {})
      .on('error', (error) => console.log(error));

    reader.on('connect', (data) => {
      console.log('UHF Reader connected');

      // Set to Answer mode
      reader.write(ANSWER_MODE);

      io.on('connection', (socket) => {
        console.log('Client connected!');

        const SET = new Set();

        let interval;
        socket.on('bookId', (bookId) => {
          console.log(`Client sent bookId=${bookId}`);

          // Send inventory command
          interval = setInterval(() => {
            reader.write(INVENTORY);
          }, 100);

          notifier.notify({
            title: 'The reader is ready to listen',
            message: `Received book id: ${bookId}`,
          });

          reader
            .on('data', (data) => {
              const tags = getTags(data);
              if (Array.isArray(tags)) {
                tags.forEach((tag) => {
                  if (!SET.has(tag)) {
                    SET.add(tag);
                    socket.emit('bookItem', { bookId, rfidTag: tag });
                    console.log('hash: ', tag);
                  }
                });
              }
            })
            .on('error', (err) => console.log(err));
        });
        socket.on('rfidTag', () => {
          const message = 'RFID Lookup request received';
          console.log(message);

          // Send inventory command
          interval = setInterval(() => {
            reader.write(INVENTORY);
          }, 100);

          notifier.notify({
            title: message,
            message,
          });

          reader.on('data', async (data) => {
            const tags = getTags(data);
            if (Array.isArray(tags)) {
              tags.forEach(async (tag) => {
                if (!SET.has(tag)) {
                  SET.add(tag);
                  console.log('hash: ', tag);
                  try {
                    socket.emit('bookItemDetails', tag);
                  } catch (error) {
                    console.log(error);
                  }
                }
              });
            }
          });
        });

        socket.on('inventory', () => {
          const message = 'Inventory has started!';

          // Send inventory command
          interval = setInterval(() => {
            reader.write(INVENTORY);
          }, 100);

          console.log(message);

          notifier.notify({
            title: message,
            message,
          });

          reader.on('data', (data) => {
            const tags = getTags(data);
            if (Array.isArray(tags)) {
              tags.forEach((tag) => {
                if (!SET.has(tag)) {
                  SET.add(tag);
                  console.log('hash: ', tag);
                }
              });
            }
          });
          setTimeout(() => {
            clearInterval(interval);
            socket.emit('inventoryResults', { items: Array.from(SET) });
          }, 10000);
        });

        socket.on('delete', (data) => {
          console.log('Delete request received, hash:', data.rfidTag);
          SET.delete(data.rfidTag);
        });

        socket.on('disconnect', () => {
          console.log('Client disconnected');
          reader.removeAllListeners();
          socket.removeAllListeners();
          if (interval) clearInterval(interval);
          SET.clear();
        });
      });

      reader.on('error', (error) => {
        console.log('UHF Reader error!', error);
        reader = new net.Socket();

        reader.setEncoding('ascii');

        reader
          .connect(process.env.READER_PORT, process.env.READER_IP, () => {})
          .on('error', (error) => console.log(error));
        // process.exit(-1);
      });
      reader.on('timeout', () => {
        console.log('Reader connection timeout!');
        process.exit(-1);
      });
      reader.on('close', (error) => {
        console.log('Client destroyed:', reader.destroyed);
        console.log('UHF Reader connection closed!', error);
        console.log('Trying new connection...');
        reader = new net.Socket();

        reader.setEncoding('ascii');

        reader
          .connect(process.env.READER_PORT, process.env.READER_IP, () => {})
          .on('error', (error) => console.log(error));
        // process.exit(-1);
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
