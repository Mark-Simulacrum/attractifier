import fs from "fs";

import { parse } from "babylon";

import CodeGenerator from "../CodeGenerator";
import processTokens from "../process-tokens";
import {timeLogStart, timeLog} from "../utils";

function parseText(text) {
    timeLogStart("started parsing text");
    let ast = parse(text, {
        preserveParens: true,
        sourceType: "module",
        plugins: [ "*" ]
    });
    timeLog("parsed input");

    let tokens = ast.tokens;
    let semicolons = ast.tokens.filter(token => token.type.label === ";");

    timeLogStart();
    const modifiedTokens = processTokens(text, tokens, semicolons);
    timeLog(`processed ${tokens.length} -> ${modifiedTokens.length} tokens`);

    return { ast: ast.program, tokens: modifiedTokens, semicolons };
}

export function formatText(text) {
    const { ast, tokens, semicolons } = parseText(text);

    let generator = new CodeGenerator(ast, text, tokens, semicolons);

    return generator.generate();
}

export function formatFile(filename) {
    try {
        timeLogStart();
        const text = fs.readFileSync(filename).toString();
        timeLog("finished reading file");

        return formatText(text);
    } catch (error) {
        error.message = `${filename}: ${error.message}`;
        throw error;
    }
}
