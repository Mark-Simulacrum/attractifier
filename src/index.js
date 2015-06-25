import "source-map-support/register";
import fs from "fs";

import {parse} from "babel-core";

import {log, isGreyspace, timeLog} from "./utils";
import CodeGenerator from "./CodeGenerator";

const inputFile = process.argv[2];

try {
    if (!inputFile) {
        process.stderr.write("Usage: node ./lib/index.js FILE\n");
        process.exit(1);
    }

    let input = fs.readFileSync(inputFile).toString();
    let tokens = [];
    let semicolons = [];

    timeLog("read input file");

    let ast = parse(input, {
        onToken: tokens,
        onInsertedSemicolon(semicolon) {
            semicolons.push(semicolon);
        },
        preserveParens: true
    });

    timeLog("parsed input; length: " + input.length);

    const WriteFile = "DEBUG" in process.env;
    function writeString(stringName, string) {
        if (WriteFile) {
            fs.writeFileSync(stringName, string);
            log(`wrote ${stringName}.\n`);
        }
    }

    if (WriteFile) {
        writeString("original-tokens.json", JSON.stringify(tokens, null, 4));
    }

    let semicolonIndex = 0;
    function addToken(start, end) {
        const token = input.slice(start, end);
        const lastToken = modifiedTokens[modifiedTokens.length - 1];

        if ((modifiedTokens.length === 0 || !isGreyspace(lastToken)) && !isGreyspace(token)) {
            modifiedTokens.push("");
        }

        modifiedTokens.push(token);

        if (semicolons.length) {
            const semicolon = semicolons[semicolonIndex];
            if (start < semicolon && semicolon <= end) {
                modifiedTokens.push("");
                modifiedTokens.push(";");

                semicolonIndex++;
            }
        }
    }

    let lastTokenEnd = 0;
    let modifiedTokens = [];
    for (let i = 0; i < tokens.length; i++) {
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

    if (modifiedTokens.length > 0 && !isGreyspace(modifiedTokens[modifiedTokens.length - 1])) {
        modifiedTokens.push("");
    }

    // prevent stringification and inspection from running if we don't do anything anyway
    if (WriteFile) {
        writeString("transformed-tokens.json", JSON.stringify(modifiedTokens, null, 4));
        writeString("joined-tokens.json", modifiedTokens.join(""));
        writeString("ast.js", require("util").inspect(ast, { depth: 50 }));
    }

    timeLog("Created tokens");

    let generator = new CodeGenerator(ast, input, modifiedTokens, semicolons);

    timeLog("new CodeGenerator()");
    let output = generator.generate();
    timeLog("CodeGenerator.generate()");
    process.stdout.write(output);
} catch (error) {
    error.message = `In file "${inputFile}": ${error.message}`;
    throw error;
}
