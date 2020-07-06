const getTags = (response) => {
	const buf = Buffer.from(response, 'ascii');
	const string = buf.toString('hex', 0, buf.length);
	
	const { data } = buf.toJSON();

	if (data[0] !== 5) {
		const count = data[4];
		const cleanString = string.slice(10, string.length - 4);
		return cleanString.match(/.{1,26}/g).map((str) => str.slice(2));
	}
}

module.exports = getTags;