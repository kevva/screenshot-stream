'use strict';
const http = require('http');
const cookie = require('cookie');
const getPort = require('get-port');
const pify = require('pify');

module.exports = opts => {
	opts = opts || {};

	return getPort().then(port => {
		const s = http.createServer((req, res) => {
			setTimeout(() => {
				s.emit(req.url, req, res);
			}, (opts.delay || 0) * 1000);
		});

		s.port = port;
		s.url = `http://localhost:${port}`;
		s.close = pify(s.close);

		s.on('/', (req, res) => {
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('<html style="background-color: black;"></html>');
		});

		s.on('/cookies', (req, res) => {
			const color = cookie.parse(req.headers.cookie).color || 'white';
			const style = [
				`background-color: ${color}; position: absolute;`,
				'top: 0; right: 0; bottom: 0; left: 0;'
			].join(' ');

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end(`<body><div style="${style}"></div></body>`);
		});

		s.on('/redirect', (req, res) => {
			res.writeHead(302, {location: `http://localhost:${port}/`});
			res.end();
		});

		s.listen(port);

		return s;
	});
};
