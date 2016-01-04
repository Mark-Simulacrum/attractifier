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

let p = new Promise((resolve, reject) => {
    return t;
});

let p = new Promise(function (resolve, reject) {
    return t;
});

let p = foo("apples", "pears",
    "peaches" + "oranges", "fruit");

assert(`${index} is already paired to ${this.linePairings[index]}, ` +
    `attempting pairing to: ${toLine}`);

assert("test" +
    "testing");
