require('dotenv').config();
const intervalInSeconds = process.env.SANITIZE_INTERVAL;

const sanitizeSet = (set) => {
  setTimeout(() => {
    set.clear();
    sanitizeSet(set);
  }, intervalInSeconds * 1000);
}

module.exports = sanitizeSet;