import path from 'path';
import test from 'ava';
import imageSize from 'image-size';
import isJpg from 'is-jpg';
import isPng from 'is-png';
import pify from 'pify';
import PNG from 'png-js';
import server from './fixtures/server';
import m from '.';

test('generate screenshot', async t => {
	t.true(isPng(await m('http://yeoman.io', '1024x768')));
});

test('crop image using the `crop` option', async t => {
	const size = imageSize(await m('http://yeoman.io', '1024x768', {crop: true}));
	t.is(size.width, 1024);
	t.is(size.height, 768);
});

test('capture a DOM element using the `selector` option', async t => {
	const size = imageSize(await m('http://yeoman.io', '1024x768', {selector: '.page-header'}));
	t.is(size.width, 1024);
	t.is(size.height, 80);
});

test('wait for DOM element when using the `selector` option', async t => {
	const fixture = path.join(__dirname, 'fixtures', 'test-delay-element.html');
	const size = imageSize(await m(fixture, '1024x768', {selector: 'div'}));
	t.is(size.width, 300);
	t.is(size.height, 200);
});

test('hide elements using the `hide` option', async t => {
	const fixture = path.join(__dirname, 'fixtures', 'test-hide-element.html');
	const png = new PNG(await m(fixture, '100x100', {hide: ['div']}));
	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 255);
});

test('auth using the `username` and `password` options', async t => {
	t.true(isPng(await m('http://httpbin.org/basic-auth/user/passwd', '1024x768', {
		username: 'user',
		password: 'passwd'
	})));
});

test('have a `scale` option', async t => {
	const size = imageSize(await m('http://yeoman.io', '1024x768', {
		crop: true,
		scale: 2
	}));

	t.is(size.width, 1024 * 2);
	t.is(size.height, 768 * 2);
});

test('have a `format` option', async t => {
	t.true(isJpg(await m('http://yeoman.io', '1024x768', {format: 'jpg'})));
});

test('send cookie', async t => {
	const s = await server();
	const png = new PNG(await m(`${s.url}/cookies`, '100x100', {
		cookies: ['color=black; Path=/; Domain=localhost']
	}));

	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 0);

	await s.close();
});

test('send cookie using an object', async t => {
	const s = await server();
	const png = new PNG(await m(`${s.url}/cookies`, '100x100', {
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

test('handle redirects', async t => {
	const s = await server();
	const png = new PNG(await m(`${s.url}/redirect`, '100x100'));
	const pixels = await pify(png.decode.bind(png), {errorFirst: false})();
	t.is(pixels[0], 0);
	await s.close();
});
