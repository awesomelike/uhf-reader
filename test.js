const net = require('net');
const app = require('express')();
const http = require('http');
const { ANSWER_MODE, INVENTORY } = require('./constants/commands');
const getTags = require('./util/getTags');

require('dotenv').config();

const server = http.createServer(app);
const port = process.env.PORT || 3001;

server.listen(port, async () => {
	try {
		console.log(`Listener service started on ${port}`);

		const client = new net.Socket();
		client.setEncoding('ascii');

		client
			.connect(process.env.READER_PORT, process.env.READER_IP, () => {})
			.on('error', (error) => console.log(error));

		client.on('connect', (data) => {
			console.log('UHF Reader connected');
			
			// Set to Answer mode
			client.write(ANSWER_MODE);
			
			// Send inventory command
			setInterval(() => {
				client.write(INVENTORY);
			}, 100);
			
			const SET = new Set();

			client
				.on('data', (data) => {
					const tags = getTags(data);
					if (Array.isArray(tags)) {
						tags.forEach((tag) => {
							if (!SET.has(tag)) {
								SET.add(tag);
								console.log('hash: ', tag);
							}
						});
					}
				})
				.on('error', (err) => console.log(err));

			client.on('error', (error) => {
				console.log('UHF Reader error!', error);
			});

			client.on('close', (error) => {
				console.log('Client destroyed:', client.destroyed);
				console.log('UHF Reader connection closed!', error);
			});
		});
	} catch (error) {
		console.error(
			'Error ocurred! Check if server is up or check your login/password...'
		);
		console.log(error);
		process.exit(-1);
	}
});
