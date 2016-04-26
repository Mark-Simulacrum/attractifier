.PHONY: check check-no-install all npm-install create-lib build-without-logging build-watch

all: npm-install build-without-logging

clean:
	-rm -r lib node_modules

npm-install:
	npm install

create-lib:
	mkdir -p lib

build-without-logging: npm-install create-lib
	node_modules/.bin/babel src/babel-plugin-strip-logging.js > lib/babel-plugin-strip-logging.js
	node_modules/.bin/babel --plugins ./lib/babel-plugin-strip-logging.js --no-comments --minified --compact true --out-dir lib src

build-watch: npm-install create-lib
	node_modules/.bin/babel --out-dir lib --watch src

check-no-install:
	node_modules/.bin/mocha --compilers js:babel-core/register tests/index.js

check: npm-install check-no-install
