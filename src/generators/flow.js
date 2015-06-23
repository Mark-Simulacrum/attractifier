export function TypeAnnotation(node) {
    this.ensure(":");
    this.ensureSpace();
    if (node.optional) this.ensure("?");
    this.print(node.typeAnnotation);
}

export function AnyTypeAnnotation() {
    this.ensure("any");
}

export function StringTypeAnnotation() {
    this.ensure("string");
}

export function NumberTypeAnnotation() {
    this.ensure("number");
}

export function BooleanTypeAnnotation() {
    this.ensure("boolean");
}

export function TypeParameterInstantiation(node) {
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
    this.print(node.expression);
    this.ensureVoid();
    this.print(node.typeAnnotation);
}
