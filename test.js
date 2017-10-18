import path from 'path';
import test from 'ava';
import imageSize from 'image-size';
import isJpg from 'is-jpg';
import isPng from 'is-png';
import nock from 'nock';
import pify from 'pify';
import PNG from 'png-js';
import createServer from './fixtures/server';
import screenshotStream, {startBrowser} from '.';

let browser;
let m;
let server;

test.before(async () => {
	browser = await startBrowser();
	server = await createServer();

	m = (url, opts) => screenshotStream(url, Object.assign({}, opts, {
		browser,
		keepAlive: true
	}));

	nock('http://foo.bar')
		.get('/script.js')
		.replyWithFile(200, path.join(__dirname, 'fixtures', 'script.js'))
		.get('/style.css')
		.replyWithFile(200, path.join(__dirname, 'fixtures', 'style.css'));
});

test.after(async () => {
	await browser.close();
	await server.close();
});

test('generate screenshot', async t => {
	t.true(isPng(await m(server.url, {
		width: 100,
		height: 100
	})));
});

test('crop image using the `crop` option', async t => {
	const size = imageSize(await m(server.url, {
		width: 1024,
		height: 768,
		crop: true
	}));

	t.is(size.width, 1024);
	t.is(size.height, 768);
});

test('capture a DOM element using the `selector` option', async t => {
	const size = imageSize(await m(server.url, {
		width: 1024,
		height: 768,
		selector: 'div'
	}));

	t.is(size.width, 100);
	t.is(size.height, 100);
});

test('wait for DOM element when using the `selector` option', async t => {
	const size = imageSize(await m(`${server.url}/delay`, {
		width: 1024,
		height: 768,
		selector: 'div'
	}));

	t.is(size.width, 100);
	t.is(size.height, 100);
});

test('hide elements using the `hide` option', async t => {
	const png = new PNG(await m(server.url, {
		width: 100,
		height: 100,
		hide: ['div']
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 255);
});

test('auth using the `username` and `password` options', async t => {
	t.true(isPng(await m('http://httpbin.org/basic-auth/user/passwd', {
		width: 100,
		height: 100,
		username: 'user',
		password: 'passwd'
	})));
});

test('have a `scale` option', async t => {
	const size = imageSize(await m(server.url, {
		width: 100,
		height: 100,
		crop: true,
		scale: 2
	}));

	t.is(size.width, 100 * 2);
	t.is(size.height, 100 * 2);
});

test('have a `format` option', async t => {
	t.true(isJpg(await m(server.url, {
		width: 100,
		height: 100,
		format: 'jpg'
	})));
});

test('`script` option inline', async t => {
	const png = new PNG(await m(server.url, {
		width: 100,
		height: 100,
		script: `document.querySelector('div').style.backgroundColor = 'red';`
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test('`script` option file', async t => {
	const png = new PNG(await m(server.url, {
		width: 100,
		height: 100,
		script: 'fixtures/script.js'
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test.skip('`script` option url', async t => { // eslint-disable-line ava/no-skip-test
	const png = new PNG(await m(server.url, {
		width: 100,
		height: 100,
		script: 'http://foo.bar/script.js'
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test('`style` option inline', async t => {
	const png = new PNG(await m(server.url, {
		width: 100,
		height: 100,
		style: 'div { background-color: red !important; }'
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test('`style` option file', async t => {
	const png = new PNG(await m(server.url, {
		width: 100,
		height: 100,
		style: 'fixtures/style.css'
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test.skip('`style` option url', async t => { // eslint-disable-line ava/no-skip-test
	const png = new PNG(await m(server.url, {
		width: 100,
		height: 100,
		style: 'http://foo.bar/style.css'
	}));

	console.log(png);

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();

	t.is(pixels[0], 255);
	t.is(pixels[1], 0);
	t.is(pixels[2], 0);
});

test('send cookie', async t => {
	const png = new PNG(await m(`${server.url}/cookie`, {
		width: 100,
		height: 100,
		cookies: ['color=black; Path=/; Domain=localhost']
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 0);
});

test('send cookie using an object', async t => {
	const png = new PNG(await m(`${server.url}/cookie`, {
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
});

test.skip('send headers', async t => { // eslint-disable-line ava/no-skip-test
	await m(`${server.url}`, {
		width: 100,
		height: 100,
		headers: {
			foobar: 'unicorn'
		}
	});

	t.is((await pify(server.once.bind(server), {errorFirst: false})('/headers')).headers.foobar, 'unicorn');
});

test('handle redirects', async t => {
	const png = new PNG(await m(`${server.url}/redirect`, {
		width: 100,
		height: 100
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 0);
});

test('resource timeout', async t => {
	await t.throws(m(`${server.url}/timeout/5`, {
		width: 100,
		height: 100,
		timeout: 1
	}), /1000ms exceeded/);
});
