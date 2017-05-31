'use strict';
const fs = require('fs');
const path = require('path');
const urlMod = require('url');
const base64Stream = require('base64-stream');
const parseCookiePhantomjs = require('parse-cookie-phantomjs');
const phantomBridge = require('phantom-bridge');
const byline = require('byline');

const handleCookies = (cookies, url) => {
	const parsedUrl = urlMod.parse(url);

	return (cookies || []).map(x => {
		const ret = typeof x === 'string' ? parseCookiePhantomjs(x) : x;

		if (!ret.domain) {
			ret.domain = parsedUrl.hostname;
		}

		if (!ret.path) {
			ret.path = parsedUrl.path;
		}

		return ret;
	});
};

module.exports = (url, size, opts) => {
	opts = Object.assign({
		delay: 0,
		scale: 1,
		format: 'png'
	}, opts);

	const args = Object.assign(opts, {
		url,
		width: size.split(/x/i)[0] * opts.scale,
		height: size.split(/x/i)[1] * opts.scale,
		cookies: handleCookies(opts.cookies, url),
		format: opts.format === 'jpg' ? 'jpeg' : opts.format,
		css: /\.css$/.test(opts.css) ? fs.readFileSync(opts.css, 'utf8') : opts.css,
		script: /\.js$/.test(opts.script) ? fs.readFileSync(opts.script, 'utf8') : opts.script
	});

	const cp = phantomBridge(path.join(__dirname, 'stream.js'), [
		'--ignore-ssl-errors=true',
		'--local-to-remote-url-access=true',
		'--ssl-protocol=any',
		JSON.stringify(args)
	]);

	const stream = base64Stream.decode();

	process.stderr.setMaxListeners(0);

	cp.stderr.setEncoding('utf8');
	cp.stdout.pipe(stream);

	byline(cp.stderr).on('data', data => {
		data = data.trim();

		if (/ phantomjs\[/.test(data)) {
			return;
		}

		if (/http:\/\/requirejs.org\/docs\/errors.html#mismatch/.test(data)) {
			return;
		}

		if (data.startsWith('WARN: ')) {
			stream.emit('warning', data.replace(/^WARN: /, ''));
			stream.emit('warn', data.replace(/^WARN: /, '')); // TODO: deprecate this event in v5
			return;
		}

		if (data.length > 0) {
			const err = new Error(data);
			err.noStack = true;
			cp.stdout.unpipe(stream);
			stream.emit('error', err);
		}
	});

	return stream;
};
