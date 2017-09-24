import path from 'path';
import test from 'ava';
import imageSize from 'image-size';
import isJpg from 'is-jpg';
import isPng from 'is-png';
import pify from 'pify';
import PNG from 'png-js';
import server from './fixtures/server';
import screenshotStream, {startBrowser} from '.';

let browser;
let m;

test.before(async () => {
	browser = await startBrowser();

	m = (url, opts) => screenshotStream(url, Object.assign({}, opts, {
		browser,
		keepAlive: true
	}));
});

test.after(async () => {
	await browser.close();
});

test('generate screenshot', async t => {
	t.true(isPng(await m('http://yeoman.io', {
		width: 1024,
		height: 768
	})));
});

test('crop image using the `crop` option', async t => {
	const size = imageSize(await m('http://yeoman.io', {
		width: 1024,
		height: 768,
		crop: true
	}));

	t.is(size.width, 1024);
	t.is(size.height, 768);
});

test('capture a DOM element using the `selector` option', async t => {
	const size = imageSize(await m('http://yeoman.io', {
		width: 1024,
		height: 768,
		selector: '.page-header'
	}));

	t.is(size.width, 1024);
	t.is(size.height, 80);
});

test('wait for DOM element when using the `selector` option', async t => {
	const fixture = path.join(__dirname, 'fixtures', 'test-delay-element.html');
	const size = imageSize(await m(fixture, {
		width: 1024,
		height: 768,
		selector: 'div'
	}));

	t.is(size.width, 300);
	t.is(size.height, 200);
});

test('hide elements using the `hide` option', async t => {
	const fixture = path.join(__dirname, 'fixtures', 'test-hide-element.html');
	const png = new PNG(await m(fixture, {
		width: 100,
		height: 100,
		hide: ['div']
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 255);
});

test('auth using the `username` and `password` options', async t => {
	t.true(isPng(await m('http://httpbin.org/basic-auth/user/passwd', {
		width: 1024,
		height: 768,
		username: 'user',
		password: 'passwd'
	})));
});

test('have a `scale` option', async t => {
	const size = imageSize(await m('http://yeoman.io', {
		width: 1024,
		height: 768,
		crop: true,
		scale: 2
	}));

	t.is(size.width, 1024 * 2);
	t.is(size.height, 768 * 2);
});

test('have a `format` option', async t => {
	t.true(isJpg(await m('http://yeoman.io', {
		width: 1024,
		height: 768,
		format: 'jpg'
	})));
});

test.failing('have a `script` option', async t => {
	const png = new PNG(await m('http://yeoman.io', {
		width: 1024,
		height: 768,
		script: `document.querySelector('.mobile-bar).style.backgroundColor = red;`
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test.failing('have a `js` file', async t => {
	const png = new PNG(await m('http://yeoman.io', {
		width: 1024,
		height: 768,
		script: 'fixtures/script.js'
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 0);
	t.is(pixels[1], 128);
	t.is(pixels[2], 0);
});

test('send cookie', async t => {
	const s = await server();
	const png = new PNG(await m(`${s.url}/cookies`, {
		width: 100,
		height: 100,
		cookies: ['color=black; Path=/; Domain=localhost']
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 0);

	await s.close();
});

test('send cookie using an object', async t => {
	const s = await server();
	const png = new PNG(await m(`${s.url}/cookies`, {
		width: 100,
		height: 100,
		cookies: [{
			name: 'color',
			value: 'black',
			domain: 'localhost'
		}]
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 0);

	await s.close();
});

test.skip('send headers', async t => { // eslint-disable-line ava/no-skip-test
	const s = await server();

	await m(`${s.url}`, {
		width: 100,
		height: 100,
		headers: {
			foobar: 'unicorn'
		}
	});

	t.is((await pify(s.once.bind(s), {errorFirst: false})('/')).headers.foobar, 'unicorn');
	await s.close();
});

test('handle redirects', async t => {
	const s = await server();
	const png = new PNG(await m(`${s.url}/redirect`, {
		width: 100,
		height: 100
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 0);

	await s.close();
});

test('resource timeout', async t => {
	const s = await server({delay: 5});
	await t.throws(m(`${s.url}`, {
		width: 100,
		height: 100,
		timeout: 1
	}), /1000ms exceeded/);

	await s.close();
});
