import path from 'path';
import concatStream from 'concat-stream';
import imageSize from 'image-size';
import isJpg from 'is-jpg';
import isPng from 'is-png';
import PNG from 'png-js';
import test from 'ava';
import screenshotStream from '../';
import cookieServer from './fixtures/test-cookies.js';
import headersServer from './fixtures/test-headers.js';

test('generate screenshot', t => {
	t.plan(1);

	const stream = screenshotStream('http://yeoman.io', '1024x768');

	stream.pipe(concatStream(data => t.true(isPng(data))));
});

test('crop image using the `crop` option', t => {
	t.plan(2);

	const stream = screenshotStream('http://yeoman.io', '1024x768', {
		crop: true
	});

	stream.pipe(concatStream(data => {
		t.is(imageSize(data).width, 1024);
		t.is(imageSize(data).height, 768);
	}));
});

test('capture a DOM element using the `selector` option', t => {
	t.plan(2);

	const stream = screenshotStream('http://yeoman.io', '1024x768', {
		selector: '.page-header'
	});

	stream.pipe(concatStream(data => {
		t.is(imageSize(data).width, 1024);
		t.is(imageSize(data).height, 80);
	}));
});

test('capture a DOM element using the `selector` option only after delay', t => {
	t.plan(2);

	const fixture = path.join(__dirname, 'fixtures', 'test-delay-element.html');
	const stream = screenshotStream(fixture, '1024x768', {
		selector: 'div',
		delay: 5
	});

	stream.pipe(concatStream(data => {
		t.is(imageSize(data).width, 300);
		t.is(imageSize(data).height, 200);
	}));
});

test('hide elements using the `hide` option', t => {
	t.plan(1);

	const fixture = path.join(__dirname, 'fixtures', 'test-hide-element.html');
	const stream = screenshotStream(fixture, '100x100', {
		hide: ['div']
	});

	stream.pipe(concatStream(data => {
		const png = new PNG(data);
		png.decode(pixels => t.is(pixels[0], 255));
	}));
});

test('auth using the `username` and `password` options', t => {
	t.plan(1);

	const stream = screenshotStream('http://httpbin.org/basic-auth/user/passwd', '1024x768', {
		username: 'user',
		password: 'passwd'
	});

	stream.on('data', data => t.ok(data.length));
});

test('have a `delay` option', t => {
	t.plan(1);

	const now = new Date();
	const stream = screenshotStream('http://yeoman.io', '1024x768', {
		delay: 2
	});

	stream.once('data', () => t.true((new Date()) - now > 2000));
});

test('have a `dpi` option', t => {
	t.plan(2);

	const stream = screenshotStream('http://yeoman.io', '1024x768', {
		crop: true,
		scale: 2
	});

	stream.pipe(concatStream(data => {
		t.is(imageSize(data).width, 1024 * 2);
		t.is(imageSize(data).height, 768 * 2);
	}));
});

test('have a `format` option', t => {
	t.plan(1);

	const stream = screenshotStream('http://yeoman.io', '1024x768', {
		format: 'jpg'
	});

	stream.pipe(concatStream(data => t.true(isJpg(data))));
});

test('send cookie', t => {
	t.plan(1);

	const srv = cookieServer(9000);
	const stream = screenshotStream('http://localhost:9000', '100x100', {
		cookies: ['color=black; Path=/; Domain=localhost']
	});

	stream.pipe(concatStream(data => {
		srv.close();
		const png = new PNG(data);
		png.decode(pixels => t.is(pixels[0], 0));
	}));
});

test('send cookie using an object', t => {
	t.plan(1);

	const srv = cookieServer(9001);
	const stream = screenshotStream('http://localhost:9001', '100x100', {
		cookies: [{
			name: 'color',
			value: 'black',
			domain: 'localhost'
		}]
	});

	stream.pipe(concatStream(data => {
		srv.close();
		const png = new PNG(data);
		png.decode(pixels => t.is(pixels[0], 0));
	}));
});

test('send headers', t => {
	t.plan(1);

	const srv = headersServer(9002);

	screenshotStream('http://localhost:9002', '100x100', {
		headers: {
			foobar: 'unicorn'
		}
	});

	srv.on('/', req => {
		srv.close();
		t.is(req.headers.foobar, 'unicorn');
	});
});
