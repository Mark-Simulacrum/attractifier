10;
true;
false;
10e50;
/test/i;
"test";
"te\nst";
"te\\nst";
`test`;
null;

let a = {
    test: "foo",
    test: undefined,
    test: null,
    bar: "foo"
};

let foo = [0, 1, 2, 3];
let bar = [
    { very_long_string_that_is_indeed_long },
    { very_long_string_that_is_indeed_long },
    { very_long_string_that_is_indeed_long },
    { very_long_string_that_is_indeed_long },
];
let baz = [{ short_string }, { short_string }, { short_string }, { short_string }];

let config = [
    {
        ident,
    },
    {
        ident,
    },
];
