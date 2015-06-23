// import * as types from "../types";

export function ImportDeclaration(node) {
    const hasNewlines = this.nodeContainsNewlines(node);

    this.ensure("import");
    this.ensureSpace();

    if (node.isType) {
        this.printFake("type");
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
                    this.ensureNewline();
                } else {
                    this.ensureSpace();
                }
            }

            this.print(specifier);

            if (isLast) {
                if (didIndent) {
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

        this.printFake("from");
        this.ensureSpace();
    }

    this.print(node.source);

    this.ensureVoid();
    this.printFake(";");
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

export { ImportDefaultSpecifier as ExportDefaultSpecifier };
export { ImportNamespaceSpecifier as ExportNamespaceSpecifier };

export function ExportSpecifier(node) {
    this.print(node.local);
    if (node.exported && node.local.name !== node.exported.name) {
        this.ensureSpace();
        this.ensure("as");
        this.ensureSpace();
        this.print(node.exported);
    }
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
    this.printFake("from");
    this.ensureSpace();

    this.print(node.source);

    this.ensureVoid();
    this.printFake(";");
}

export function ExportNamedDeclaration(node) {
    this.ensure("export");
    this.ensureSpace();

    ExportDeclaration.call(this, node);

    this._optionalSemicolon();
}

export function ExportDefaultDeclaration(node) {
    this.ensure("export");
    this.ensureSpace();
    this.printFake("default");
    this.ensureSpace();

    ExportDeclaration.call(this, node);

    this._optionalSemicolon();
}

function ExportDeclaration(node) {
    let parent = this.enterPrint({ type: "_export_declaration" });

    if (node.declaration) {
        this.print(node.declaration);
    } else {
        ImportDeclaration.call(this, node);
    }

    this.exitPrint(parent);
}
