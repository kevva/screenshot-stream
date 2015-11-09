/* global phantom,document,window,btoa */
'use strict';
var system = require('system');
var page = require('webpage').create();
var objectAssign = require('object-assign');
var opts = JSON.parse(system.args[1]);
var log = console.log;

function formatTrace(trace) {
	var src = trace.file || trace.sourceURL;
	var fn = (trace.function ? ' in function ' + trace.function : '');
	return '→ ' + src + ' on line ' + trace.line + fn;
}

console.log = console.error = function () {
	system.stderr.writeLine([].slice.call(arguments).join(' '));
};

if (opts.username && opts.password) {
	opts.headers = objectAssign({}, opts.headers, {
		Authorization: 'Basic ' + btoa(opts.username + ':' + opts.password)
	});
}

if (opts.userAgent) {
	page.settings.userAgent = opts.userAgent;
}

opts.cookies.forEach(function (cookie) {
	if (!phantom.addCookie(cookie)) {
		console.error('Couldn\'t add cookie: ' + JSON.stringify(cookie));
		phantom.exit(1);
	}
});

phantom.onError = function (err, trace) {
	console.error([
		'PHANTOM ERROR: ' + err,
		trace[0] ? formatTrace(trace[0]) : trace
	].join('\n'));

	phantom.exit(1);
};

page.onError = function (err, trace) {
	console.error([
		'WARN: ' + err,
		trace[0] ? formatTrace(trace[0]) : trace
	].join('\n'));
};

if (opts.es5shim) {
	page.onResourceReceived = function () {
		page.injectJs(opts.es5shim);
	};
}

page.viewportSize = {
	width: opts.width,
	height: opts.height
};

page.customHeaders = opts.headers || {};
page.zoomFactor = opts.scale;

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

	if (opts.script) {
		page.injectJs(opts.script);
	}

	window.setTimeout(function () {
		if (opts.hide) {
			page.evaluate(function (els) {
				var applyHideSelector = function (el) {
					[].forEach.call(document.querySelectorAll(el), function (e) {
						e.style.visibility = 'hidden';
					});
				};
				els.forEach(applyHideSelector);
			}, opts.hide);
		}

		if (opts.selector) {
			page.clipRect = page.evaluate(function (el) {
				return document
					.querySelector(el)
					.getBoundingClientRect();
			}, opts.selector);
		}

		log.call(console, page.renderBase64(opts.format));
		phantom.exit();
	}, opts.delay * 1000);
});
