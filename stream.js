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

// Tokens to indicate and detect the end of user script execution
var userScriptDone = false;
var userScriptEndToken = ('script' in opts) ? 'shoot-token-' + (new Date().getTime()) : '';

phantom.onError = function (err, trace) {
	// enforce end of user script to prevent dead process
	userScriptDone = true;
	console.error([
		'PHANTOM ERROR: ' + err,
		trace[0] ? formatTrace(trace[0]) : trace
	].join('\n'));

	phantom.exit(1);
};

page.onError = function (err, trace) {
	// enforce end of user script to prevent dead process
	userScriptDone = true;
	console.error([
		'WARN: ' + err,
		trace[0] ? formatTrace(trace[0]) : trace
	].join('\n'));
};

// watch for console.log message sent from page context
// to catch the end of user script
if ('script' in opts) {
	page.onConsoleMessage = function (msg) {
		if (userScriptEndToken === msg) {
			userScriptDone = true;
			console.error('TOKEN: ' + msg);
		}
	};
}

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

	var takeScreenShot = function () {
		if (opts.hide) {
			page.evaluate(function (els) {
				els.forEach(function (el) {
					[].forEach.call(document.querySelectorAll(el), function (e) {
						e.style.visibility = 'hidden';
					});
				});
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
	};

	// A timeout to prevent dead process ect
	opts.timeout = opts.timeout || 30;
	var executeScriptTimeout = setTimeout(function () {
		userScriptDone = true;
	}, opts.timeout * 1000);

	// Inject the user script to automate the page.
	// The script user will write the userScriptEndToken on console.log
	// to indicate the end of its actions.
	if ('script' in opts) {
		// Register the userScriptEndToken token on window context
		page.evaluate(function (token) {
			window.userScriptEndToken = token;
		}, userScriptEndToken);
		// Update page render with help of the user script.
		page.injectJs(opts.script);
		// By now, wait for the end of user script to take the screenshot
		setInterval(function () {
			if (userScriptDone) {
				clearTimeout(executeScriptTimeout);
				setTimeout(takeScreenShot, opts.delay * 1000);
			}
		}, 20);
	} else {
		setTimeout(takeScreenShot, opts.delay * 1000);
	}
});
