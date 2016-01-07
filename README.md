# attractifier

[![Build Status](https://travis-ci.org/Mark-Simulacrum/attractifier.svg)](https://travis-ci.org/Mark-Simulacrum/attractifier)

Depends on [node](https://nodejs.org/).

Supports ES6/ES2015.

Attractive output is sent to STDOUT (file descriptor 1).

### Installation:
```
npm install -g attractifier
```

### Usage:
```
attractifier ugly-input.js > attractive-output.js
```

### Example:

Ugly input:
```js
let
foo
=
bar;
```

Attractive output:
```js
let foo = bar;
```
