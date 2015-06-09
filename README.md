# pretty-generator
This pretty printer is in an experimental stage. Usage and installation
are likely to change.

Prettified output is sent to file descriptor 1.
File descriptor 3 is used for debug output.


### Usage/Installation:
```
git clone git@github.com:Mark-Simulacrum/pretty-generator.git
cd pretty-generator
npm install
npm run-script build
node ./lib/index.js input.js 1>pretty-output.js
```
