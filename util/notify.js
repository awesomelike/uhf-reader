const notifier = require('node-notifier');
const path = require('path');

const notifiy = (book) => {
  notifier.notify({
    title: 'WARNING!!! UNBORROWED BOOK IS OUT!',
    message: `Book title: ${book.name}`,
    icon: path.join(__dirname, '/../warning.png'),
  });
};

module.exports = notifiy;
