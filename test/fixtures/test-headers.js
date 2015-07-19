'use strict';
var http = require('http');

module.exports = function (port) {
	var srv = http.createServer(function (req, res) {
		srv.emit(req.url, req, res);
	});

	srv.listen(port);
	return srv;
};
