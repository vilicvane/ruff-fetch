A simplified version of `window.fetch`.

GitHub <https://github.com/vilic/ruff-fetch>

## Install

```sh
rap install fetch
```

## Usage

Here's a simple example:

```js
var fetch = require('fetch');

fetch('http://baidu.com')
    .then(response => response.text())
    .then(text => console.log(text));
```

Please refer to source code for supported APIs.

## License

MIT License.
