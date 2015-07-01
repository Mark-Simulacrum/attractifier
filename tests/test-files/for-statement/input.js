// Empty
for (;;);

// Empty with comments
for (/**/; /**/; /**/);

// No double-semicolon from variable declaration
for (var i;;);

// Block Statement for body
for (;;) {
    STATEMENT;
}

// If statement for body
for (;;) if (COND) {
    STATEMENT;
}
