# screenshot-stream [![Build Status](http://img.shields.io/travis/kevva/screenshot-stream.svg?style=flat)](https://travis-ci.org/kevva/screenshot-stream)

> Capture screenshot of a website and return it as a stream

## Install

```sh
$ npm install --save screenshot-stream
```

## Usage

```js
var fs = require('fs');
var screenshot = require('screenshot-stream');

var stream = screenshot('http://google.com', '1024x768', {
	crop: true
});

stream.pipe(fs.createWriteStream('google.com-1024x768.png'));
```

## Options

### cookies

Type: `Array|Object`

A string with the same format as a [browser cookie](http://en.wikipedia.org/wiki/HTTP_cookie) or an object of what [`phantomjs.addCookie`](http://phantomjs.org/api/phantom/method/add-cookie.html) accepts.

### crop

Type: `Boolean`  
Default: `false`

Crop to the set height.

### customHeaders

Type: `Object`  
Default: `{}`

Set custom headers.

### delay

Type: `Number` *(seconds)*  
Default: `0`

Delay capturing the screenshot. Useful when the site does things after load that you want to capture.

### selector

Type: `String`

Capture a specific DOM element.

## License

MIT © [Kevin Mårtensson](https://github.com/kevva)
