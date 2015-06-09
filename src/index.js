import assert from "assert";
import fs from "fs";

import {parse} from "babel-core";

import CodeGenerator from "./CodeGenerator";
import InputStream from "./InputStream";

function log(...messages) {
    fs.write(3, messages.join("") + "\n");
}

const inputFile = process.argv[2];
log("started reading from inputFile");
let input = fs.readFileSync(inputFile).toString();
let tokens = [];
let semicolons = [];
log("started parsing input");
let ast = parse(input, {
    onToken: tokens,
    onInsertedSemicolon(semicolon) {
        semicolons.push(semicolon);
    },
    preserveParens: true
});

log("finished parsing input (length: " + input.length + ")");

const WriteFile = "DEBUG" in process.env;
function writeString(stringName, string) {
    if (WriteFile) {
        fs.writeFileSync(stringName, string);
        process.stdout.write(`wrote ${stringName}.\n`)
    }
}

writeString("original-tokens.json", JSON.stringify(tokens, null, 4));

function isGreyspace(string) {
    let stream = new InputStream(string);

    while (!stream.atEnd()) {
        let consumed = stream.consume(/\s+/) ||
            stream.consume(/\/\/[^\n]*/) ||
            stream.consume(/\/\*[\W\S]*?\*\//);
        if (!consumed) return false;
    }

    return stream.atEnd();
}

function addToken(start, end) {
    let token = input.slice(start, end);

    let lastToken = modifiedTokens[modifiedTokens.length - 1];

    if ((lastToken === undefined || !isGreyspace(lastToken)) && !isGreyspace(token)) {
        modifiedTokens.push("");
    }

    modifiedTokens.push(token);

    if (semicolons.length && start < semicolons[0] && semicolons[0] <= end) {
        let semiColonPos = semicolons.shift() - start;
        log("inserting semicolon @", semiColonPos + start);
        modifiedTokens.push("");
        modifiedTokens.push(";");
    } else if (semicolons.length) {
        log(`not inserting semicolon between ${start} and ${end}, semicolon is ${semicolons[0]}`)
    }
}

let lastTokenEnd = 0;
let modifiedTokens = [];
const everyPercent = Math.round(tokens.length / 100) * 5;
let percentNum = 0;
for (let i = 0; i < tokens.length; i++) {
        if (i % everyPercent === 0) log(`finished ${percentNum++}%`)

        let token = tokens[i];
        let { start, end } = token;

        if (lastTokenEnd !== start) {
            addToken(lastTokenEnd, start);
        }

        if (i + 1 !== tokens.length) { // skip eof token
            addToken(start, end);
        }

        lastTokenEnd = end;
}

if (!isGreyspace(modifiedTokens[modifiedTokens.length - 1])) {
    modifiedTokens.push("");
}

// prevent stringification from running if we don't do anything anyway
if (WriteFile) {
    writeString("transformed-tokens.json", JSON.stringify(modifiedTokens, null, 4));
    writeString("joined-tokens.json", modifiedTokens.join(""));
    writeString("ast.js", require("util").inspect(ast, { depth: 50 }));
}

log("Init CodeGenerator");
let generator = new CodeGenerator(ast, input, modifiedTokens);
log("Initialized CodeGenerator");

try {
    let out = generator.generate();
} catch (error) {
    throw error;
}

process.stdout.write(generator.out);
