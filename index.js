'use strict';
const fileUrl = require('file-url');
const isUrl = require('is-url-superb');
const puppeteer = require('puppeteer');
const toughCookie = require('tough-cookie');

const parseCookie = cookie => {
	if (typeof cookie === 'object') {
		return cookie;
	}

	const ret = toughCookie.parse(cookie).toJSON();
	ret.name = ret.key;
	return ret;
};

const hideElement = element => {
	element.style.visibility = 'hidden';
};

const getBoundingClientRect = element => {
	const {height, width, x, y} = element.getBoundingClientRect();
	return {height, width, x, y};
};

module.exports = async (url, opts) => {
	opts = Object.assign({
		cookies: [],
		fullPage: true,
		hide: [],
		width: 1920,
		height: 1080
	}, opts);

	const uri = isUrl(url) ? url : fileUrl(url);
	const {
		cookies, crop, format, headers, height, hide, keepAlive, password, scale,
		script, selector, style, timeout, transparent, userAgent, username, width
	} = opts;

	opts.type = format === 'jpg' ? 'jpeg' : format;

	if (crop) {
		opts.fullPage = false;
	}

	if (timeout) {
		opts.timeout = timeout * 1000;
	}

	if (transparent) {
		opts.omitBackground = true;
	}

	const browser = opts.browser || await puppeteer.launch();
	const page = await browser.newPage();
	const viewport = {
		height,
		width,
		deviceScaleFactor: typeof scale === 'number' ? scale : null
	};

	if (username && password) {
		await page.authenticate({username, password});
	}

	if (Array.isArray(cookies) && cookies.length > 0) {
		await Promise.all(cookies.map(x => page.setCookie(parseCookie(x))));
	}

	if (typeof headers === 'object') {
		await page.setExtraHTTPHeaders(headers);
	}

	if (userAgent) {
		await page.setUserAgent(userAgent);
	}

	await page.setViewport(viewport);
	await page.goto(uri, opts);

	if (script) {
		const key = isUrl(script) ? 'url' : script.endsWith('.js') ? 'path' : 'content';
		await page.addScriptTag({[key]: script});
	}

	if (style) {
		const key = isUrl(style) ? 'url' : style.endsWith('.css') ? 'path' : 'content';
		await page.addStyleTag({[key]: style});

		if (isUrl(style)) {
			console.log(key, style);
		}
	}

	if (Array.isArray(hide) && hide.length > 0) {
		await Promise.all(hide.map(x => page.$eval(x, hideElement)));
	}

	if (selector) {
		await page.waitForSelector(selector, {visible: true});

		opts.clip = await page.$eval(selector, getBoundingClientRect);
		opts.fullPage = false;
	}

	const buf = await page.screenshot(opts);
	await page.close();

	if (keepAlive !== true) {
		await browser.close();
	}

	return buf;
};

module.exports.startBrowser = puppeteer.launch;
