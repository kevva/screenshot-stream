'use strict';
var http = require('http');
var cookie = require('cookie');
var getPort = require('get-port');
var pify = require('pify');

module.exports = function (opts) {
	opts = opts || {};

	return getPort().then(function (port) {
		var s = http.createServer(function (req, res) {
			setTimeout(function () {
				s.emit(req.url, req, res);
			}, (opts.delay || 0) * 1000);
		});

		s.port = port;
		s.url = 'http://localhost:' + port;
		s.close = pify(s.close, Promise);

		s.on('/', function (req, res) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('<html style="background-color: black;"></html>');
		});

		s.on('/cookies', function (req, res) {
			var color = cookie.parse(req.headers.cookie).color || 'white';
			var style = [
				'background-color: ' + color + '; position: absolute;',
				'top: 0; right: 0; bottom: 0; left: 0;'
			].join(' ');

			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('<body><div style="' + style + '"></div></body>');
		});

		s.on('/redirect', function (req, res) {
			res.writeHead(302, {location: 'http://localhost:' + port + '/'});
			res.end();
		});

		s.listen(port);
		return s;
	});
};
