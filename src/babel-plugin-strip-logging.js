export default function (babel) {
    return new babel.Transformer("strip-logging", {
        metadata: {
            group: "init"
        },
        CallExpression(node) {
            if (this.get("callee").matchesPattern("this.lineLog") ||
                (babel.types.isIdentifier(node.callee) && node.callee.name === "timeLog") ||
                (babel.types.isIdentifier(node.callee) && node.callee.name === "timeLogStart")) {
                this.dangerouslyRemove();
            }
        }
    });
}
