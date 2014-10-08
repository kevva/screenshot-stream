/* global phantom */
'use strict';

var assign = require('object-assign');
var log = console.log;
var opts = JSON.parse(phantom.args[0]);
var page = require('webpage').create();
var system = require('system');

/**
 * Format trace
 *
 * @param {Object} trace
 * @api private
 */

function format(trace) {
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
		console.error('Couldn\'t add cookie: ' + cookie).trim();
		phantom.exit(1);
	}
});

/**
 * Handle PhantomJS errors
 */

phantom.onError = function (err, trace) {
	console.error([
		'PHANTOM ERROR: ' + err,
		format(trace[0])
	].join('\n').trim());

	phantom.exit(1);
};

/**
 * Handle page errors
 */

page.onError = function (err, trace) {
	console.error([
		'WARN: ' + err,
		format(trace[0])
	].join('\n').trim());
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
 * Open page
 */

page.open(opts.url, function (status) {
	if (status === 'fail') {
		console.error('Couldn\'t load url');
		phantom.exit(1);
	}

	if (opts.crop) {
		page.clipRect = {
			top: 0,
			left: 0,
			width: opts.width,
			height: opts.height
		};
	}

	if (opts.selector) {
		page.clipRect = page.evaluate(function (el) {
			return document
				.querySelector(el)
				.getBoundingClientRect();
		}, opts.selector);
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
		log.call(console, page.renderBase64('png'));
		phantom.exit();
	}, opts.delay * 1000);
});
