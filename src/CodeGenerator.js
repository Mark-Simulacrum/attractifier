import assign from "lodash.assign";
import filter from "lodash.filter";
import map from "lodash.map";

import Iterator from "./iterator";
import types from "./types";
import {
    parseGreyspace,
    isGreyspace,
    log,
    timeLog,
    timeLogStart, // eslint-disable-line
    getIndentString,
    nestingLevelType,
    isSingleLineWhitespace,
    isWhitespace,
    shouldWrite as WillWrite
} from "./utils";

function fastJoin(array, joiner = "") {
    let string = "";
    const len = array.length;
    for (let i = len; i > 0; i--) {
        let element = array[len - i];
        string += element;
        if (i !== 1) {
            string += joiner;
        }
    }
    return string;
}

export default class CodeGenerator {
    constructor(ast, input, parsedInput) {
        this.ast = ast;
        this.input = input;
        this.iterator = new Iterator(parsedInput);

        this.parents = [];
        this.indentLevels = [];

        this.openGroups = [];
        this.linePairings = [];

        this.nestingLevels = [];

        this.lines = [];

        this.parsedInput = parsedInput;
        this.positions = null;
    }

    lineLog(...messages) {
        if (WillWrite) {
            messages = map(messages, message => {
                if (typeof message === "string") {
                    return message.replace(/\n/g, "\\n");
                } else {
                    return message;
                }
            });
            log(`${this.lines.length - 1}:`, ...messages);
        }
    }

    warn(...messages) {
        messages = map(messages, message => {
            if (typeof message === "string") {
                return message.replace(/\n/g, "\\n");
            } else {
                return message;
            }
        });
        console.error(`Output line #${this.lines.length - 1}:`, ...messages);
    }

    getSemicolonsBeforePosition(position) {
        return filter(this.input.slice(0, position).split(""), a => a === ";").length;
    }

    getPositions(upTo = this.input.length) {
        let positions = {};

        let origString = this.input;

        this.assert(upTo <= this.input.length);

        let linesSeen = 1;
        let charsSeen = 0;
        let lastPos = 0;
        for (let pos = 0; pos < upTo; pos++) {
            let char = origString.charAt(pos);

            if (char === "\n") {
                linesSeen++;
                charsSeen = 0;
            } else {
                charsSeen++;
            }

            let obj = {
                line: linesSeen,
                column: charsSeen
            };

            let semisBefore = this.getSemicolonsBeforePosition(pos);
            let newPos = pos + semisBefore;

            if (newPos === pos) {
                lastPos = newPos;
                positions[newPos] = obj;
            } else {
                for (; lastPos < newPos; lastPos++) {
                    positions[lastPos] = obj;
                }
            }
        }

        // Map to parsedInput for easy access later.
        let before = "";
        let posKeys = Object.keys(positions);
        positions = map(this.parsedInput, (element, index) => {
            before += fastJoin(this.parsedInput.slice(index - 2, index - 1));
            let pos = positions[before.length];

            if (pos) {
                return pos;
            } else {
                return positions[posKeys.length - 1];
            }
        });

        return positions;
    }

    getPosition() {
        return this.positions[this.iterator.pos];
    }

    getPositionMessage() {
        let pos = this.getPosition();
        if (!pos)
            return "unkown position";
        return `${pos.line}:${pos.column}`;
    }

    croak(error) {
        console.error("Error thrown, getting position. Error:", error);
        this.positions = this.getPositions(this.iterator.charactersSeen);

        error.message += ` at ` + this.getPositionMessage();
        throw error;
    }

    assert(condition, message) {
        if (!condition) {
            if (message) {
                throw new Error("AssertionError: " + message.replace(/\n/g, "\\n"));
            } else {
                throw new Error("AssertionError: message not given");
            }
        }
    }

