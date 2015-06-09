// import * as types from "../types";

export function ImportDeclaration(node) {
    const hasNewlines = this.nodeContainsNewlines(node);

    this.ensure("import");
    this.ensureSpace();

    if (node.isType) {
        this.ensure("type");
        this.ensureSpace();
    }

    if (node.specifiers.length) {
        let didIndent = false;

        for (let [index, specifier] of node.specifiers.entries()) {
            let isLast = index + 1 === node.specifiers.length;

            if (this.isCurrent("{")) {

                this.ensure("{");

                if (hasNewlines) {
                    didIndent = true;
                    this.indent();
                    this.ensureNewline();
                } else {
                    this.ensureSpace();
                }
            }

            this.insertIndentation();
            this.print(specifier);

            if (isLast) {
                if (didIndent) {
                    this.dedent();
                    this.ensureNewline();
                } else {
                    this.ensureSpace();
                }

                if (this.isCurrent("}")) {
                    this.ensure("}");
                    this.ensureSpace();
                }

            } else {
                this.ensureVoid();
                this.ensure(",");

                if (didIndent) {
                    this.ensureNewline();
                } else {
                    this.ensureSpace();
                }
            }
        }

        this.ensure("from");
        this.ensureSpace();
    }

    this.print(node.source);
    this.ensureVoid();
    this.ensure(";");
}

export function ImportSpecifier(node) {
    this.print(node.local);

    if (node.local && node.local !== node.imported) {
        this.ensureSpace();
        this.ensure("as");
        this.ensureSpace();
        this.print(node.imported);
    }
}

export function ImportDefaultSpecifier(node) {
    this.print(node.local);
}

export function ImportNamespaceSpecifier(node) {
    this.ensure("*");
    this.ensureSpace();
    this.ensure("as");
    this.ensureSpace();
    this.print(node.local);
}

export function ExportDefaultSpecifier(node) {
    this.print(node.exported);
}

export function ExportSpecifier(node) {
    this.print(node.local);
    if (node.exported && node.local.name !== node.exported.name) {
        this.ensureSpace();
        this.ensure("as");
        this.ensureSpace();
        this.print(node.exported);
    }
}

export function ExportNamespaceSpecifier(node) {
    this.ensure("*");
    this.ensureSpace();
    this.ensure("as");
    this.ensureSpace();
    this.print(node.exported);
}

export function ExportAllDeclaration(node) {
    this.ensure("export");
    this.ensureSpace();
    this.ensure("*");

    if (node.exported) {
        this.ensureSpace();
        this.ensure("as");
        this.ensureSpace();
        this.print(node.exported);
    }

    this.ensureSpace();
    this.ensure("from");
    this.ensureSpace();

    this.print(node.source);

    this.ensureVoid();
    this.ensure(";");
}

export function ExportNamedDeclaration(node) {
    this.ensure("export");
    this.ensureSpace();

    ExportDeclaration.call(this, node);

    if (this.isNext(";")) {
        this.ensureVoid();
        this.ensure(";");
    } else if (this.isCurrent(";")) {
        this.ensure(";");
    }
}

export function ExportDefaultDeclaration(node) {
    this.ensure("export");
    this.ensureSpace();
    this.ensure("default");
    this.ensureSpace();
    ExportDeclaration.call(this, node);
}

function ExportDeclaration(node) {
    if (node.declaration) {
        this.print(node.declaration);
    } else {
        const hasNewlines = this.nodeContainsNewlines(node);

        if (node.specifiers.length) {
            let didIndent = false;

            for (let [index, specifier] of node.specifiers.entries()) {
                let isLast = index + 1 === node.specifiers.length;

                if (this.isCurrent("{")) {

                    this.ensure("{");

                    if (hasNewlines) {
                        didIndent = true;
                        this.indent();
                        this.ensureNewline();
                    } else {
                        this.ensureSpace();
                    }
                }

                this.print(specifier);

                if (isLast) {
                    if (didIndent) {
                        this.dedent();
                        this.ensureNewline();
                    } else {
                        this.ensureSpace();
                    }

                    if (this.isCurrent("}")) {
                        this.ensure("}");
                    }
                } else {
                    this.ensureVoid();
                    this.ensure(",");

                    if (didIndent) {
                        this.ensureNewline();
                    } else {
                        this.ensureSpace();
                    }
                }
            }

        }

        if (node.source) {
            this.ensureSpace();
            this.ensure("from");
            this.ensureSpace();
            this.print(node.source);
        }
    }
}
