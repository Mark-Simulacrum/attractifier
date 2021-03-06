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

function t() {
    let p = new Promise((resolve, reject) => {
        return t;
    });
}

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

function foo() {
    return this.server.listenAsync(Config.OriginListeningAddress.port,
        Config.OriginListeningAddress.host).tap(() => {
            console.log("Server listening on", this.server.address());
        });
}


function test() {
    function nestedFunc() {
        function evenMoreNestedFunc() {
            return ta((aaa) => {
                test;
            });
        }
    }
}

Config.Recognize([
    {
        option: "speed",
        type: "String",
        enum: ["fast", "slow"],
        default: "slow",
        description: "expected response speed",
    },
    {
        option: "bucket-speed-limit",
        type: "Number",
        default: "50000",
        description: "response_delay_pool's bucket_speed_limit",
    },
    {
        option: "aggregate-speed-limit",
        type: "Number",
        description: "response_delay_pool's aggregate_speed_limit",
    }
]);

let a = {
    option: "speed",
    bar: function () {
        return;
    },
};

function bar() {
    let a = {
        option: "speed",
        bar: function () {
            return;
        },
    };
}
