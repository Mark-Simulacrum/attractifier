import {isGreyspace} from "./utils";

let sawGreyspace = true;
function addToken(arr, str, start, end) {
    const token = str.slice(start, end);
    const isGrey = isGreyspace(token);

    // If both the last token and the current token are not greyspace,
    // we need to add a void greyspace in between.
    if (!sawGreyspace && !isGrey) {
        arr.push("");
    }

    // If both the last token and the current token are greyspace,
    // they should be merged.
    if (sawGreyspace && isGrey) {
        arr[arr.length - 1] += token;
    } else {
        arr.push(token);
    }

    sawGreyspace = isGrey;
}

export default function processTokens(input, tokens) {
    let modifiedTokens = [""]; // Start off with void greyspace

    let lastTokenEnd = 0;
    const tokenLength = tokens.length;
    for (let i = tokenLength; i > 0; i--) {
        let token = tokens[tokenLength - i];
        let start = token.start;
        let end = token.end;

        // Add space in between previous token and this token
        if (lastTokenEnd !== start) {
            addToken(modifiedTokens, input, lastTokenEnd, start);
        }

        addToken(modifiedTokens, input, start, end);

        lastTokenEnd = end;
    }

    return modifiedTokens;
}
