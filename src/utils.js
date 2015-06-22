import fs from "fs";
import repeat from "lodash.repeat";
import memoize from "lodash.memoize";

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

    atEnd() {
        return this.char >= this.length;
    }
}

const whitespaceRe = /^\s+/;
const shebangRe = /^#!.*\n/;
const lineCommentRe = /^\/\/[^\n]*/;
const blockCommentRe = /^\/\*[\W\S]*?\*\//;

export const isGreyspace = memoize(function (string) {
    let stream = new TextStream(string);

    // Consume shebang
    stream.consume(shebangRe);

    while (!stream.atEnd()) {
        let consumed = stream.consume(whitespaceRe) ||
            stream.consume(lineCommentRe) ||
            stream.consume(blockCommentRe);
        if (!consumed) return false;
    }

    return stream.atEnd();
});

export const parseGreyspace = memoize(function (string) {
    let parsedNodes = [];

    let stream = new TextStream(string);

    while (!stream.atEnd()) {
        if (stream.consume(whitespaceRe)) {
            parsedNodes.push({ type: "whitespace", value: stream.consumed });
        } else if (stream.consume(lineCommentRe)) {
            parsedNodes.push({ type: "lineComment", value: stream.consumed });
        } else if (stream.consume(blockCommentRe)) {
            parsedNodes.push({ type: "blockComment", value: stream.consumed });
        } else if (stream.consume(shebangRe)) {
            parsedNodes.push({ type: "shebang", value: stream.consumed });
        } else {
            // Takes care of assertion that string is greyspace
            throw new Error(`string ("${string}") is not greyspace`.replace(/\n/g, "\\n"));
        }
    }

    return parsedNodes;
});

export const getIndentString = memoize(function (indentLevel) {
    return repeat(" ", indentLevel * 4);
});

export function log(...messages) {
    let data = messages.join(" ") + "\n";
    try {
        fs.writeSync(3, data);
    } catch (error) {
        if (error.code === "EBADF") {
            return;
        } else {
            throw error;
        }
    }
}
