'use strict';
var http = require('http');

module.exports = function (port) {
	var srv = http.createServer(function (req, res) {
		srv.emit(req.url, req, res);
	});

	srv.on('/', function (req, res) {
		res.end('<html style="background-color: black;"></html>');
	});

	srv.on('/redirect', function (req, res) {
		res.writeHead(302, {location: 'http://localhost:' + port + '/'});
		res.end();
	});

	srv.listen(port);
	return srv;
};
