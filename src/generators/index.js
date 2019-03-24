export * from "./flow";
export * from "./general";
export * from "./modules";
export * from "./classes";
export * from "./statements";
export * from "./expressions";
export * from "./declarations";
export * from "./miscellaneous";

export function _statements(statements) {
    const parent = this.enterPrint({ type: "_statements" });
    const startingLine = this.lines.length - 1;

    const len = statements.length;
    for (let i = len; i > 0; i--) {
        this.print(statements[len - i]);

        if (len !== 1) {
            this.ensureNewline();
        } else {
            const pushedLines = this.ensureNewline();
            if (pushedLines > 1) {
                this.pairLine(-2, pushedLines - 1, startingLine);
            }
        }
    }

    this.exitPrint(parent);
}

export function _printStatementBody(body) {
    const type = body.type;
    if (type === "BlockStatement" || type === "IfStatement") {
        this.ensureSpace();
    } else if (type === "EmptyStatement") {
        this.ensureVoid();
    } else {
        this.ensureNewline();
    }

    this.print(body);
}

export function _printList(array, { separator = ",", newlines = false } = {}) {
    for (let i = 0; i < array.length; i++) {
        let element = array[i];

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
    open, list, close, { newlines = false, wrapSpaces = false, allowTrailingComma = true } = {}) {

    this.ensure(open);

    if (list.length) {
        if (newlines) {
            this.ensureNewline();
        } else if (wrapSpaces) {
            this.ensureSpace();
        } else {
            this.ensureVoid();
        }

        let len = list.length;
        for (let i = 0; i < len; i++) {
            let element = list[i];

            this.print(element);

            if (element.optional) {
                this.ensureVoid();
                this.ensure("?");
            }

            if (element.typeAnnotation) {
                this.ensureVoid();
                this.print(element.typeAnnotation);
            }

            const isLast = i + 1 === len;
            let printComma = !isLast || (allowTrailingComma && this.isNext(","));

            if (printComma) {
                this.ensureVoid();
                this.ensure(",");

                if (!isLast) {
                    if (newlines) {
                        this.ensureNewline();
                    } else {
                        this.ensureSpace();
                    }
                }
            }
        }

        if (newlines) {
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

export function _params(node, { newlines, key = "params" } = {}) {
    let parent = this.enterPrint({ type: "_params" });

    if (node.typeParameters) {
        this.print(node.typeParameters);
    }

    this.ensure("(");

    if (node[key].length) {
        this.ensureVoid();

        this._printList(node[key], { newlines });

        this.ensureVoid();
    } else {
        this.ensureVoid();
    }

    this.ensure(")");

    if (node.returnType) {
        this.ensureVoid();
        this.print(node.returnType);
    }

    this.exitPrint(parent);
}

export function _method(node) {
    let kind = node.kind;
    let key = node.key;

    if (kind === "method" || kind === "init") {
        if (node.generator) {
            this.ensure("*");
            this.ensureVoid();
        }
    }

    if (kind === "get" || kind === "set") {
        this.ensure(kind);
        this.ensureSpace();
    }

    if (node.async) {
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
    this._params(node);
    this.ensureSpace();
    this.print(node.body);
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

export function _optionalSemicolon() {
    if (this.isNext(";")) {
        this.ensureVoid();
        this.printFake(";");
    } else if (this.isCurrent(";")) {
        this.printFake(";");
    }
}
