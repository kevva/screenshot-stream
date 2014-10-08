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

## License

MIT © [Kevin Mårtensson](https://github.com/kevva)
