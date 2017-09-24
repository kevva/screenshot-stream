# screenshot-stream [![Build Status](https://travis-ci.org/kevva/screenshot-stream.svg?branch=master)](https://travis-ci.org/kevva/screenshot-stream)

> Capture screenshot of a website and return it as a stream


## Install

```
$ npm install --save screenshot-stream
```


## Usage

```js
const fs = require('fs');
const screenshot = require('screenshot-stream');

screenshot('http://google.com', '1024x768', {crop: true}).then(data => {
	fs.writeFileSync('google.com-1024x768.png');
});
```


## API

### screenshot(url, size, [options])

#### url

Type: `string`

Add page to capture.

#### size

Type: `string`

Set viewport size.

#### options

Type: `Object`

Define options to be used.

##### crop

Type: `Boolean`<br>
Default: `false`

Crop to the set height.

##### timeout

Type: `number` *(seconds)*<br>
Default: `60`

Number of seconds after which Google Chrome aborts the request.

##### selector

Type: `string`

Capture a specific DOM element.

##### hide

Type: `Array`

Hide an array of DOM elements.

##### headers

Type: `Object`<br>
Default: `{}`

Set custom headers.

##### cookies

Type: `Array` or `Object`

A string with the same format as a [browser cookie](http://en.wikipedia.org/wiki/HTTP_cookie) or an object of what [`phantomjs.addCookie`](http://phantomjs.org/api/phantom/method/add-cookie.html) accepts.

##### username

Type: `string`

Username for authenticating with HTTP auth.

##### password

Type: `string`

Password for authenticating with HTTP auth.

##### format

Type: `string`<br>
Default: `png`

Set format to render the image as. Supported formats are `png` and `jpg`.

##### scale

Type: `number`<br>
Default: `1`

Scale webpage `n` times.

##### userAgent

Type: `string`

Set a custom user agent.

##### transparent

Type: `Boolean`<br>
Default: `false`

Set background color to `transparent` instead of `white` if no background is set.


## CLI

See the [pageres](https://github.com/sindresorhus/pageres#usage) CLI.


## License

MIT © [Kevin Mårtensson](https://github.com/kevva)
