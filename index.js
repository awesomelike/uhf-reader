const net = require('net');
const app = require('express')();
const dummy = require('./dummy.json'); 

app.listen(3000, () => {
  console.log('Server started on 3000');
  
  const client = new net.Socket();
  client.setEncoding('ascii');
  
  client.connect(6000, '192.168.1.190', () => {});
  
  client.on('connect', (data) => {
    console.log('UHF Reader connected');
    
    let bytes = Buffer.from([0x04, 0xff, 0x21, 0x19, 0x95], "ascii");
    client.write(bytes);
    
    client.on('data', (data) => {
      var buffer = Buffer.from(data, "ascii");
      const hash = buffer.toString('hex', 0, buffer.length);
      const book = dummy.find((object) => object.rfid === hash);
      console.log(book ? book.name : '');      
      console.log(hash);
      console.log(buffer);
    });
    
    client.on('close', () => {
      console.log('UHF Reader connection closed!');
    });

    client.on('error', (error) => {
      console.log(error);
    });
  });
});
