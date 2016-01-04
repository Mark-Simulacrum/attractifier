import "source-map-support/register";

import assert from "assert";
import each from "lodash.foreach";
import path from "path";
import fs from "fs";
import {describe, it} from "mocha";

import {formatFile} from "../lib/api/node";

const TestDirectory = "tests";

let equalityFiles = [];
let inputOutputFiles = [];

function processDirectory(dirPath) {
    let files = fs.readdirSync(dirPath);

    if (files.length === 2 &&
        files[0] === "input.js" && files[1] === "output.js") {
        inputOutputFiles.push({
            dirPath,
            input: path.join(dirPath, files[0]),
            output: path.join(dirPath, files[1])
        });
    } else {
        each(files, file => {
            processPath(path.join(dirPath, file));
        });
    }
}

function processPath(fileOrDirPath) {
    const stats = fs.statSync(fileOrDirPath);
    if (stats.isDirectory()) {
        processDirectory(fileOrDirPath);
    } else if (stats.isFile()) {
        equalityFiles.push(fileOrDirPath);
    } else {
        throw new Error(`${fileOrDirPath} is not a file or a directory.`);
    }
}

processPath(`${TestDirectory}/test-files`);

describe("equality tests", () => {
    each(equalityFiles, function (file) {
        it(file, function () {
            const text = fs.readFileSync(file).toString();
            const formattedText = formatFile(file);

            assert.strictEqual(text, formattedText);
        });
    });
});

describe("input/output tests", () => {
    each(inputOutputFiles, ({dirPath, input, output}) => {
        it(dirPath, function () {
            const inputText = fs.readFileSync(output).toString();
            const formattedText = formatFile(input);

            assert.strictEqual(inputText, formattedText);
        });
    });
});
