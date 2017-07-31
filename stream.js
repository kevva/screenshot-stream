/* global phantom, document, window, btoa */
'use strict';
var system = require('system');
var page = require('webpage').create();
var objectAssign = require('object-assign');

var opts = JSON.parse(system.args[1]);
var log = console.log;

function formatTrace(trace) {
	var src = trace.file || trace.sourceURL;
	var fn = (trace.function ? ' in function ' + trace.function : '');
	return ' → ' + src + ' on line ' + trace.line + fn;
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

page.settings.resourceTimeout = (opts.timeout || 60) * 1000;

phantom.cookies = opts.cookies;

phantom.onError = function (err, trace) {
	err = err.replace(/\n/g, '');
	console.error('PHANTOM ERROR: ' + err + formatTrace(trace[0]));
	phantom.exit(1);
};

page.onError = function (err, trace) {
	err = err.replace(/\n/g, '');
	console.error('WARN: ' + err + formatTrace(trace[0]));
};

page.onResourceError = function (resourceError) {
	console.error('WARN: Unable to load resource #' + resourceError.id + ' (' + resourceError.errorString + ') → ' + resourceError.url);
};

page.onResourceTimeout = function (resourceTimeout) {
	console.error('Resource timed out #' + resourceTimeout.id + ' (' + resourceTimeout.errorString + ') → ' + resourceTimeout.url);
	phantom.exit(1);
};

page.viewportSize = {
	width: opts.width,
	height: opts.height
};

page.customHeaders = opts.headers || {};
page.zoomFactor = opts.scale;

var previousCount = 0;
var previousPage = null;

function pageOnLoadFinished(status) {
	if (status === 'fail') {
		console.error('Couldn\'t load url: ' + opts.url);
		phantom.exit(1);
		return;
	}

	if (previousPage === page.url) {
		if (++ previousCount > 3) {
			console.error('Loop detected: ' + page.url);
			phantom.exit(1);
			return;
		}
	} else {
	   previousPage = page.url;
	   previousCount = 0;
	}

	var threshold = 10;
	var refresh = page.evaluate(function(threshold) {
		var patternMetaContent = /^\s*(\d+)(?:\s*;(?:\s*url\s*=)?\s*(.+)?)?$/i;
		var parseMetaRefresh = function (content) {
			// base code from https://github.com/stevenvachon/http-equiv-refresh
			var result = { timeout: null, url: null };

			content = patternMetaContent.exec(content);

			if (content === null) {
				return result;
			}

			if (content[1] !== undefined) {
				result.timeout = parseInt( content[1] );
			}

			if (content[2] !== undefined) {
				var url = (content[2] + '').trim();

				if (url.length) {
					var firstChar = url[0];
					var lastChar  = url[url.length-1];

					// Remove a single level of encapsulating quotes
					if (firstChar==="'" && lastChar==="'" || firstChar==='"' && lastChar==='"') {
						if (url.length > 2) {
							url = url.substr(1, url.length-2).trim();
						}
					}
				}

				if (url.length) {
					result.url = url;
				}
			}

			return result;
		};

		var metas = [];
		var tags = document.head.querySelectorAll('[http-equiv="refresh"]');
		for (var i = 0, len = tags.length; i < len; ++ i) {
			if (tags[i].tagName === 'META') {
			  metas.push(tags[i].content || tags[i].CONTENT);
			}
		};

		var refresh = null;
		var minTime = Number.POSITIVE_INFINITY;
		var i = 0;

		for (var i = 0, len = metas.length; i < len; ++ i) {
			var currRefresh = parseMetaRefresh(metas[i]);

			if (currRefresh.timeout <= threshold && currRefresh.timeout < minTime) {
				minTime = currRefresh.timeout;
				refreshUrl = currRefresh; // currRefresh.url could be null
			}
		}

		return refreshUrl;
	}, threshold);

	if (null !== refresh) {
		page.onLoadFinished = pageOnLoadFinished;

		if (refresh.timeout > 0) { // when is 0, is already triggered by phantom apparently
			page.evaluate(function (refresh) {
				if (null === refresh.url) {
					window.location.reload();
				} else {
					window.location.replace(refresh.url);
				}
			}, refresh);
		}
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

	page.evaluate(function (css, transparent) {
		var bgColor = window
			.getComputedStyle(document.body)
			.getPropertyValue('background-color');

		if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)') {
			document.body.style.backgroundColor = transparent ? 'transparent' : 'white';
		}

		if (css) {
			var el = document.createElement('style');
			el.appendChild(document.createTextNode(css));
			document.head.appendChild(el);
		}
	}, opts.css, opts.transparent);

	window.setTimeout(function () {
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
			var clipRect = page.evaluate(function (el) {
				return document
					.querySelector(el)
					.getBoundingClientRect();
			}, opts.selector);

			clipRect.height *= page.zoomFactor;
			clipRect.width *= page.zoomFactor;
			clipRect.top *= page.zoomFactor;
			clipRect.left *= page.zoomFactor;

			page.clipRect = clipRect;
		}

		if (opts.script) {
			page.evaluateJavaScript('function () { ' + opts.script + '}');
		}

		log.call(console, page.renderBase64(opts.format));
		phantom.exit();
	}, opts.delay * 1000);
}

page.onLoadFinished = pageOnLoadFinished;
page.open(opts.url);
