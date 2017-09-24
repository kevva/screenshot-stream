const toughCookie = require('tough-cookie');
const fileUrl = require('file-url');
const isUrl = require('is-url-superb');
const puppeteer = require('puppeteer');

module.exports = class Screenshot {
	launch() {
		return puppeteer.launch()
			.then(browser => {
				this.browser = browser;
				return browser.newPage();
			})
			.then(page => {
				this.page = page;
				return page;
			});
	}

	authenticate(username, password) {
		if (!username || !password) {
			return Promise.resolve();
		}

		return this.page.authenticate({username, password});
	}

	getRect(selector) {
		if (!selector) {
			return Promise.resolve();
		}

		return this.page.waitForSelector(selector, {visible: true}).then(() => this.page.$eval(selector, el => {
			const {x, y, width, height} = el.getBoundingClientRect();

			return {
				fullPage: false,
				clip: {
					width,
					height,
					x,
					y
				}
			};
		}));
	}

	hideElements(selectors) {
		if (!Array.isArray(selectors) || selectors.length === 0) {
			return Promise.resolve();
		}

		return Promise.all(selectors.map(x => this.page.$eval(x, el => {
			el.style.visibility = 'hidden';
		})));
	}

	open(uri, opts) {
		if (!uri) {
			return Promise.resolve();
		}

		const url = isUrl(uri) ? uri : fileUrl(uri);

		return Promise.all([
			this.page.setViewport(opts.viewport),
			this.page.goto(url, opts)
		]);
	}

	screenshot(opts) {
		return this.page.screenshot(opts)
			.then(buf => this.browser.close()
			.then(() => buf));
	}

	setCookie(cookies) {
		if (!Array.isArray(cookies) || cookies.length === 0) {
			return Promise.resolve();
		}

		return Promise.all(cookies.map(x => {
			const cookie = typeof x === 'string' ? toughCookie.parse(x).toJSON() : x;

			return this.page.setCookie(Object.assign(cookie, {
				name: cookie.name || cookie.key
			}));
		}));
	}

	setHeaders(headers) {
		if (typeof headers !== 'object') {
			return Promise.resolve();
		}

		return this.page.setExtraHTTPHeaders(headers);
	}

	setUserAgent(userAgent) {
		if (!userAgent) {
			return Promise.resolve();
		}

		return this.page.setUserAgent(userAgent);
	}
};
