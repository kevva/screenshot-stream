'use strict';

var fs = require('fs');
var path = require('path');
var base64 = require('base64-stream');
var es5 = require.resolve('es5-shim');
var fs = require('fs');
var parseCookie = require('parse-cookie-phantomjs');
var phantomBridge = require('phantom-bridge');

module.exports = function (url, size, opts) {
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

	var cp = phantomBridge(path.join(__dirname, 'lib/index.js'), [
		'--ignore-ssl-errors=true',
		'--local-to-remote-url-access=true',
		'--ssl-protocol=any',
		JSON.stringify(opts)
	]);

	var stream = cp.stdout.pipe(base64.decode());
	var es5shim = fs.readFileSync(es5, 'utf8');

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

		if (es5shim.indexOf(data) !== -1) {
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
