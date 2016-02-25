import "test";

async function test() {
    await Promise.resolve(foobar);
}

async function Test(take, callback) {
}

let resolver;
let promise = new Promise((resolve) => {
    resolver = resolve;
});

/*
 * test
 * test
 */
