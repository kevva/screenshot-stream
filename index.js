'use strict';

var base64 = require('base64-stream');
var es5 = require.resolve('es5-shim');
var path = require('path');
var parseCookie = require('parse-cookie-phantomjs');
var phantomjs = require('phantomjs').path;
var spawn = require('child_process').spawn;

/**
 * Screenshot stream
 *
 * @param {String} url
 * @param {String} size
 * @param {Object} opts
 * @api public
 */

module.exports = function (url, size, opts) {
	if (!phantomjs) {
		var err = new Error([
			'The automatic install of PhantomJS, which is used for generating the screenshots, seems to have failed.',
			'Try installing it manually: http://phantomjs.org/download.html'
		].join('\n'));

		err.noStack = true;
		throw err;
	}

	opts = opts || {};
	opts.url = url;
	opts.es5shim = path.relative(path.join(__dirname, 'lib'), es5);
	opts.delay = opts.delay || 0;
	opts.scale = opts.scale > 1 ? opts.scale : 1;
	opts.width = size.split(/x/i)[0] * opts.scale;
	opts.height = size.split(/x/i)[1] * opts.scale;
	opts.format = opts.format || 'png';
	opts.cookies = (opts.cookies || []).map(function (cookie) {
		return typeof cookie === 'string' ? parseCookie(cookie) : cookie;
	});

	var args = [
		'--ignore-ssl-errors=true',
		'--local-to-remote-url-access=true',
		'--ssl-protocol=any',
		path.join(__dirname, 'lib/index.js'),
		JSON.stringify(opts)
	];

	var cp = spawn(phantomjs, args);
	var stream = cp.stdout.pipe(base64.decode());

	process.stderr.setMaxListeners(0);

	cp.stderr.setEncoding('utf8');
	cp.stderr.on('data', function (data) {
		data = data.trim();

		if (/ phantomjs\[/.test(data)) {
			return;
		}

		if (/^WARN: /.test(data)) {
			stream.emit('warn', data.replace(/^WARN: /, ''));
			return;
		}

		if (data.length) {
			stream.emit('error', new Error(data));
		}
	});

	return stream;
};
