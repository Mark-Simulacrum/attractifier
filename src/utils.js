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


export const isWhitespace = function (string) {
    return /^\s*$/.test(string);
};

export const isSingleLineWhitespace = function (string) {
    return /^[^\S\n]*\n?$/.test(string);
};

export let shouldWrite = process.env.DEBUG_ATTRACTIFIER;
export function log(...messages) {
    if (!shouldWrite) return;
    let data = messages.join(" ") + "\n";
    try {
        process.stderr.write(data);
    } catch (error) {
        shouldWrite = false;
    }
}

let prettyTime;
let lastTime = process.hrtime();
export function timeLogStart(event) {
    lastTime = process.hrtime();
    if (event) {
        timeLog(event);
    }
}

const LOG_TIMING = process.env.LOG_TIMING;
if (LOG_TIMING) {
    try {
        if (require.resolve("pretty-hrtime")) {
            prettyTime = require("pretty-hrtime");
        }
    } catch (e) {
        console.error("Attempted to log timing events, but pretty-hrtime was not installed.");
    }
}
export function timeLog(event) {
    let diff = process.hrtime(lastTime);
    if (LOG_TIMING && prettyTime) {
        if (lastTime !== null) {
            console.error(prettyTime(diff) + ":", event);
        }
        lastTime = process.hrtime();
    }
}
