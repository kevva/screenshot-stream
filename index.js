'use strict';

var base64 = require('base64-stream');
var dargs = require('dargs');
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
	opts = opts || {};
	opts.url = url;
	opts.delay = opts.delay || 0;
	opts.width = size.split(/x/i)[0];
	opts.height = size.split(/x/i)[1];
	opts.cookies = (opts.cookies || []).map(function (cookie) {
		return typeof cookie === 'string' ? parseCookie(cookie) : cookie;
	});

	var args = [
		path.join(__dirname, 'lib/index.js'),
		JSON.stringify(opts)
	];

	var excludes = [
		'cookies',
		'crop',
		'customHeaders',
		'delay',
		'height',
		'password',
		'selector',
		'url',
		'username',
		'width'
	];

	var cp = spawn(phantomjs, args.concat(dargs(opts, excludes)));
	var stream = cp.stdout.pipe(base64.decode());

	process.stderr.setMaxListeners(0);

	cp.stderr.setEncoding('utf8');
	cp.stderr.on('data', function (data) {
		if (/ phantomjs\[/.test(data)) {
			return;
		}

		if (/^WARN: /.test(data)) {
			stream.emit('warn', data.replace(/^WARN: /, ''));
			return;
		}

		if (data.trim().length) {
			stream.emit('error', new Error(data));
		}
	});

	return stream;
};
