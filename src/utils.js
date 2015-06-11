import fs from "fs";
import InputStream from "./InputStream";

const whitespaceRe = /\s+/;
const shebangRe = /#!.*\n/;
const lineCommentRe = /\/\/[^\n]*/;
const blockCommentRe = /\/\*[\W\S]*?\*\//;

export function isGreyspace(string) {
    if (string === "" ||
        string === " " ||
        string === "\n" ||
        /^\s*$/.test(string)) {
        return true;
    }

    if (string === undefined || string === null)
        throw new Error("passed undefined or null to isGreyspace");

    let stream = new InputStream(string);

    // Consume shebang
    stream.consume(shebangRe);

    while (!stream.atEnd()) {
        let consumed = stream.consume(whitespaceRe) ||
            stream.consume(lineCommentRe) ||
            stream.consume(blockCommentRe);
        if (!consumed) return false;
    }

    return stream.atEnd();
}

export function parseGreyspace(string) {
    if (string === undefined || string === null)
        throw new Error("passed undefined or null to isGreyspace");

    let parsedNodes = [];

    let stream = new InputStream(string);

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
            throw new Error("string is not greyspace");
        }
    }

    return parsedNodes;
}

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
