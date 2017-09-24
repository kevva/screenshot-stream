'use strict';
const parseResolution = require('parse-resolution');
const Screenshot = require('./screenshot');

module.exports = (url, size, opts) => {
	const {width, height} = parseResolution(size);

	opts = Object.assign({
		cookies: [],
		format: 'png',
		fullPage: true,
		hide: [],
		scale: 1,
		viewport: {}
	}, opts);

	opts.type = opts.format === 'jpg' ? 'jpeg' : opts.format;

	opts.viewport = Object.assign({}, opts.viewport, {
		width,
		height
	});

	if (opts.crop) {
		opts.fullPage = false;
	}

	if (opts.scale !== 1) {
		opts.viewport.deviceScaleFactor = opts.scale;
	}

	if (opts.transparent) {
		opts.omitBackground = true;
	}

	const screenshot = new Screenshot();

	return screenshot.launch()
		.then(() => screenshot.authenticate(opts.username, opts.password)
		.then(() => screenshot.setCookie(opts.cookies))
		.then(() => screenshot.setHeaders(opts.headers))
		.then(() => screenshot.setUserAgent(opts.userAgent))
		.then(() => screenshot.open(url, opts))
		.then(() => screenshot.hideElements(opts.hide))
		.then(() => screenshot.getRect(opts.selector))
		.then(clip => screenshot.screenshot(Object.assign(opts, clip))));
};
