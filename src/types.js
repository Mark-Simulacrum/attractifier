import endsWith from "lodash.endswith";
import assign from "lodash.assign";
import * as generators from "./generators/index";

function isFuncGenerator(type) {
    return function (node) {
        return node && node.type === type;
    };
}

let t = exports;

const keys = Object.keys(generators);
for (let i = keys.length - 1; i >= 0; i--) {
    let generatorName = keys[i];

    t[`is${generatorName}`] = isFuncGenerator(generatorName);
}

t = assign(t, {
    isFunction(node) {
        return this.isFunctionExpression(node) || this.isFunctionDeclaration(node) ||
            this.isMethodDefinition(node) || this.isArrowFunctionExpression(node);
    },
    isExpression(node) {
        return endsWith(node.type, "Expression");
    },
    isPattern(node) {
        return endsWith(node.type, "Pattern");
    },
    isSingleItem(node) {
        return this.isLiteral(node) ||
            this.isTemplateLiteral(node) || this.isIdentifier(node);
    },
    isExpressionLike(node) {
        return this.isExpression(node) || this.isPattern(node) ||
                    this.is_params(node) || this.isIdentifier(node) ||
                    this.isLiteral(node);
    },
    isStatement(node) {
        return endsWith(node.type, "Statement");
    },
    isFor(node) {
        return this.isForStatement(node) ||
            this.isForInStatement(node) ||
            this.isForOfStatement(node);
    }
});
