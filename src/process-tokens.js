import {isGreyspace} from "./utils";

export default function processTokens(input, tokens) {
    let modifiedTokens = []; // Start off with void greyspace
    modifiedTokens.push("");

    let sawGreyspace = true;
    function addToken(start, end) {
        const token = input.slice(start, end);
        const isGrey = isGreyspace(token);

        // If both the last token and the current token are not greyspace,
        // we need to add a void greyspace in between.
        if (!sawGreyspace && !isGrey) {
            modifiedTokens.push("");
        }

        // If both the last token and the current token are greyspace,
        // they should be merged.
        if (sawGreyspace && isGrey) {
            modifiedTokens[modifiedTokens.length - 1] += token;
        } else {
            modifiedTokens.push(token);
        }

        sawGreyspace = isGrey;
    }

    let lastTokenEnd = 0;
    const tokenLength = tokens.length;
    for (let i = tokenLength; i > 0; i--) {
        let token = tokens[tokenLength - i];
        let start = token.start;
        let end = token.end;

        // Add space in between previous token and this token
        if (lastTokenEnd !== start) {
            addToken(lastTokenEnd, start);
        }

        addToken(start, end);

        lastTokenEnd = end;
    }

    return modifiedTokens;
}
