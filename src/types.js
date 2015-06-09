export function is(node, type) {
    return node.type === type;
}

export let isBlockStatement = is.bind(null, "BlockStatement");
