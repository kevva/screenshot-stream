'use strict';
var path = require('path');
var concatStream = require('concat-stream');
var imageSize = require('image-size');
var isJpg = require('is-jpg');
var isPng = require('is-png');
var PNG = require('png-js');
var test = require('ava');
var screenshotStream = require('../');
var server = require('./fixtures/test-cookies.js');

test('generate screenshot', function (t) {
	t.plan(1);

	var stream = screenshotStream('http://yeoman.io', '1024x768');

	stream.pipe(concatStream(function (data) {
		t.assert(isPng(data));
	}));
});

test('crop image using the `crop` option', function (t) {
	t.plan(2);

	var stream = screenshotStream('http://yeoman.io', '1024x768', {
		crop: true
	});

	stream.pipe(concatStream(function (data) {
		t.assert(imageSize(data).width === 1024);
		t.assert(imageSize(data).height === 768);
	}));
});

test('capture a DOM element using the `selector` option', function (t) {
	t.plan(2);

	var stream = screenshotStream('http://yeoman.io', '1024x768', {
		selector: '.page-header'
	});

	stream.pipe(concatStream(function (data) {
		t.assert(imageSize(data).width === 1024);
		t.assert(imageSize(data).height === 80);
	}));
});

test('capture a DOM element using the `selector` option only after delay', function (t) {
	t.plan(2);

	var fixture = path.join(__dirname, 'fixtures', 'test-delay-element.html');
	var stream = screenshotStream(fixture, '1024x768', {
		selector: 'div',
		delay: 5
	});

	stream.pipe(concatStream(function (data) {
		t.assert(imageSize(data).width === 300);
		t.assert(imageSize(data).height === 200);
	}));
});

test('hide elements using the `hide` option', function (t) {
	t.plan(1);

	var fixture = path.join(__dirname, 'fixtures', 'test-hide-element.html');
	var stream = screenshotStream(fixture, '100x100', {
		hide: ['div']
	});

	stream.pipe(concatStream(function (data) {
		var png = new PNG(data);

		png.decode(function (pixels) {
			t.assert(pixels[0] === 255);
		});
	}));
});

test('auth using the `username` and `password` options', function (t) {
	t.plan(1);

	var stream = screenshotStream('http://httpbin.org/basic-auth/user/passwd', '1024x768', {
		username: 'user',
		password: 'passwd'
	});

	stream.on('data', function (data) {
		t.assert(data.length);
	});
});

test('have a `delay` option', function (t) {
	t.plan(1);

	var now = new Date();
	var stream = screenshotStream('http://yeoman.io', '1024x768', {
		delay: 2
	});

	stream.on('data', function (data) {
		t.assert((new Date()) - now > 2000);
	});
});

test('have a `dpi` option', function (t) {
	t.plan(2);

	var stream = screenshotStream('http://yeoman.io', '1024x768', {
		crop: true,
		scale: 2
	});

	stream.pipe(concatStream(function (data) {
		t.assert(imageSize(data).width === 1024 * 2);
		t.assert(imageSize(data).height === 768 * 2);
	}));
});

test('have a `format` option', function (t) {
	t.plan(1);

	var stream = screenshotStream('http://yeoman.io', '1024x768', {
		format: 'jpg'
	});

	stream.pipe(concatStream(function (data) {
		t.assert(isJpg(data));
	}));
});

test('send cookie', function (t) {
	t.plan(1);

	var srv = server(9000);
	var stream = screenshotStream('http://localhost:9000', '100x100', {
		cookies: ['color=black; Path=/; Domain=localhost']
	});

	stream.pipe(concatStream(function (data) {
		srv.close();
		var png = new PNG(data);

		png.decode(function (pixels) {
			t.assert(pixels[0] === 0);
		});
	}));
});

test('send cookie using an object', function (t) {
	t.plan(1);

	var srv = server(9001);
	var stream = screenshotStream('http://localhost:9001', '100x100', {
		cookies: [{
			name: 'color',
			value: 'black',
			domain: 'localhost'
		}]
	});

	stream.pipe(concatStream(function (data) {
		srv.close();
		var png = new PNG(data);

		png.decode(function (pixels) {
			t.assert(pixels[0] === 0);
		});
	}));
});
