import filter from "lodash.filter";
import each from "lodash.foreach";
import map from "lodash.map";
import endsWith from "lodash.endswith";

import Iterator from "./iterator";
import {parseGreyspace, isGreyspace, log, timeLog, getIndentString, shouldWrite as WillWrite} from "./utils";

function fastJoin(array, joiner = "") {
    let string = "";
    each(array, function (element, index) {
        string += element;
        if (index + 1 !== array.length) {
            string += joiner;
        }
    });
    return string;
}

export default class CodeGenerator {
    constructor(ast, input, parsedInput, insertedSemicolons) {
        this.ast = ast;
        this.input = input;
        this.iterator = new Iterator(parsedInput);

        this.parents = [];
        this.indentLevels = [];

        this.openGroups = [];
        this._openGroups = [];
        this.linePairings = [];

        this.nestingLevels = [];

        this.lines = [];

        this.parsedInput = parsedInput;
        this.insertedSemicolons = insertedSemicolons;
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
            })
            log(`${this.lines.length - 1}:`, ...messages);
        }
    }

    getSemicolonsBeforePosition(position) {
        return filter(this.insertedSemicolons, colonPosition => {
            return colonPosition <= position;
        }) || [];
    }

    getPositions() {
        let positions = {};

        let origString = this.input;

        let linesSeen = 1;
        let charsSeen = 0;
        let lastPos = 0;
        for (let pos = 0; pos < origString.length; pos++) {
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

            let semisBefore = this.getSemicolonsBeforePosition(pos).length;
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
        positions = map(this.parsedInput, (element, index) => {
            before += fastJoin(this.parsedInput.slice(index - 2, index - 1));
            let pos = positions[before.length];

            if (pos) {
                return pos;
            } else {
                return positions[Object.keys(positions).length - 1];
            }
        });

        return positions;
    }

    getPosition() {
        return this.positions[this.iterator.pos];
    }

    getPositionMessage() {
        let pos = this.getPosition();
        return `${pos.line}:${pos.column}`;
    }

    croak(message) {
        this.positions = this.getPositions();

        if (message instanceof Error) {
            message.msg += ` at ` + this.getPositionMessage();
            throw message;
        } else {
            throw new Error(message + ` at ` + this.getPositionMessage());
        }
    }

    assert(condition, message) {
        if (!condition) {
            if (message) {
                this.croak("AssertionError: " + message.replace(/\n/g, "\\n"));
            } else {
                this.croak("AssertionError: message not given");
            }
        }
    }

    _generate() {
        this._pushLineHead("", null);

        this.currentNode = this.ast;
        this.print(this.ast);
        timeLog("CodeGenerator.print(this.ast)");

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

        timeLog("CodeGenerator@processNestingLevels");

        let lines = map(this.lines, (line, index) => {
            const nestingLevel = this.nestingLevels[index];
            const indentLevel = this.getIndentLevel(index);

            this.assert(nestingLevel !== null, "nestingLevel is not null");
            this.assert(nestingLevel !== undefined, "nestingLevel is defined");

            this.assert(indentLevel !== null, "indentLevel is not null");
            this.assert(indentLevel !== undefined, "indentLevel is defined");

            let leader = "";
            // let table = [index, nestingLevel, indentLevel,
            //     this.linePairings[index]];

            // table = map(table, (item, index) => {
            //     if (item === null) item = "null";
            //     if (item === undefined) item = "undefined";

            //     const itemLength = item.toString().length;

            //     item += repeat(" ", 3 - itemLength);
            //     if (index === 0) item += ":";

            //     return item;
            // });

            // leader += fastJoin(table, " ")
            // leader += repeat(" ", 20 - leader.length) + "|";

            // leader = "";

            if (/^\s*$/.test(line)) {
                return leader;
            }

            return leader + getIndentString(indentLevel) + line;
        });

        timeLog("CodeGenerator@processedLines");

        const out = fastJoin(lines, "\n");

        timeLog("CodeGenerator@joinedLines");

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
        this.assert(!isGreyspace(text), `${text} should not be greyspace`);

        this._pushLineTail(text, this.getNestingLevel());
    }

    pushGreyspace(text) {
        this.assert(isGreyspace(text), `${text} should be greyspace`);
        text = this._formatGreyspace(text);
        let lines = text.split("\n");

        this._pushLineTail(lines.shift(), null);

        each(lines, line => {
            this._pushLineHead(line);
        });

        return lines.length;
    }

    _pushLineHead(text) {
        this.lines.push(text);

        this.linePairings.push(null);
        this.nestingLevels.push(null);
    }

    _pushLineTail(text, nestingLevel) {
        this.assert(text !== undefined, "text does not equal undefined");
        this.assert(this.lines.length > 0, "At least one line");
        this.assert(this.lines[this.lines.length - 1] !== undefined, "Last line isn't undefined");

        this.lines[this.lines.length - 1] += text;

        if (nestingLevel === null) return;

        if (this.nestingLevels[this.nestingLevels.length - 1] === null) {
            this.lineLog("setting nestingLevel to", nestingLevel);
            this.nestingLevels[this.nestingLevels.length - 1] = nestingLevel;
        }
    }

    _formatGreyspace(greyspace) {
        // parseGreyspace will throw if given a string that is not greyspace.
        const parsedGreyspaces = parseGreyspace(greyspace);

        this.lineLog(`_formatGreyspace("${greyspace}"): ${JSON.stringify(parsedGreyspaces)}`);

        let lineHandler = (line, index) => {
            if (index === 0) return line;

            return line.trim();
        };

        let transformedString = "";
        for (let greyspace of parsedGreyspaces) {
            if (greyspace.type === "blockComment") {
                greyspace.value = this._formatBlockComment(greyspace.value);
            } else {
                let lines = greyspace.value.split("\n");
                lines = map(lines, lineHandler);
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
            if (index === 0) return line;

            const isLast = index + 1 === lines.length;
            let replacement = " *";
            if (!isLast) replacement += " ";

            // Replace all leading whitespace with indentation + single whitespace
            line = line.replace(/^\s*\*?\s?/, replacement);
            return line;
        });

        return fastJoin(lines, "\n");
    }

    myType(type) {
        if (type === null) return "null";

        const typeObj = { type };

        if (this.isExpression(typeObj) ||
            this.isPattern(typeObj) || this.isSingleItem(typeObj)) return "_expression_";
        if (this.isExpressionLike(typeObj))
            return `_expression_like_${type}`;
        return type;
    }

    /**
     * Count all elements in this.parents;
     * except for those consecutively followed by the same type.
     */
    getNestingLevel() {
        let parentCount = 0;
        let parents = this.parents.concat(this.currentNode);

        // Start at index 1 to prevent out-of-bounds array access for prevParent
        // And skip first 3 nodes (Program and _statements, and next top-level)
        // node
        // parents =
        //  0: Program,
        //  1: _statements,
        //  2: effectively ignored by not having any real parents
        //  3+: nodes we need to count
        for (let i = 3; i < parents.length; i++) {
            let prevParent = parents[i - 1];
            let currentParent = parents[i];

            // ignore function body that AST disguises as BlockStatement
            if (this.isFunction(currentParent)) continue;
            if (this.isIdentifier(currentParent)) continue;
            if (this.isBlockStatement(currentParent) && this.isFunction(prevParent)) continue;
            if (this.is_statements(prevParent)) continue;

            if (this.myType(currentParent.type) !== this.myType(prevParent.type)) {
                parentCount++;
            }
        }

        this.lineLog("nestingLevel:", parentCount,
            "currentNode:", this.currentNode.type + "\n\t" +
            JSON.stringify(this.parents.slice(3).map(parent => parent.type)));

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

                // this.lineLog(`running: iteration #${index - 1 - i};\n\tpassed index=${index}; nestingLevel=${nestingLevel}; previousNestingLevel=${previousNestingLevel}`);
                this.assert(previousNestingLevel !== null, `previousNestingLevel is not null at ${i} with ${index}`);
                this.assert(previousIndentLevel !== undefined, `indentLevels is defined at ${i} with ${index}`);

                if (nestingLevel < previousNestingLevel) continue;

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

    _spaceWrap(string, { leading = true, trailing = true } = {}) {
        if (leading) {
            if (/^\s/.test(string)) {
                string = string.replace(/^[^\S\n]+/, " ");
            } else {
                string = " " + string;
            }
        }

        if (trailing) {
            if (/\s$/.test(string)) {
                string = string.replace(/[^\S\n]+$/, " ");
            } else {
                string += " ";
            }
        }

        return string;
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

        this.lineLog("ensuring:", currentValue, "from", this.currentNode.type);

        this.assert(currentValue === string,
            `current value (${currentValue}) is not equal to string (${string})`);

        if (currentValue === "}" || currentValue === ">" ||
            currentValue === "]" ||
            (currentValue === ")" &&
                (this.isFunction(this.currentNode) ||
                    this.isCallExpression(this.parents[this.parents.length - 2])))) {

            let levelsUp = 0;

            // if the parent of the current node is _statements, then we
            // want to use ourselves.
            if (this._openGroups[this._openGroups.length - 2] === "_statements" ||
                this.currentNode.type === "_member_expression_accessor" ||
                this.currentNode.type === "ArrayExpression") {
                levelsUp = 1;
            } else {
                levelsUp = 2;
            }

            this.assert(this.openGroups.length >= levelsUp);
            const pairing = this.openGroups[this.openGroups.length - levelsUp];

            this.lineLog("pairing:", pairing, "to", this.lines.length - 1, JSON.stringify(this._openGroups));

            // Only set the line pairing for the current line if we are the
            // first blackspace being pushed onto the line
            if (this.nestingLevels[this.nestingLevels.length - 1] === null) {
                this.pairLine(-1, 1, pairing);
            }
        }

        this.pushBlackspace(currentValue);
        this.iterator.advanceUnlessAtEnd();
    }

    startGroup() {
        const nestingLevel = this.getNestingLevel();
        this.lineLog("Starting group:", this.currentNode.type,
            "with nestingLevel:", nestingLevel, "on line:", this.lines.length - 1);
        this._pushLineTail("", nestingLevel);

        this.openGroups.push(this.lines.length - 1);
        this._openGroups.push(this.currentNode.type);
    }

    stopGroup() {
        const line = this.openGroups.pop();
        const type = this._openGroups.pop();

        this.lineLog("Stopping group:", this.currentNode.type,
            type, "from line:", line);

        // We are synchronized with currentNode
        this.assert(type === this.currentNode.type);
    }

    ensureSpace() {
        let current = this.iterator.current();

        this.lineLog(`ensureSpace("${current}")`);

        // current is whitespace (not including newlines)
        const allowNewlines = this.isExpressionLike(this.currentNode) ||
            this.isFunction(this.currentNode);

        if (
            (allowNewlines && /^[^\S\n]*$/.test(current)) ||
            (!allowNewlines && /^\s*$/.test(current))) {
            this.pushGreyspace(" ");
        } else if (isGreyspace(current)) {
            if (!/\n/.test(current)) {
                current = this._spaceWrap(current);
            }

            this.pushGreyspace(current);
        } else {
            this.croak(`ensuring space with not a space: "${current}"`);
        }

        this.iterator.advanceUnlessAtEnd();
    }

    ensureVoid() {
        let current = this.iterator.current();
        this.iterator.advanceUnlessAtEnd();
        this.lineLog(`ensureVoid(): "${current}"`);

        // current is whitespace (not including newlines)
        if (/^[^\S\n]*$/.test(current)) {
            return this.pushGreyspace("");
        } else if (isGreyspace(current)) {
            return this.pushGreyspace(current);
        } else {
            this.croak("unhandled case in ensureVoid");
        }

    }

    ensureNewline() {
        let current = this.iterator.current();
        this.iterator.advanceUnlessAtEnd();

        if (!/\n/.test(current)) { // contains newline
            current += "\n";
        }

        current = current.replace(/^[^\S\n]\n/, "\n");

        this.lineLog(`ensureNewline(): "${current}"`);
        return this.pushGreyspace(current);
    }

    ensureAtEnd() {
        this.assert(this.iterator.atEnd(), `asserting that iterator is at end.`);
        this.lineLog("ensured at end");
    }

    print(node) {
        try {
            let parent = this.enterPrint(node);

            this[node.type](node, parent);

            this.exitPrint(parent);
        } catch (error) {
            this.croak(error);
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

    printNodeAs(node, parent, type) {
        // generator(node, parent)
        this[type](node, parent);
    }

    enterPrint(node) {
        this.assert(this.currentNode);

        this.lineLog("setting current node to:", node.type);

        let parent = this.currentNode;
        this.currentNode = node;
        this.parents.push(this.currentNode);

        this.lineLog(`:::print(${node.type})`);
        this.startGroup();

        return parent;
    }

    exitPrint(parent) {
        this.stopGroup();

        this.parents.pop();
        this.currentNode = parent;
        this.lineLog("restoring current node to:", this.currentNode.type);
    }

    /**
     * Returns the start and end positions of a given AST node.
     *
     * If the node is an array, returns the start property
     * of the first node in the array, and the end property
     * of the last node in the array.
     */
    _getRange(node) {
        let start = node.start;
        let end = node.end;

        if (Array.isArray(node)) {
            if (node.length > 0) {
                start = node[0].start;
                end = node[node.length - 1].end;
            } else {
                return false;
            }
        }

        return { start, end };
    }

    nodeContainsNewlines(node) {
        let { start, end } = this._getRange(node);
        return this.input.slice(start, end).indexOf("\n") >= 0;
    }

    isFunction(node) {
        return this.isFunctionExpression(node) || this.isFunctionDeclaration(node) ||
            this.isMethodDefinition(node) || this.isArrowFunctionExpression(node);
    }

    isExpression(node) {
        return endsWith(node.type, "Expression");
    }

    isPattern(node) {
        return endsWith(node.type, "Pattern");
    }

    isSingleItem(node) {
        return this.isLiteral(node) ||
            this.isTemplateLiteral(node) || this.isIdentifier(node);
    }

    isExpressionLike(node) {
        return this.isExpression(node) || this.isPattern(node) ||
                    this.is_params(node) || this.isIdentifier(node) ||
                    this.isLiteral(node);
    }

    isStatement(node) {
        return endsWith(node.type, "Statement");
    }

    isFor(node) {
        return this.isForStatement(node) ||
            this.isForInStatement(node) ||
            this.isForOfStatement(node);
    }
}

import * as generators from "./generators";
const keys = Object.keys(generators);

function isFuncGenerator(type) {
    return function (node) {
        return node && node.type === type;
    };
}

for (let i = keys.length - 1; i >= 0; i--) {
    let generatorName = keys[i];

    if (CodeGenerator.prototype[generatorName])
        throw new Error(`${generatorName} already added to CodeGenerator.`);

    CodeGenerator.prototype[`is${generatorName}`] = isFuncGenerator(generatorName);
    CodeGenerator.prototype[generatorName] = generators[generatorName];
}
