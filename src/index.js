import "source-map-support/register";
import fs from "fs";

import "babel-core/polyfill";
import {parse} from "babel-core";

import {log, isGreyspace} from "./utils";
import CodeGenerator from "./CodeGenerator";

const inputFile = process.argv[2];
try {
    if (!inputFile) {
        process.stderr.write("Usage: node ./lib/index.js FILE\n");
        process.exit(1);
    }

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
            log(`wrote ${stringName}.\n`);
        }
    }

    writeString("original-tokens.json", JSON.stringify(tokens, null, 4));

    let semicolonIndex = 0;
    function addToken(start, end) {
        let token = input.slice(start, end);

        let lastToken = modifiedTokens[modifiedTokens.length - 1];

        if ((lastToken === undefined || !isGreyspace(lastToken)) && !isGreyspace(token)) {
            modifiedTokens.push("");
        }

        modifiedTokens.push(token);

        let semicolon = semicolons[semicolonIndex];
        if (semicolons.length && start < semicolon && semicolon <= end) {
            let semiColonPos = semicolon - start;
            log("inserting semicolon @", semiColonPos + start);
            modifiedTokens.push("");
            modifiedTokens.push(";");

            semicolonIndex++;
        }
    }

    let lastTokenEnd = 0;
    let modifiedTokens = [];
    const everyPercent = Math.round(tokens.length / 100) * 5;
    let percentNum = 0;
    for (let i = 0; i < tokens.length; i++) {
        if (i % everyPercent === 0) log(`finished ${percentNum++}%`);

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

    if (modifiedTokens[modifiedTokens.length - 1] && !isGreyspace(modifiedTokens[modifiedTokens.length - 1])) {
        modifiedTokens.push("");
    }

    // prevent stringification from running if we don't do anything anyway
    if (WriteFile) {
        writeString("transformed-tokens.json", JSON.stringify(modifiedTokens, null, 4));
        writeString("joined-tokens.json", modifiedTokens.join(""));
        writeString("ast.js", require("util").inspect(ast, { depth: 50 }));
    }

    log("Init CodeGenerator");
    let generator = new CodeGenerator(ast, input, modifiedTokens, semicolons);
    log("Initialized CodeGenerator");

    let output = generator.generate();
    process.stdout.write(output);
} catch (error) {
    error.message = `In file "${inputFile}": ${error.message}`;
    throw error;
}
