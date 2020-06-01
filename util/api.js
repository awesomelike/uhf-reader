const axios = require('axios');

require('dotenv').config();

const apiUrl = process.env.API_URL;

const sendLog = async ({ name, isBorrowed }) => {
  axios.post(`${apiUrl}/doorLogs`, {
    bookTitle: name,
    isBorrowed: isBorrowed,
    secret: process.env.DOOR_SECRET
  })
    .then((res) => console.log('Status code:', res.status))
    .catch((error) => console.error(error));
};

module.exports = sendLog;