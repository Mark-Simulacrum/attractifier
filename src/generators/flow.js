export function TypeAnnotation(node) {
    this.ensure(":");
    this.ensureSpace();
    if (node.optional) this.ensure("?");
    this.print(node.typeAnnotation);
}

export function AnyTypeAnnotation(node) {
    this.ensure("any");
}

export function StringTypeAnnotation(node) {
    this.ensure("string");
}

export function NumberTypeAnnotation(node) {
    this.ensure("number");
}

export function BooleanTypeAnnotation(node) {
    this.ensure("boolean");
}

export function TypeParameterInstantiation(node, print) {
    this._printContainedList("<", node.params, ">");
}

export { TypeParameterInstantiation as TypeParameterDeclaration };


export function InterfaceExtends(node) {
    this.print(node.id);
    if (node.typeParameters) {
        this.ensureVoid();
        this.print(node.typeParameters);
    }
}

export {
    InterfaceExtends as ClassImplements,
    InterfaceExtends as GenericTypeAnnotation
};

export function TypeCastExpression(node) {
    // this.ensure("("); // Handled by Parenthesized Expression
    this.print(node.expression);
    this.ensureVoid();
    this.print(node.typeAnnotation);
    // this.ensure(")"); // Handled by Parenthesized Expression
}
