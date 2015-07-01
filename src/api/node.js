import fs from "fs";

import {parse} from "babel-core";

import CodeGenerator from "../CodeGenerator";
import processTokens from "../process-tokens";

function parseText(text) {
    let tokens = [];
    let semicolons = [];

    let ast = parse(text, {
        onToken: tokens,
        onInsertedSemicolon(semicolon) { semicolons.push(semicolon); },
        preserveParens: true
    });

    const modifiedTokens = processTokens(text, tokens, semicolons);

    return { ast, tokens: modifiedTokens, semicolons };
}

export function formatText(text) {
    const { ast, tokens, semicolons } = parseText(text);

    let generator = new CodeGenerator(ast, text, tokens, semicolons);

    return generator.generate();
}

export function formatFile(filename) {
    const text = fs.readFileSync(filename).toString();

    return formatText(text);
}
