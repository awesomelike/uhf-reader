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

const getByRfidTag = (rfidTag, { token }) => {
  return new Promise((resolve, reject) => {
    axios.get(`${apiUrl}/bookItems?rfidTag=${rfidTag}`, { headers: {
      Authorization: 'Bearer ' + token
    } 
  })
    .then(({ data }) => resolve(data))
    .catch((error) => reject(error));
  })
};

module.exports = { sendLog, getByRfidTag, apiUrl };