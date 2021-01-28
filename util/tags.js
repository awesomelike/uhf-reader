// eslint-disable-next-line consistent-return
const getTags = (response) => {
  const buf = Buffer.from(response, 'ascii');
  const string = buf.toString('hex', 0, buf.length);
  const { data } = buf.toJSON();

  if (string.length >= 28) {
    const count = data[4];
    const cleanString = string.slice(10, string.length - 4);
    return cleanString
      .match(/.{1,26}/g)
      .map((str) => str.slice(2))
      .filter((str) => str.startsWith('62') && str.length === 24);
  }
};

const handler = (SET, callback) => (data) => {
  const tags = getTags(data);
  if (Array.isArray(tags)) {
    tags.forEach((tag) => {
      if (!SET.has(tag)) {
        callback(tag);
      }
    });
  }
};

module.exports = handler;
module.exports.getTags = getTags;
