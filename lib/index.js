/* global phantom */
'use strict';

var system = require('system');
var page = require('webpage').create();
var assign = require('object-assign');
var opts = JSON.parse(system.args[1]);
var log = console.log;

/**
 * Format trace
 *
 * @param {Object} trace
 * @api private
 */

function formatTrace(trace) {
	var src = trace.file || trace.sourceURL;
	var fn = (trace.function ? ' in function ' + trace.function : '');
	return '→ ' + src + ' on line ' + trace.line + fn;
}

/**
 * Make sure phantom never outputs to stdout
 */

console.log = console.error = function () {
	system.stderr.writeLine([].slice.call(arguments).join(' '));
};

/**
 * Add HTTP auth
 */

if (opts.username && opts.password) {
	opts.customHeaders = assign({}, opts.customHeaders, {
		'Authorization': 'Basic ' + btoa(opts.username + ':' + opts.password)
	});
}

/**
 * Add cookies
 */

opts.cookies.forEach(function (cookie) {
	if (!phantom.addCookie(cookie)) {
		console.error('Couldn\'t add cookie: ' + cookie);
		phantom.exit(1);
	}
});

/**
 * Handle PhantomJS errors
 */

phantom.onError = function (err, trace) {
	console.error([
		'PHANTOM ERROR: ' + err,
		formatTrace(trace[0])
	].join('\n'));

	phantom.exit(1);
};

/**
 * Handle page errors
 */

page.onError = function (err, trace) {
	console.error([
		'WARN: ' + err,
		formatTrace(trace[0])
	].join('\n'));
};

/**
 * Include es5-shim
 */

page.onResourceReceived = function () {
	page.injectJs(opts.es5shim);
};

/**
 * Set viewport size
 */

page.viewportSize = {
	width: opts.width,
	height: opts.height
};

/**
 * Set custom headers
 */

page.customHeaders = opts.customHeaders || {};

/**
 * Set zoom factor
 */

page.zoomFactor = opts.scale;

/**
 * Open page
 */

page.open(opts.url, function (status) {
	if (status === 'fail') {
		console.error('Couldn\'t load url: ' + opts.url);
		phantom.exit(1);
		return;
	}

	if (opts.crop) {
		page.clipRect = {
			top: 0,
			left: 0,
			width: opts.width,
			height: opts.height
		};
	}

	page.evaluate(function () {
		var bgColor = window
			.getComputedStyle(document.body)
			.getPropertyValue('background-color');

		if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)') {
			document.body.style.backgroundColor = 'white';
		}
	});

	window.setTimeout(function () {
		if (opts.selector) {
			page.clipRect = page.evaluate(function (el) {
				return document
					.querySelector(el)
					.getBoundingClientRect();
			}, opts.selector);
		}

		if (opts.hide) {
			page.evaluate(function(hideSelectors) {
				Array.prototype.forEach.call(document.querySelectorAll(hideSelectors), function(el) {
					el.style.visibility = 'hidden';
				})

			}, opts.hide);
		}

		log.call(console, page.renderBase64(opts.format));
		phantom.exit();
	}, opts.delay * 1000);
});
