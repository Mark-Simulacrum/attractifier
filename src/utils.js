import fs from "fs";
import repeat from "lodash.repeat";
import memoize from "lodash.memoize";

import types from "./types";

class TextStream {
    constructor(input) {
        this.input = input;
        this.length = input.length;
        this.char = 0;
        this.consumed = null;
    }

    consume(regex) {
        // Will return even when the regex is empty (empty string match)
        let result = regex.exec(this.input.slice(this.char));
        if (result && result.index === 0) {
            this.consumed = result[0];
            this.char += this.consumed.length;

            return true;
        }

        return false;
    }

    consumeWhitespace() {
        return this.consume(/^\s+/);
    }

    consumeShebang() {
        return this.consume(/(^#!.*\n)|(^#!.*$)/);
    }

    consumeLineComment() {
        return this.consume(/^\/\/[^\n]*/);
    }

    consumeBlockComment() {
        return this.consume(/^\/\*[\W\S]*?\*\//);
    }

    atEnd() {
        return this.char >= this.length;
    }
}

export const isGreyspace = memoize(function (string) {
    let stream = new TextStream(string);

    while (!stream.atEnd()) {
        let consumed = stream.consumeWhitespace() ||
            stream.consumeLineComment() ||
            stream.consumeBlockComment() ||
            stream.consumeShebang();
        if (!consumed) return false;
    }

    return stream.atEnd();
});

export const parseGreyspace = memoize(function (string) {
    let parsedNodes = [];

    let stream = new TextStream(string);

    while (!stream.atEnd()) {
        if (stream.consumeWhitespace()) {
            parsedNodes.push({ type: "whitespace", value: stream.consumed });
        } else if (stream.consumeLineComment()) {
            parsedNodes.push({ type: "lineComment", value: stream.consumed });
        } else if (stream.consumeBlockComment()) {
            parsedNodes.push({ type: "blockComment", value: stream.consumed });
        } else if (stream.consumeShebang()) {
            parsedNodes.push({ type: "shebang", value: stream.consumed });
        } else {
            return false;
        }
    }

    return parsedNodes;
});

export const nestingLevelType = memoize(function (type) {
    const typeObj = { type };

    if (types.isExpression(typeObj) ||
        types.isPattern(typeObj) || types.isSingleItem(typeObj)) return "_expression_";
    if (types.isExpressionLike(typeObj))
        return `_expression_like_${type}`;

    return type;
});

export const getIndentString = memoize(function (indentLevel) {
    return repeat(" ", indentLevel * 4);
});

export let shouldWrite = true;
export function log(...messages) {
    if (!shouldWrite) return;
    let data = messages.join(" ") + "\n";
    try {
        fs.writeSync(3, data);
    } catch (error) {
        shouldWrite = false;

        if (error.code === "EBADF") {
            return;
        } else {
            throw error;
        }
    }
}

// import prettyTime from "pretty-hrtime";
// let lastTime = process.hrtime();
export function timeLogStart() {
    // lastTime = process.hrtime();
}

export function timeLog(event) {
    // let diff = process.hrtime(lastTime);
    // if (lastTime !== null) {
    //     let nanoSeconds = diff[0] * 1e9 + diff[1];
    //     if (nanoSeconds / 1000 > 100) { // Greater than 100 microseconds
    //         console.log(prettyTime(diff) + ":", event);
    //     }
    // }
    // lastTime = process.hrtime();
}
