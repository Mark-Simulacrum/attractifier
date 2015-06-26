import "source-map-support/register";
import fs from "fs";
import {parse} from "babel-core";

import {timeLog} from "./utils";
import CodeGenerator from "./CodeGenerator";
import processTokens from "./process-tokens";


function processInput() {
    const inputFile = process.argv[2];

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

    let modifiedTokens = processTokens(input, tokens, semicolons);

    timeLog("Created tokens");

    let generator = new CodeGenerator(ast, input, modifiedTokens, semicolons);

    timeLog("new CodeGenerator()");
    let output = generator.generate();
    timeLog("CodeGenerator.generate()");
    return output;
}

try {
    process.stdout.write(processInput());
} catch (error) {
    error.message = `In file "${inputFile}": ${error.message}`;
    throw error;
}
