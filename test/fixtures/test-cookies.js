'use strict';

var cookie = require('cookie');
var http = require('http');

/**
 * Create server and set background color
 *
 * @param {Number} port
 * @api public
 */

module.exports = function (port) {
	var srv = http.createServer(function (req, res) {
		var color = cookie.parse(req.headers.cookie).color || 'white';
		var style = [
			'background-color: ' + color + '; position: absolute;',
			'top: 0; right: 0; bottom: 0; left: 0;'
		].join(' ');

		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end('<body><div style="' + style + '"></div></body>');
	});

	srv.listen(port);
	return srv;
};
