import path from 'path';
import test from 'ava';
import imageSize from 'image-size';
import isJpg from 'is-jpg';
import isPng from 'is-png';
import PNG from 'png-js';
import getStream from 'get-stream';
import rfpify from 'rfpify';
import screenshotStream from '../';
import cookieServer from './fixtures/test-cookies.js';
import headersServer from './fixtures/test-headers.js';
import redirectsServer from './fixtures/test-redirects.js';

test('generate screenshot', async t => {
	const stream = screenshotStream('http://yeoman.io', '1024x768');
	t.true(isPng(await getStream.buffer(stream)));
});

test('crop image using the `crop` option', async t => {
	const stream = screenshotStream('http://yeoman.io', '1024x768', {crop: true});
	const size = imageSize(await getStream.buffer(stream));
	t.is(size.width, 1024);
	t.is(size.height, 768);
});

test('capture a DOM element using the `selector` option', async t => {
	const stream = screenshotStream('http://yeoman.io', '1024x768', {
		selector: '.page-header'
	});

	const size = imageSize(await getStream.buffer(stream));
	t.is(size.width, 1024);
	t.is(size.height, 80);
});

test('capture a DOM element using the `selector` option only after delay', async t => {
	const fixture = path.join(__dirname, 'fixtures', 'test-delay-element.html');
	const stream = screenshotStream(fixture, '1024x768', {
		selector: 'div',
		delay: 5
	});

	const size = imageSize(await getStream.buffer(stream));
	t.is(size.width, 300);
	t.is(size.height, 200);
});

test('hide elements using the `hide` option', async t => {
	const fixture = path.join(__dirname, 'fixtures', 'test-hide-element.html');
	const stream = screenshotStream(fixture, '100x100', {hide: ['div']});
	const png = new PNG(await getStream.buffer(stream));
	png.decode(pixels => t.is(pixels[0], 255));
});

test.cb('auth using the `username` and `password` options', t => {
	const stream = screenshotStream('http://httpbin.org/basic-auth/user/passwd', '1024x768', {
		username: 'user',
		password: 'passwd'
	});

	stream.once('data', data => {
		t.ok(data.length);
		t.end();
	});
});

test.cb('have a `delay` option', t => {
	const now = new Date();
	const stream = screenshotStream('http://yeoman.io', '1024x768', {delay: 2});

	stream.once('data', () => {
		t.true((new Date()) - now > 2000);
		t.end();
	});
});

test('have a `dpi` option', async t => {
	const stream = screenshotStream('http://yeoman.io', '1024x768', {
		crop: true,
		scale: 2
	});

	const size = imageSize(await getStream.buffer(stream));
	t.is(size.width, 1024 * 2);
	t.is(size.height, 768 * 2);
});

test('have a `format` option', async t => {
	const stream = screenshotStream('http://yeoman.io', '1024x768', {format: 'jpg'});
	t.true(isJpg(await getStream.buffer(stream)));
});

test('have a `css` option', async t => {
	const stream = screenshotStream('http://yeoman.io', '1024x768', {css: '.mobile-bar { background-color: red !important; }'});
	const png = new PNG(await getStream.buffer(stream));
	const pixels = await rfpify(png.decode.bind(png), Promise)();
	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test('have a `css` file', async t => {
	const stream = screenshotStream('http://yeoman.io', '1024x768', {css: 'fixtures/style.css'});
	const png = new PNG(await getStream.buffer(stream));
	const pixels = await rfpify(png.decode.bind(png), Promise)();
	t.is(pixels[0], 0);
	t.is(pixels[1], 128);
	t.is(pixels[2], 0);
});

test('send cookie', async t => {
	const srv = cookieServer(9000);
	const stream = screenshotStream('http://localhost:9000', '100x100', {
		cookies: ['color=black; Path=/; Domain=localhost']
	});

	const png = new PNG(await getStream.buffer(stream));
	srv.close();
	png.decode(pixels => t.is(pixels[0], 0));
});

test('send cookie using an object', async t => {
	const srv = cookieServer(9001);
	const stream = screenshotStream('http://localhost:9001', '100x100', {
		cookies: [{
			name: 'color',
			value: 'black',
			domain: 'localhost'
		}]
	});

	const png = new PNG(await getStream.buffer(stream));
	srv.close();
	png.decode(pixels => t.is(pixels[0], 0));
});

test.cb('send headers', t => {
	const srv = headersServer(9002);

	screenshotStream('http://localhost:9002', '100x100', {
		headers: {
			foobar: 'unicorn'
		}
	});

	srv.on('/', req => {
		srv.close();
		t.is(req.headers.foobar, 'unicorn');
		t.end();
	});
});

test('handle redirects', async t => {
	const srv = redirectsServer(9003);
	const stream = screenshotStream('http://localhost:9003/redirect', '100x100');
	const png = new PNG(await getStream.buffer(stream));
	srv.close();
	png.decode(pixels => t.is(pixels[0], 0));
});
