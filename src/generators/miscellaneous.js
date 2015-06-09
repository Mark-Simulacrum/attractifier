export function RestElement(node) {
    this.ensure("...");
    this.ensureVoid();
    this.print(node.argument);
}

export function SpreadElement(node) {
    RestElement.call(this, node);
}
