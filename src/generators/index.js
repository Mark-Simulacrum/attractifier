import each from "lodash.foreach";

export * from "./flow";
export * from "./general";
export * from "./modules";
export * from "./classes";
export * from "./statements";
export * from "./expressions";
export * from "./declarations";
export * from "./miscellaneous";

export function _statements(statements) {
    each(statements, statement => {
        this.insertIndentation();
        this.print(statement);
        this.ensureNewline();
    });
}

export function _printStatementBody(body) {
    const type = body.type;
    if (type === "BlockStatement") {
        this.ensureSpace();
    } else if (type === "EmptyStatement") {
        this.ensureVoid();
    } else {
        this.ensureNewline();
    }

    const ShouldIndent = type !== "BlockStatement";

    // typeof Body is Statement
    if (ShouldIndent) this.indent();
    this.insertIndentation();
    this.print(body);
    if (ShouldIndent) this.dedent();
}

export function _printList(array, { separator = ",", newlines = false } = {}) {
    for (let i = 0; i < array.length; i++) {
        let element = array[i];

        this.insertIndentation();
        this.print(element);
        this._printFlow(element);

        if (i + 1 !== array.length) {
            this.ensureVoid();
            this.ensure(separator);

            if (newlines) {
                this.ensureNewline();
            } else {
                this.ensureSpace();
            }
        }
    }
}

export function _printContainedList(
    open, list, close, { newlines = false, wrapSpaces = false } = {}) {

    this.ensure(open);

    if (list.length) {
        if (newlines) {
            this.ensureNewline();
            this.indent();
        } else if (wrapSpaces) {
            this.ensureSpace();
        } else {
            this.ensureVoid();
        }

        let len = list.length;
        for (let i = 0; i < len; i++) {
            let element = list[i];

            this.insertIndentation();
            this.print(element);

            if (element.optional) {
                this.ensureVoid();
                this.ensure("?");
            }

            if (element.typeAnnotation) {
                this.ensureVoid();
                this.print(element.typeAnnotation);
            }

            if (i + 1 !== len) {
                this.ensureVoid();
                this.ensure(",");

                if (newlines) {
                    this.ensureNewline();
                } else {
                    this.ensureSpace();
                }
            }
        }

        if (newlines) {
            this.dedent();
            this.ensureNewline();
        } else if (wrapSpaces) {
            this.ensureSpace();
        } else {
            this.ensureVoid();
        }
    } else {
        this.ensureVoid();
    }

    this.ensure(close);
}

export function _params(node, newlines) {
    if (node.typeParameters) {
        this.print(node.typeParameters);
    }

    this._printContainedList("(", node.params, ")", { newlines });

    if (node.returnType) {
        this.ensureVoid();
        this.print(node.returnType);
    }
}

export function _method(node) {
    let value = node.value;
    let kind  = node.kind;
    let key   = node.key;

    if (kind === "method" || kind === "init") {
        if (value.generator) {
            this.ensure("*");
        }
    }

    if (kind === "get" || kind === "set") {
        this.ensure(kind);
        this.ensureSpace();
    }

    if (value.async) {
        this.ensure("async");
        this.ensureSpace();
    }

    if (node.computed) {
        this.ensure("[");
        this.ensureVoid();
        this.print(key);
        this.ensureVoid();
        this.ensure("]");
    } else {
        this.print(key);
    }

    this.ensureVoid();
    this._params(value);
    this.ensureSpace();
    this.print(value.body);
}

export function _printFlow(node) {
    if (node.optional) {
        this.ensureVoid();
        this.ensure("?");
    }

    if (node.typeAnnotation) {
        this.ensureVoid();
        this.print(node.typeAnnotation);
    }
}

export function ParenthesizedExpression(node) {
    this.ensure("(");
    this.ensureVoid();

    this.print(node.expression);

    this.ensureVoid();
    this.ensure(")");
}

export function Program(node) {
    this.ensureVoid();

    this._statements(node.body);

    this.ensureAtEnd();
}
