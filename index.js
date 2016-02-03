'use strict';
var fs = require('fs');
var path = require('path');
var urlMod = require('url');
var base64Stream = require('base64-stream');
var parseCookiePhantomjs = require('parse-cookie-phantomjs');
var phantomBridge = require('phantom-bridge');
var objectAssign = require('object-assign');
var byline = require('byline');

function handleCookies(cookies, url) {
	var parsedUrl = urlMod.parse(url);

	return (cookies || []).map(function (cookie) {
		var ret = typeof cookie === 'string' ? parseCookiePhantomjs(cookie) : cookie;

		if (!ret.domain) {
			ret.domain = parsedUrl.hostname;
		}

		if (!ret.path) {
			ret.path = parsedUrl.path;
		}

		return ret;
	});
}

module.exports = function (url, size, opts) {
	opts = objectAssign({
		delay: 0,
		scale: 1
	}, opts);

	opts.url = url;
	opts.width = size.split(/x/i)[0] * opts.scale;
	opts.height = size.split(/x/i)[1] * opts.scale;
	opts.format = opts.format ? opts.format : 'png';
	opts.cookies = handleCookies(opts.cookies, opts.url);

	if (opts.format === 'jpg') {
		opts.format = 'jpeg';
	}

	if (/\.css$/.test(opts.css)) {
		opts.css = fs.readFileSync(opts.css, 'utf8');
	}

	var cp = phantomBridge(path.join(__dirname, 'stream.js'), [
		'--ignore-ssl-errors=true',
		'--local-to-remote-url-access=true',
		'--ssl-protocol=any',
		JSON.stringify(opts)
	]);

	var stream = cp.stdout.pipe(base64Stream.decode());

	process.stderr.setMaxListeners(0);

	cp.stderr.setEncoding('utf8');
	byline(cp.stderr).on('data', function (data) {
		data = data.trim();

		if (/ phantomjs\[/.test(data)) {
			return;
		}

		if (/http:\/\/requirejs.org\/docs\/errors.html#mismatch/.test(data)) {
			return;
		}

		if (/^WARN: /.test(data)) {
			stream.emit('warn', data.replace(/^WARN: /, ''));
			return;
		}

		if (data.length) {
			var err = new Error(data);
			err.noStack = true;
			stream.emit('error', err);
		}
	});

	return stream;
};
