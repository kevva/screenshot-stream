'use strict';

var fs = require('fs');
var path = require('path');
var base64Stream = require('base64-stream');
var es5Shim = require.resolve('es5-shim');
var parseCookiePhantomjs = require('parse-cookie-phantomjs');
var phantomBridge = require('phantom-bridge');
var es5shim;

module.exports = function (url, size, opts) {
	opts = opts || {};
	opts.url = url;
	opts.delay = opts.delay || 0;
	opts.scale = opts.scale || 1;
	opts.width = size.split(/x/i)[0] * opts.scale;
	opts.height = size.split(/x/i)[1] * opts.scale;
	opts.es5shim = opts.es5shim !== false ? path.relative(path.join(__dirname, 'lib'), es5Shim) : null;
	opts.format = opts.format === 'jpg' ? 'jpeg' : opts.format ? opts.format : 'png';
	opts.cookies = (opts.cookies || []).map(function (cookie) {
		return typeof cookie === 'string' ? parseCookiePhantomjs(cookie) : cookie;
	});

	if (opts.es5shim) {
		es5shim = fs.readFileSync(es5Shim, 'utf8');
	}

	var cp = phantomBridge(path.join(__dirname, 'lib/index.js'), [
		'--ignore-ssl-errors=true',
		'--local-to-remote-url-access=true',
		'--ssl-protocol=any',
		JSON.stringify(opts)
	]);

	var stream = cp.stdout.pipe(base64Stream.decode());

	process.stderr.setMaxListeners(0);

	cp.stderr.setEncoding('utf8');
	cp.stderr.on('data', function (data) {
		data = data.trim();

		if (/ phantomjs\[/.test(data)) {
			return;
		}

		if (/http:\/\/requirejs.org\/docs\/errors.html#mismatch/.test(data)) {
			return;
		}

		if (es5shim && es5shim.indexOf(data) !== -1) {
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
