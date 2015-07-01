// No arguments
() => {};

// Single argument
test => {};
(test) => {};

// Multiple argument
(test, test2) => {};

// Block Statement Body
test => {
    STATEMENT;
};

(test) => {
    STATEMENT;
};

// Inline Body
test => test();
test => ({ test });
