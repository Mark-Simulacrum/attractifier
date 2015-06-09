import {isGreyspace} from "../utils";
import assert from "assert";

export function Identifier(node) {
    this.ensure(node.name);
}

export function Literal(node) {
    var val  = node.value;
    var type = typeof val;

    if (type === "string") {
        this.ensure(node.raw);
    } else if (type === "boolean") {
        this.ensure(node.raw);
    } else if (type === "number") {
        this.ensure(node.raw);
    } else if (val === null) {
        this.ensure("null");
    } else if (type === "object") { // RegExp
        this.ensure(node.raw);
    } else {
        throw new Error("unhandled literal: " + node.raw + " type: " + type);
    }
}

export function TaggedTemplateExpression(node) {
    this.print(node.tag);
    this.ensureVoid();
    this.print(node.quasi);
}

export function TemplateElement(node) {
    if (isGreyspace(node.value.raw)) {
        this.ensureVoid();
    } else {
        this.ensure(node.value.raw);
    }
}

export function TemplateLiteral(node) {
    this.ensure("`");

    let quasis = node.quasis;
    let len = quasis.length;

    this.log("quasis:", quasis);

    if (this.isCurrent("") && quasis[0] && quasis[0].value.raw !== "") {
        this.ensureVoid();
    }
    for (var i = 0; i < len; i++) {
        this.print(quasis[i]);

        if (node.expressions[i]) {
            this.log("printing expression");

            if (!this.isCurrent("${")) {
                this.ensureVoid();
            }
            this.ensure("${");
            this.ensureSpace();

            this.print(node.expressions[i]);

            this.ensureSpace();
            this.ensure("}");
            if (quasis[i + 1].value.raw !== "") {
                this.ensureVoid();
            }
        }
    }

    if (this.isCurrent("")) this.ensureVoid();
    this.ensure("`");
}
