import fs from "fs";

import {parse} from "babylon";

import CodeGenerator from "../CodeGenerator";
import processTokens from "../process-tokens";

function parseText(text) {
    let ast = parse(text, {
        preserveParens: true
    });
    let tokens = ast.tokens;
    let semicolons = ast.tokens.filter(token => token.type.label === ";");

    const modifiedTokens = processTokens(text, tokens, semicolons);

    return { ast: ast.program, tokens: modifiedTokens, semicolons };
}

export function formatText(text) {
    const { ast, tokens, semicolons } = parseText(text);

    let generator = new CodeGenerator(ast, text, tokens, semicolons);

    return generator.generate();
}

export function formatFile(filename) {
    try {
        const text = fs.readFileSync(filename).toString();

        return formatText(text);
    } catch (error) {
        error.message = `${filename}: ${error.message}`;
        throw error;
    }
}
