export function ClassDeclaration(node) {
    this.ensure("class");
    this.ensureSpace();

    if (node.id) {
        this.print(node.id);
        this.ensureSpace();
    }

    if (node.superClass) {
        this.ensure("extends");
        this.ensureSpace();
        this.print(node.superClass);
        this.ensureSpace();
    }

    if (node.implements) this._printList(node.implements);

    this.print(node.body);
}

export { ClassDeclaration as ClassExpression };

export function ClassBody() {
    this.BlockStatement.apply(this, arguments);
}

export function ClassProperty(node) {
    if (node.decorators) {
        this._printList(node.decorators, { newlines: true, separator: "" });
    }

    if (node.static) {
        this.ensure("static");
        this.ensureSpace();
    }

    this.print(node.key);

    if (node.value) {
        this.ensureSpace();
        this.ensure("=");
        this.ensureSpace();
        this.print(node.value);
    }
    this.ensureVoid();
    this.ensure(";");
}

export function Super() {
    this.ensure("super");
}

export function MethodDefinition(node) {
    if (node.static) {
        this.ensure("static");
        this.ensureSpace();
    }

    this._method(node);
}
