import {isGreyspace} from "./utils";

export default function processTokens(input, tokens, semicolons) {
    let lastTokenEnd = 0;
    let modifiedTokens = [];

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

    const tokenLength = tokens.length;
    for (let i = 0; i < tokenLength; i++) {
        let token = tokens[i];
        let { start, end } = token;

        if (lastTokenEnd !== start) {
            addToken(lastTokenEnd, start);
        }

        if (i + 1 !== tokenLength) { // skip eof token
            addToken(start, end);
        }

        lastTokenEnd = end;
    }

    if (modifiedTokens.length > 0 && !isGreyspace(modifiedTokens[modifiedTokens.length - 1])) {
        modifiedTokens.push("");
    }

    return modifiedTokens;
}
