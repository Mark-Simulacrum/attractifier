import types from "../types";

export function ImportSpecifier(node) {
    if (node.local.name !== node.imported.name) {
        this.print(node.imported);
        this.ensureSpace();
        this.ensure("as");
        this.ensureSpace();
        this.print(node.local);
    } else {
        this.print(node.local);
    }
}

export function ImportDefaultSpecifier(node) {
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
}

export function ExportDefaultDeclaration(node) {
    this.ensure("export");
    this.ensureSpace();
    this.ensure("default");
    this.ensureSpace();
    ExportDeclaration.call(this, node);
}

export function _processSpecifiers(specifiers, condition) {
    let hasSpecial = false;
    while (true) { // eslint-disable-line no-constant-condition
        let first = specifiers[0];
        if (condition(first)) {
            hasSpecial = true;
            this.print(specifiers.shift());
            if (specifiers.length) {
                this.ensureVoid();
                this.ensure(",");
                this.ensureSpace();
            }
        } else {
            break;
        }
    }

    if (specifiers.length > 0) {
        this.ensure("{");
        if (specifiers.length) {
            this.ensureSpace();

            for (let i = 0; i < specifiers.length; i++) {
                const specifier = specifiers[i];
                const isLast = i + 1 === specifiers.length;

                this.print(specifier);
                if (!isLast) {
                    this.ensureVoid();
                    this.ensure(",");
                    this.ensureSpace();
                }
            }

            this.ensureSpace();
        }
        this.ensure("}");
    }
}

function ExportDeclaration(node) {
    if (node.declaration) {
        let declar = node.declaration;
        this.print(declar);
        if (types.isStatement(declar) || types.isFunction(declar) ||
            types.isClass(declar))
            return;
    } else {
        if (node.exportKind === "type") {
            this.ensure("type");
            this.ensureSpace();
        }

        this._processSpecifiers(node.specifiers.slice(0),
            specifier => types.isExportDefaultSpecifier(specifier) ||
                types.isExportNamespaceSpecifier(specifier));

        if (node.source) {
            this.ensureSpace();
            this.ensure("from");
            this.ensureSpace();
            this.print(node.source);
        }

        this.ensureVoid();
        this.ensure(";");
    }
}

export function ImportDeclaration(node) {
    this.ensure("import");
    this.ensureSpace();

    if (node.importKind === "type" || node.importKind === "typeof") {
        this.ensure(node.importKind);
        this.ensureSpace();
    }

    this._processSpecifiers(node.specifiers.slice(0),
            specifier => types.isImportDefaultSpecifier(specifier) ||
                types.isImportNamespaceSpecifier(specifier));

    if (node.specifiers.length > 0) {
        this.ensureSpace();
        this.ensure("from");
        this.ensureSpace();
    }
    this.print(node.source);

    this.ensureVoid();
    this.ensure(";");
}

export function ImportNamespaceSpecifier(node) {
    this.ensure("*");
    this.ensureSpace();
    this.ensure("as");
    this.ensureSpace();
    this.print(node.local);
}
