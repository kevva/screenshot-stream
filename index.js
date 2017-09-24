'use strict';
const parseResolution = require('parse-resolution');
const puppeteer = require('puppeteer');
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

	return puppeteer.launch()
		.then(browser => browser.newPage()
		.then(page => new Screenshot(browser, page)))
		.then(Screenshot => Screenshot.authenticate(opts.username, opts.password)
		.then(() => Screenshot.setCookie(opts.cookies))
		.then(() => Screenshot.setHeaders(opts.headers))
		.then(() => Screenshot.setUserAgent(opts.userAgent))
		.then(() => Screenshot.open(url, opts))
		.then(() => Screenshot.hideElements(opts.hide))
		.then(() => Screenshot.getRect(opts.selector))
		.then(clip => Screenshot.screenshot(Object.assign(opts, clip))));
};
