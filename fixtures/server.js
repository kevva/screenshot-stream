'use strict';
const createTestServer = require('create-test-server');
const pify = require('pify');
const toughCookie = require('tough-cookie');

module.exports = () => createTestServer().then(server => {
	server.get('/', (req, res) => {
		const style = `background-color: black; width: 100px; height: 100px;`;
		res.send(`<body style="margin: 0;"><div style="${style}"></div></body>`);
	});

	server.get('/delay', (req, res) => {
		const style = `width: 100px; height: 100px;`;
		res.send(`
			<body>
				<div style="${style}"></div>
				<script>
					window.setTimeout(function () {
						document.querySelector('div').style.display = 'block';
					}, 5000);
				</script>
			</body>
		`);
	});

	server.get('/cookie', (req, res) => {
		const color = toughCookie.parse(req.headers.cookie).value || 'white';
		const style = `
			background-color: ${color};
			bottom: 0;
			left: 0;
			position: absolute;
			right: 0;
			top: 0;
		`;

		res.send(`<body><div style="${style}"></div></body>`);
	});

	server.get('/headers', (req, res) => {
		server.emit('headers', req);
		res.end();
	});

	server.get('/redirect', (req, res) => {
		res.redirect(server.url);
	});

	server.get('/timeout/:delay', (req, res) => {
		setTimeout(() => {
			res.end();
		}, req.params.delay * 1000);
	});

	return server;
});
