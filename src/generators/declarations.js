import types from "../types";

export function VariableDeclarator(node) {
    this.print(node.id);

    if (node.init) {
        this.ensureSpace();
        this.ensure("=");
        this.ensureSpace();

        this.print(node.init);
    }
}

export function VariableDeclaration(node, parent) {
    this.ensure(node.kind); // let, var, const
    this.ensureSpace();

    this._printList(node.declarations, this.nodeContainsNewlines(node));

    if (!types.isFor(parent)) {
        this.ensureVoid();
        this.ensure(";");
    }
}

export function FunctionDeclaration(node) {
    if (node.async) {
        this.ensure("async");
        this.ensureSpace();
    }

    if (this.isCurrent("function")) {
        this.ensure("function");
        this.ensureSpace();
    }

    if (node.generator) {
        this.ensure("*");
        this.ensureVoid();
    }

    if (node.id) {
        this.print(node.id);
        this.ensureVoid();
    }

    this._params(node, { newlines: false });

    this.ensureSpace();
    this.print(node.body);
}

export { FunctionDeclaration as FunctionExpression };
