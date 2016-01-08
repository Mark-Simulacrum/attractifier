export default function (babel) {
    return {
        visitor: {
            CallExpression(path) {
                if (path.get("callee").matchesPattern("this.lineLog") ||
                    (babel.types.isIdentifier(path.node.callee) && path.node.callee.name === "timeLog") ||
                    (babel.types.isIdentifier(path.node.callee) && path.node.callee.name === "timeLogStart")) {
                    path.remove();
                }
            }
        }
    };
}