    _generate() {
        if (this.parsedInput.length === 0)
            return "";

        timeLog("CodeGenerator: _generate called.");
        this._pushLineHead("", null);

        this.currentNode = this.ast;
        this.print(this.ast);
        timeLog("CodeGenerator: printed AST");

        if (this.nestingLevels.length &&
            this.nestingLevels[this.nestingLevels.length - 1] === null) {
            this.nestingLevels[this.nestingLevels.length - 1] = 0;
        }

        // Don't iterate the 0 index; because no i - 1 element
        for (let i = this.nestingLevels.length - 1; i > 0; i--) {
            // If previous nesting level is null, set its' nesting level
            // to our nesting level
            if (this.nestingLevels[i - 1] === null) {
                this.nestingLevels[i - 1] = this.nestingLevels[i];
            }
        }

        timeLog("CodeGenerator: processed nesting levels");

        let lines = map(this.lines, (line, index) => {
            const nestingLevel = this.nestingLevels[index];
            const indentLevel = this.getIndentLevel(index);

            this.assert(nestingLevel !== null, "nestingLevel is not null");
            this.assert(nestingLevel !== undefined, "nestingLevel is defined");

            this.assert(indentLevel !== null, "indentLevel is not null");
            this.assert(indentLevel !== undefined, "indentLevel is defined");

            let leader = "";

            if (line === "" || isWhitespace(line)) {
                return leader;
            }

            return leader + getIndentString(indentLevel) + line;
        });

        timeLog(`CodeGenerator: processed ${lines.length} lines`);

        const out = fastJoin(lines, "\n");

        timeLog("CodeGenerator: joined lines");

        return out;
    }

    generate() {
        try {
            return this._generate();
        } catch (error) {
            this.croak(error);
        }
    }

    pushBlackspace(text) {
        this.assert(!isGreyspace(text), `"${text}" should not be greyspace`);

        this._pushLineTail(text, true);
    }

    pushGreyspace(text) {
        this.assert(isGreyspace(text), `"${text}" should be greyspace`);

        if (text === "") {
            // Do nothing
        } else if (text === " ") {
            this._pushLineTail(" ", false);
        } else {
            let formattedText = this._formatGreyspace(text);
            let lines = formattedText.split("\n");

            this._pushLineTail(lines.shift(), false);

            for (let i = 0; i < lines.length; i++) {
                this._pushLineHead(lines[i]);
            }

            return lines.length;
        }
    }

    _pushLineHead(text) {
        this.assert(text !== undefined, "text does not equal undefined");

        this.lines.push(text);

        this.linePairings.push(null);
        this.nestingLevels.push(null);
    }

    _pushLineTail(text, getNestingLevel) {
        this.assert(text !== undefined, "text does not equal undefined");
        this.assert(this.lines.length > 0, "At least one line");

        this.lines[this.lines.length - 1] += text;

        if (getNestingLevel &&
            this.nestingLevels[this.nestingLevels.length - 1] === null) {

            let nestingLevel = this.getNestingLevel();
            this.nestingLevels[this.nestingLevels.length - 1] = nestingLevel;
        }
    }

    _lineHandler(line, index) {
        if (index === 0)
            return line;

        return line.trim();
    }

    _formatGreyspace(greyspace) {
        this.assert(isGreyspace(greyspace), `${greyspace} must be greyspace`);

        const parsedGreyspaces = parseGreyspace(greyspace);

        let transformedString = "";
        for (var i = 0; i < parsedGreyspaces.length; i++) {
            let greyspace = parsedGreyspaces[i];

            if (greyspace.type === "blockComment") {
                greyspace.value = this._formatBlockComment(greyspace.value);
            } else {
                let lines = greyspace.value.split("\n");
                lines = map(lines, this._lineHandler);
                greyspace.value = fastJoin(lines, "\n");
            }

            transformedString += greyspace.value;
        }

        return transformedString;
    }

    // format multiline block comments into nice-looking block comments
    _formatBlockComment(comment) {
        let lines = comment.split("\n");
        lines = map(lines, (line, index) => {
            if (index === 0)
                return line;

            const isLast = index + 1 === lines.length;
            let replacement = " *";
            if (!isLast)
                replacement += " ";

            // Replace all leading whitespace with indentation + single whitespace
            line = line.replace(/^\s*\*?\s?/, replacement);

            line = line.replace(/^(.*?)\s*$/, "$1");

            return line;
        });

        return fastJoin(lines, "\n");
    }

