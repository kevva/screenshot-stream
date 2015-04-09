# screenshot-stream [![Build Status](http://img.shields.io/travis/kevva/screenshot-stream.svg?style=flat)](https://travis-ci.org/kevva/screenshot-stream)

> Capture screenshot of a website and return it as a stream


## Install

```
$ npm install --save screenshot-stream
```


## Usage

```js
var fs = require('fs');
var screenshot = require('screenshot-stream');

var stream = screenshot('http://google.com', '1024x768', {crop: true});

stream.pipe(fs.createWriteStream('google.com-1024x768.png'));
```


## API

### screenshot(url, size, options)

#### url

Type: `string`

Add page to capture.

#### size

Type: `string`

Set viewport size.

#### options

Type: `object`

Define [options](#options) to be used.

#### .on('error', callback)

Type: `function`

PhantomJS errors.

#### .on('warn', callback)

Type: `function`

Warnings with eg. page errors.


## Options

### crop

Type: `boolean`  
Default: `false`

Crop to the set height.

### delay

Type: `number` *(seconds)*  
Default: `0`

Delay capturing the screenshot. Useful when the site does things after load that you want to capture.

### selector

Type: `string`

Capture a specific DOM element.

### hide

Type: `array`

Hide an array of DOM elements.

### customHeaders

Type: `object`  
Default: `{}`

Set custom headers.

### cookies

Type: `array` or `object`

A string with the same format as a [browser cookie](http://en.wikipedia.org/wiki/HTTP_cookie) or an object of what [`phantomjs.addCookie`](http://phantomjs.org/api/phantom/method/add-cookie.html) accepts.

### username

Type: `string`

Username for authenticating with HTTP auth.

### password

Type: `string`

Password for authenticating with HTTP auth.

### format

Type: `string`  
Default: `png`

Set format to render the image as. Supported formats are `png` and `jpg`.

### scale

Type: `number`  
Default: `1`

Scale webpage `n` times.

### userAgent

Type: `string`

Set a custom user agent.


## CLI

See the [pageres](https://github.com/sindresorhus/pageres#usage) CLI.


## License

MIT © [Kevin Mårtensson](https://github.com/kevva)
