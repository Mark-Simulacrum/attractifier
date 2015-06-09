export function RestElement(node) {
    this.ensure("...");
    this.ensureVoid();
    this.print(node.argument);
}