    /**
     * Count all elements in this.parents;
     * except for those consecutively followed by the same type.
     */
    getNestingLevel() {
        if (types.isTemplateString(this.currentNode)) {
            let startLine = this.currentNode.loc.start.line;
            let endLine = this.currentNode.loc.end.line;
            if (startLine !== endLine) {
                return 0;
            }
        }

        let parentCount = 0;
        let parents = this.parents;

        // Start at index 1 to prevent out-of-bounds array access for prevParent
        // And skip first 3 nodes (Program and _statements, and next top-level)
        // node
        // parents =
        //  0: Program,
        //  1: _statements,
        //  2: effectively ignored by not having any real parents
        //  3+: nodes we need to count
        //
        // Optimize currentNode being part of parents by adding it in here,
        // instead of cloning entire parents array each time.
        const len = parents.length;
        const iterEnd = parents.length + 1;
        for (let i = 3; i < iterEnd; i++) {
            let prevParent = parents[i - 1];
            let currentParent = i === len ? this.currentNode : parents[i];

            // ignore function body that AST disguises as BlockStatement
            if (types.isFunction(currentParent))
                continue;
            if (types.isIdentifier(currentParent))
                continue;
            if (types.is_statements(prevParent))
                continue;

            if (nestingLevelType(currentParent.type) !== nestingLevelType(prevParent.type)) {
                parentCount++;
            }
        }

        return parentCount;
    }

    getIndentLevel(index) {
        const nestingLevel = this.nestingLevels[index];
        const linePairing = this.linePairings[index];

        this.assert(nestingLevel !== null, `nestingLevel is not null`);

        let indentLevel = 0;

        if (linePairing !== null && linePairing !== index) {
            indentLevel = this.indentLevels[linePairing];
            this.lineLog(`setting indentLevel to ${indentLevel} for ${index} from indent level @ ${linePairing}`);
        } else {
            for (let i = index - 1; i >= 0; i--) {
                const previousIndentLevel = this.indentLevels[i];
                const previousNestingLevel = this.nestingLevels[i];

                this.assert(previousNestingLevel !== null, `previousNestingLevel is not null at ${i} with ${index}`);
                this.assert(previousIndentLevel !== undefined, `indentLevels is defined at ${i} with ${index}`);

                if (nestingLevel < previousNestingLevel)
                    continue;

                if (nestingLevel === previousNestingLevel) {
                    indentLevel = previousIndentLevel;
                } else {
                    indentLevel = previousIndentLevel + 1;
                }
                break;
            }

            this.lineLog(`ran through possible indent levels for ${index}`);
        }

        this.indentLevels.push(indentLevel);

        return indentLevel;
    }

    _spaceWrap(string) {
        return " " + string.trim() + " ";
    }

    isCurrent(string) {
        return string === this.iterator.current();
    }

    isNext(string) {
        let peekingIterator = this.iterator.peek();
        peekingIterator.advanceUnlessAtEnd();

        return string === peekingIterator.current();
    }

    pairLine(offset, count, toLine) {
        for (let i = 0; i < count; i++) {
            const index = this.linePairings.length + offset - i;

            // assert that the pairing is null or that the values are equivalent
            this.assert(this.linePairings[index] === null ||
                toLine === this.linePairings[index],
                `${index} is already paired to ${this.linePairings[index]}, ` +
                `attempting pairing to: ${toLine}`);
            this.linePairings[index] = toLine;
        }
    }

    ensure(string) {
        let currentValue = this.iterator.current();

        this.lineLog(`ensuring: "${string}" got "${currentValue}" in ${this.currentNode.type}`);

        if (string === ";" && currentValue !== ";") {
            this.lineLog("missing semicolon in input, forcing insert.");
            this.warn("Encountered missing semicolon in input. Forcing insert of semicolon.");
            this.pushBlackspace(";");
        } else {
            this.assert(currentValue === string,
                `currentValue should equal string: "${currentValue}" == "${string}"`);

            if (currentValue === "}" || currentValue === "]" ||
                (currentValue === ")" &&
                (types.isFunction(this.currentNode) ||
                types.isCallExpression(this.parents[this.parents.length - 2])))
                || currentValue === ">") {

                let levelsUp = 2;

                // if the parent of the current node is _statements, then we
                // want to use ourselves.
                if (this.parents[this.parents.length - 2].type === "_statements" ||
                    this.currentNode.type === "_member_expression_accessor" ||
                    this.currentNode.type === "ArrayExpression") {
                    levelsUp = 1;
                }

                // Only set the line pairing for the current line if we are the
                // first blackspace being pushed onto the line
                if (this.nestingLevels[this.nestingLevels.length - 1] === null) {
                    this.assert(this.openGroups.length >= levelsUp);
                    const pairing = this.openGroups[this.openGroups.length - levelsUp];
                    this.pairLine(-1, 1, pairing);
                }
            }

            this.pushBlackspace(currentValue);
            this.iterator.advanceUnlessAtEnd();
        }
    }

