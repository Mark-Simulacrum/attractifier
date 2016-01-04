import {isGreyspace} from "../utils";

export function Identifier(node) {
    this.lineLog("Identifier:", node.name);
    this.ensure(node.name);
}

export function StringLiteral(node) {
    this.ensure(node.extra.raw);
}

export function NumericLiteral(node) {
    this.ensure(node.extra.raw);
}

export function BooleanLiteral(node) {
    this.ensure(node.value.toString());
}

export function RegExpLiteral(node) {
    this.ensure(`/${node.pattern}/${node.flags}`);
}

export function NullLiteral() {
    this.ensure("null");
}

export function TaggedTemplateExpression(node) {
    this.print(node.tag);
    this.ensureVoid();
    this.print(node.quasi);
}

export function TemplateElement(node) {
    if (isGreyspace(node.value.raw)) {
        // Workaround logic in ensureVoid, ensureSpace, and ensureNewline
        // that attempts to modify the current value.
        // We don't want to modify it.
        let currentVal = this.iterator.current();
        this.pushGreyspace(currentVal);
        this.iterator.advance();
    } else {
        this.ensure(node.value.raw);
        this.ensureVoid();
    }
}

export function TemplateLiteral(node) {
    this.ensure("`");

    if (!isGreyspace(node.quasis[0].value.raw)) {
        this.ensureVoid();
    }

    for (let i = 0; i < node.quasis.length; i++) {
        this.print(node.quasis[i]);

        if (node.expressions[i]) {
            this.ensure("${");
            this.ensureVoid();

            this.print(node.expressions[i]);

            this.ensureVoid();
            this.ensure("}");

            if (!node.quasis[i].isLast && !isGreyspace(node.quasis[i + 1].value.raw)) {
                this.ensureVoid();
            }
        }

    }

    this.ensure("`");
}
