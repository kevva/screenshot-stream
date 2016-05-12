import path from 'path';
import test from 'ava';
import imageSize from 'image-size';
import isJpg from 'is-jpg';
import isPng from 'is-png';
import PNG from 'png-js';
import getStream from 'get-stream';
import rfpify from 'rfpify';
import screenshotStream from '../';
import server from './fixtures/server';

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

test('ignore multiline page errors', async t => {
	const fixture = path.join(__dirname, 'fixtures', 'test-error-script.html');
	const stream = screenshotStream(fixture, '100x100');
	t.true(isPng(await getStream.buffer(stream)));
});

test('auth using the `username` and `password` options', async t => {
	const stream = screenshotStream('http://httpbin.org/basic-auth/user/passwd', '1024x768', {
		username: 'user',
		password: 'passwd'
	});

	const data = await rfpify(stream.once.bind(stream))('data');
	t.truthy(data.length);
});

test('have a `delay` option', async t => {
	const now = new Date();
	const stream = screenshotStream('http://yeoman.io', '1024x768', {delay: 2});
	await rfpify(stream.once.bind(stream))('data');

	t.true((new Date()) - now > 2000);
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
	const s = await server();
	const stream = screenshotStream(`${s.url}/cookies`, '100x100', {
		cookies: ['color=black; Path=/; Domain=localhost']
	});

	const png = new PNG(await getStream.buffer(stream));
	const pixels = await rfpify(png.decode.bind(png), Promise)();

	t.is(pixels[0], 0);
	await s.close();
});

test('send cookie using an object', async t => {
	const s = await server();
	const stream = screenshotStream(`${s.url}/cookies`, '100x100', {
		cookies: [{
			name: 'color',
			value: 'black',
			domain: 'localhost'
		}]
	});

	const png = new PNG(await getStream.buffer(stream));
	const pixels = await rfpify(png.decode.bind(png), Promise)();

	t.is(pixels[0], 0);
	await s.close();
});

test('send headers', async t => {
	const s = await server();

	screenshotStream(`${s.url}`, '100x100', {
		headers: {
			foobar: 'unicorn'
		}
	});

	t.is((await rfpify(s.once.bind(s), Promise)('/')).headers.foobar, 'unicorn');
	await s.close();
});

test('handle redirects', async t => {
	const s = await server();
	const stream = screenshotStream(`${s.url}/redirect`, '100x100');
	const png = new PNG(await getStream.buffer(stream));
	const pixels = await rfpify(png.decode.bind(png), Promise)();
	t.is(pixels[0], 0);
	await s.close();
});

test('resource timeout', async t => {
	const s = await server({delay: 5});
	const stream = screenshotStream(s.url, '100x100', {timeout: 1});

	await Promise.race([
		rfpify(s.once.bind(s), Promise)('/').then(() => t.fail('Expected resource timed out error')),
		t.throws(getStream(stream), `Resource timed out #1 (Network timeout on resource.) → ${s.url}/`)
	]);

	await s.close();
});