    ensureSpace() {
        let current = this.iterator.current();

        this.lineLog(`ensureSpace("${current}")`);

        // current is whitespace (not including newlines)
        const allowNewlines = types.isExpressionLike(this.currentNode) ||
            types.isFunction(this.currentNode);

        if (
            (allowNewlines && isSingleLineWhitespace(current)) ||
            (!allowNewlines && isWhitespace(current))) {
            this.pushGreyspace(" ");
        } else if (isGreyspace(current)) {
            if (current.indexOf("\n") === -1) {
                current = this._spaceWrap(current);
            }

            this.pushGreyspace(current);
        } else {
            throw new Error(`ensuring space with not a space: "${current}"`);
        }

        this.iterator.advanceUnlessAtEnd();
    }

    ensureVoid() {
        let current = this.iterator.current();
        this.iterator.advanceUnlessAtEnd();
        this.lineLog(`ensureVoid(): "${current}"`);

        if (isSingleLineWhitespace(current)) {
            return this.pushGreyspace("");
        } else if (isGreyspace(current)) {
            return this.pushGreyspace(current);
        } else {
            throw new Error(`unhandled case in ensureVoid: ${current}`);
        }
    }

    ensureNewline() {
        let current = this.iterator.current();

        if (!isGreyspace(current)) {
            this.lineLog(`ensureNewline(): not at greyspace node, forcing newline.`);
            return this.pushGreyspace("\n");
        } else {
            this.iterator.advanceUnlessAtEnd();

            if (current.indexOf("\n") === -1) {
                current += "\n";
            }

            current = current.replace(/^[^\S\n]\n/, "\n");

            this.lineLog(`ensureNewline(): "${current}"`);
            return this.pushGreyspace(current);
        }
    }

    ensureAtEnd() {
        this.assert(this.iterator.atEnd(), `asserting that iterator is at end.`);
        this.lineLog("ensured at end");
    }

    print(node) {
        if (node.extra && node.extra.parenthesized) {
            let slice = this.input.slice(node.extra.parenStart, node.start);
            let parenAmount = 0;

            for (let i = 0; i < slice.length; i++) {
                if (slice.charAt(i) === "(") {
                    parenAmount++;
                } else {
                    break;
                }
            }

            let modifiedNode = assign({}, node, { extra: { parenthesized: false } });

            this.print({
                type: "ParenthesizedExpression",
                expression: modifiedNode,
                parenAmount: parenAmount
            });
        } else {
            let parent = this.enterPrint(node);

            if (this[node.type]) {
                this[node.type](node, parent);
            } else {
                throw new Error(new Error(`can't handle printing node type: ${node.type}`));
            }

            this.exitPrint(parent);
        }
    }

    /**
     * Simple wrapper for word-printing with possible indentation.
     */
    printFake(word) {
        let previous = this.enterPrint({ type: `__${word}__` });
        this.ensure(word);
        this.exitPrint(previous);
    }

    printNodeAs(node, type) {
        this[type](node);
    }

    startGroup() {
        this.lineLog("Starting group:", this.currentNode.type, "on line:", this.lines.length - 1);

        this._pushLineTail("", true);

        this.openGroups.push(this.lines.length - 1);
    }

    stopGroup() {
        this.openGroups.pop();
    }

    enterPrint(node) {
        this.assert(this.currentNode, "currentNode is defined");

        this.lineLog("setting current node to:", node.type);

        let parent = this.currentNode;
        this.currentNode = node;
        this.parents.push(this.currentNode);

        this.lineLog(`:: this.enterPrint(${node.type})`);
        this.startGroup();

        return parent;
    }

    exitPrint(parent) {
        this.stopGroup();

        this.parents.pop();
        this.currentNode = parent;
        this.lineLog("restoring current node to:", this.currentNode.type);
    }

    nodeContainsNewlines(node) {
        return node.loc.start.line !== node.loc.end.line;
    }
}

import * as generators from "./generators";

const keys = Object.keys(generators);
for (let i = keys.length - 1; i >= 0; i--) {
    let generatorName = keys[i];

    if (CodeGenerator.prototype[generatorName])
        throw new Error(`${generatorName} already added to CodeGenerator.`);

    CodeGenerator.prototype[generatorName] = generators[generatorName];
}
