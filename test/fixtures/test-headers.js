'use strict';
var http = require('http');

module.exports = function (port, options) {
	options = options || {};

	var srv = http.createServer(function (req, res) {
		setTimeout(function () {
			srv.emit(req.url, req, res);
		}, (options.delay || 0) * 1000);
	});

	srv.listen(port);
	return srv;
};
