export function ParenthesizedExpression(node) {
    this.ensure("(");
    this.ensureVoid();

    this.print(node.expression);

    this.ensureVoid();
    this.ensure(")");
}

export function CallExpression(node) {
    this.print(node.callee);

    this.ensureVoid();

    this._params(node, { key: "arguments" });
}

export function MemberExpression(node) {
    this.print(node.object);
    this.ensureVoid();

    let prev = this.enterPrint({ type: "_member_expression_accessor" });
    if (node.computed) {
        this.ensure("[");
        this.ensureVoid();

        let prev = this.enterPrint({ type: "_member_expression_property" });
        this.print(node.property);
        this.exitPrint(prev);

        this.ensureVoid();
        this.ensure("]");
    } else {
        this.ensure(".");
        this.ensureVoid();
        this.print(node.property);
    }
    this.exitPrint(prev);
}

export function ArrayExpression(node) {
    this._printContainedList("[", node.elements, "]", { newlines: false, wrapSpaces: true });
}

export { ArrayExpression as ArrayPattern };

export function AssignmentExpression(node) {
    this.print(node.left);
    this._printFlow(node.left);

    this.ensureSpace();
    this.ensure(node.operator);
    this.ensureSpace();

    this.print(node.right);
}

export { AssignmentExpression as AssignmentPattern };

export function ObjectExpression(node) {
    this._printContainedList("{", node.properties, "}",
        { newlines: this.nodeContainsNewlines(node), wrapSpaces: true });
}

export { ObjectExpression as ObjectPattern };

export function Property(node) {
    if (node.method || node.kind === "get" || node.kind === "set") {
        if (node.kind === "get" || node.kind === "set") {
            this.ensure(node.kind);
            this.ensureSpace();
        }

        this.print(node.key);
        this.ensureVoid();
        this.print(node.value);
    } else {
        if (node.computed) {
            this.ensure("[");
            this.ensureVoid();

            this.print(node.key);

            this.ensureVoid();
            this.ensure("]");
            this.ensureVoid();
        } else {
            if (this.isAssignmentPattern(node.value) &&
                this.isIdentifier(node.key) &&
                node.key.name === node.value.left.name) {
                this.print(node.value);
                return;
            }

            this.print(node.key);

            if (node.shorthand) {
                if (this.isIdentifier(node.key) &&
                    this.isIdentifier(node.value) &&
                    node.key.name === node.value.name) {
                    return;
                }
            } else {
                this.ensureVoid();
            }
        }

        this.ensure(":");
        this.ensureSpace();

        if (node.kind !== "init") {
            this.ensure(node.kind);
            this.ensureSpace();
        }

        this.print(node.value);
    }
}

export function SequenceExpression(node) {
    this._printList(node.expressions, this.nodeContainsNewlines(node));
}

export function ThisExpression() {
    this.ensure("this");
}

export function LogicalExpression(node) {
    this.print(node.left);

    this.ensureSpace();
    this.ensure(node.operator);
    this.ensureSpace();

    this.print(node.right);
}

export function BinaryExpression(node) {
    this.print(node.left);

    this.ensureSpace();
    this.ensure(node.operator);
    this.ensureSpace();

    this.print(node.right);
}

export function UpdateExpression(node) {
    if (node.prefix) {
        this.ensure(node.operator);
        this.ensureVoid();
        this.print(node.argument);
    } else {
        this.print(node.argument);
        this.ensureVoid();
        this.ensure(node.operator);
    }
}

export function NewExpression(node) {
    this.ensure("new");
    this.ensureSpace();
    this.print(node.callee);

    if (this.isNext("(")) {
        this.ensureVoid();
        this._printContainedList("(", node.arguments, ")",
            { newlines: this.nodeContainsNewlines(node) });
    }
}

export function UnaryExpression(node) {
    let HasSpace;

    if (this.isUpdateExpression(node.argument)) {
        HasSpace = true;
    } else if (this.isUnaryExpression(node.argument)) {
        HasSpace = node.argument.operator !== "!";
    } else {
        HasSpace = node.operator === "delete" ||
            node.operator === "typeof" ||
            node.operator === "void";
    }

    this.ensure(node.operator);

    if (HasSpace) {
        this.ensureSpace();
    } else {
        this.ensureVoid();
    }

    this.print(node.argument);
}

export function ConditionalExpression(node) {
    this.print(node.test);

    this.ensureSpace();
    this.ensure("?");
    this.ensureSpace();

    this.print(node.consequent);

    this.ensureSpace();
    this.ensure(":");
    this.ensureSpace();

    this.print(node.alternate);
}

export function ArrowFunctionExpression(node) {
    if (node.async) {
        this.ensure("async");
        this.ensureSpace();
    }

    if (node.params.length === 1 && this.isIdentifier(node.params[0])) {
        this.print(node.params[0]);
    } else {
        this._params(node);
    }

    this.ensureSpace();
    this.ensure("=>");
    this.ensureSpace();

    this.print(node.body);
}

