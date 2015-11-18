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

Define options to be used.

##### crop

Type: `boolean`  
Default: `false`

Crop to the set height.

##### delay

Type: `number` *(seconds)*  
Default: `0`

Delay capturing the screenshot. Useful when the site does things after load that you want to capture.

##### selector

Type: `string`

Capture a specific DOM element.

##### hide

Type: `array`

Hide an array of DOM elements.

##### headers

Type: `object`  
Default: `{}`

Set custom headers.

##### cookies

Type: `array` or `object`

A string with the same format as a [browser cookie](http://en.wikipedia.org/wiki/HTTP_cookie) or an object of what [`phantomjs.addCookie`](http://phantomjs.org/api/phantom/method/add-cookie.html) accepts.

##### username

Type: `string`

Username for authenticating with HTTP auth.

##### password

Type: `string`

Password for authenticating with HTTP auth.

##### format

Type: `string`  
Default: `png`

Set format to render the image as. Supported formats are `png` and `jpg`.

##### scale

Type: `number`  
Default: `1`

Scale webpage `n` times.

##### userAgent

Type: `string`

Set a custom user agent.

##### script

Type: `string`

Set a script to inject in the phantomJS process before the screenshot is taken.

##### timeout

Type: `string`

Set a timeout to execute your script.

#### .on('error', callback)

Type: `function`

PhantomJS errors.

#### .on('warn', callback)

Type: `function`

Warnings with eg. page errors.

#### .on('token', callback)

Type: `function`

The screenshot-stream token to output from your injected script when you are all done.


## Script injection

You can inject script into phantomJS process before the screenshot is made.

This script is regular javascript run in the browser.

To indicate that your script has finished his action and that the screenshot can be made,

the script will have to output the `shoot-token` on `console.log`

__demo user script__
```js
console.log('wait for 2.5 s')
setTimeout(function () {
  console.log('then sends out message to indicate its all done')
  console.log(window.pageResToken) // this line indicate the end of the script.
}, 2500);
```


## CLI

See the [pageres](https://github.com/sindresorhus/pageres#usage) CLI.


## License

MIT © [Kevin Mårtensson](https://github.com/kevva)
