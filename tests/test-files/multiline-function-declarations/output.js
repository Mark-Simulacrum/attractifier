function name1() {
    return;
}

function name2() {
    return;
}

function name3() {
    return;
}

function name4() { /* returns: undefined */
    return;
}

// The output formatting of this is wrong; but it is a canary for changes.
function name5()
    /* returns: undefined */
    {
        return;
}
