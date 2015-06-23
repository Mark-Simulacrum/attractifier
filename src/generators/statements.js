export function Program(node) {
    this.ensureVoid();

    this._statements(node.body);

    this.ensureAtEnd();
}

export function BlockStatement(node) {
    this.ensure("{");

    if (node.body.length === 0) {
        let parent = this.enterPrint({ type: "__comment__" });

        const pushedLines = this.ensureVoid();
        if (pushedLines > 1) {
            this.nestingLevels[this.nestingLevels.length - 2] = this.getNestingLevel();
        }

        this.exitPrint(parent);
    } else {
        this.ensureNewline();

        this._statements(node.body);
    }

    this.ensure("}");
}

export function ExpressionStatement(node) {
    this.print(node.expression);

    this.ensureVoid();
    this.ensure(";");
}

export function IfStatement(node) {
    this.ensure("if");
    this.ensureSpace();

    let parent = this.enterPrint({ type: "_if_params" });

    this.ensure("(");
    this.ensureVoid();

    this.print(node.test);

    this.ensureVoid();
    this.ensure(")");

    this.exitPrint(parent);

    this._printStatementBody(node.consequent);


    if (node.alternate) {
        if (node.consequent.type === "BlockStatement") {
            this.ensureSpace();
        } else {
            this.ensureNewline();
        }

        this.ensure("else");

        this._printStatementBody(node.alternate);
    }
}

export function ReturnStatement(node) {
    this.ensure("return");

    if (node.argument) {
        this.ensureSpace();
        this.print(node.argument);
    }

    this.ensureVoid();
    this.ensure(";");
}

export function EmptyStatement() {
    this.ensure(";");
}

export function LabeledStatement(node) {
    this.print(node.label);
    this.ensureVoid();
    this.ensure(":");
    this.ensureSpace();
    this.print(node.body);
}

export function ContinueStatement(node) {
    this.ensure("continue");

    if (node.label) {
        this.ensureSpace();
        this.print(node.label);
    }

    this.ensureVoid();
    this.ensure(";");
}

export function BreakStatement(node) {
    this.ensure("break");

    if (node.label) {
        this.ensureSpace();
        this.print(node.label);
    }

    this.ensureVoid();
    this.ensure(";");
}

export function SwitchStatement(node) {
    this.ensure("switch");
    this.ensureSpace();
    this.ensure("(");
    this.ensureVoid();
    this.print(node.discriminant);
    this.ensureVoid();
    this.ensure(")");
    this.ensureSpace();

    // Body is effectively a block statement
    BlockStatement.call(this, { body: node.cases });
}

export function SwitchCase(node) {
    if (node.test) {
        this.ensure("case");
        this.ensureSpace();
        this.print(node.test);
    } else {
        this.ensure("default");
    }

    this.ensureVoid();
    this.ensure(":");

    if (node.consequent.length) {
        this.ensureNewline();

        for (let i = 0; i < node.consequent.length; i++) {
            this.print(node.consequent[i]);

            if (i + 1 !== node.consequent.length) {
                this.ensureNewline();
            }
        }
    }
}

export function ThrowStatement(node) {
    this.ensure("throw");
    this.ensureSpace();

    this.print(node.argument);

    this.ensureVoid();
    this.ensure(";");
}

export function TryStatement(node) {
    this.ensure("try");
    this.ensureSpace();
    this.print(node.block);

    if (node.handler || node.finalizer) {
        this.ensureSpace();
    }

    if (node.handler) {
        this.print(node.handler);

        if (node.finalizer) {
            this.ensureSpace();
        }
    }

    if (node.finalizer) {
        this.ensure("finally");
        this.ensureSpace();
        this.print(node.finalizer);
    }
}

export function CatchClause(node) {
    this.ensure("catch");
    this.ensureSpace();
    this.ensure("(");
    this.ensureVoid();
    this.print(node.param);
    this.ensureVoid();
    this.ensure(")");
    this.ensureSpace();
    this.print(node.body);
}

export function WhileStatement(node) {
    this.ensure("while");
    this.ensureSpace();
    this.ensure("(");
    this.ensureVoid();
    this.print(node.test);
    this.ensureVoid();
    this.ensure(")");

    if (node.body.type === "EmptyStatement") {
        this.ensureVoid();
    } else {
        this.ensureSpace();
    }

    this.print(node.body);
}

export function DoWhileStatement(node) {
    this.ensure("do");
    this.ensureSpace();
    this.print(node.body);
    this.ensureSpace();

    this.ensure("while");
    this.ensureSpace();
    this.ensure("(");
    this.ensureVoid();
    this.print(node.test);
    this.ensureVoid();
    this.ensure(")");

    this.ensureVoid();
    this.ensure(";");
}

export function ForStatement(node) {
    this.ensure("for");
    this.ensureSpace();
    this.ensure("(");
    this.ensureVoid();

    if (node.init) {
        this.print(node.init);
        this.ensureVoid();
    }

    this.ensure(";");

    if (node.test) {
        this.ensureSpace();
        this.print(node.test);
        this.ensureVoid();
    } else {
        this.ensureVoid();
    }

    this.ensure(";");

    if (node.update) {
        this.ensureSpace();
        this.print(node.update);
        this.ensureVoid();
    } else {
        this.ensureVoid();
    }

    this.ensure(")");

    this._printStatementBody(node.body);
}

export function ForInStatement(node) {
    this.ensure("for");
    this.ensureSpace();
    this.ensure("(");
    this.ensureVoid();
    this.print(node.left);
    this.ensureSpace();

    if (this.isForInStatement(node)) {
        this.ensure("in");
    } else if (this.isForOfStatement(node)) {
        this.ensure("of");
    }

    this.ensureSpace();
    this.print(node.right);
    this.ensureVoid();
    this.ensure(")");

    this._printStatementBody(node.body);
}

export { ForInStatement as ForOfStatement };

export function DebuggerStatement() {
    this.ensure("debugger");
    this.ensureVoid();
    this.ensure(";");
}
