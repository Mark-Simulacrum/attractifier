# pretty-generator
Pretty generator is in an experimental stage.
Usage and installation are likely to change.

Prettified output is sent to STDOUT (file descriptor 1).

### Installation:
```
git clone git@github.com:Mark-Simulacrum/pretty-generator.git
cd pretty-generator
make
```

### Usage:
Usage assumes working directory to be root of the repository (pretty-generator from installation).
```
node ./lib/index.js input.js > pretty-output.js
```
