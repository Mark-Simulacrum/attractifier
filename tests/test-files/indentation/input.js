// Increase of Parenthesized Expressions does not increase indentation
(((((((() => {})))))));

let a = {
    NAME() {
        STATEMENT;
    }
};

let a = // no wrap
`template literal string should be left as-is
    right?
        right?
            right?
`;

function NAME() {
    let a = // no wrap
`template literal string should be left as-is
even in a theoretically indented body
        right?
            right?
                right?
    `;
}

let b = {
    OTHER_NAME() {
        // leading comment
        STATEMENT;
        // trailing comment
    }
};
