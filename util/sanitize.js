require('dotenv').config();

const intervalInSeconds = parseInt(process.env.SANITIZE_INTERVAL, 10);

const sanitizeSet = (set) => {
  setTimeout(() => {
    set.clear();
    sanitizeSet(set);
  }, intervalInSeconds * 1000);
};

module.exports = sanitizeSet;
