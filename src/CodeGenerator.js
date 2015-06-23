import filter from "lodash.filter";
import each from "lodash.foreach";
import map from "lodash.map";

import Iterator from "./iterator";
import {parseGreyspace, isGreyspace, log} from "./utils";

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

        this.out = "";
        this.indentation = 0;
        this.parents = [];
        this.times = {};
        this.stoppedTimes = {};

        this.parsedInput = parsedInput;
        this.insertedSemicolons = insertedSemicolons;
        this.positions = this.getPositions();
    }

    task(task) {
        if (this.times[task]) {
            let diff = process.hrtime(this.times[task]);
            this.stoppedTimes[task] = diff;
            this.times[task] = null;
        } else {
            this.times[task] = process.hrtime();
        }
    }

    log(...messages) {
        let times = Object.keys(this.stoppedTimes).map(task => {
            let time = this.stoppedTimes[task];
            return `${task} took ${prettyTime(time)}`;
        });

        const indentation = repeat(" ", this.parents.length * 4);
        log(indentation +
            `At ${this.getPositionMessage()}:`,
            fastJoin(fastJoin(messages, " ").split("\n"), "\\n") +
            "\n" + indentation + fastJoin(times, "\n" + indentation));

        this.stoppedTimes = {};
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

    generate() {
        this.print(this.ast);

        let lines = this.out.split("\n");
        lines = lines.map(line => {
            if (/^\s*$/.test(line)) {
                return "";
            }

            return line;
        });

        this.out = fastJoin(lines, "\n");

        return this.out;
    }

    push(string) {
        this.log(`::push("${string}")`);
        this.task("pushing string");
        this.out += string;
        this.task("pushing string");
    }

    indent() {
        this.indentation++;
        this.log("indented:", this.indentation);
    }

    dedent() {
        this.indentation--;
        this.log("dedented:", this.indentation);
    }

    getIndentationString() {
        return repeat(" ", this.indentation * 4);
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

    ensure(string) {
        let currentValue = this.iterator.current();

        this.log(`ensure("${string}"): "${currentValue}"`);

        this.assert(currentValue === string, "current value is equal to string");
        this.assert(!isGreyspace(currentValue), "should be false: isGreyspace(currentValue)");

        this.push(currentValue);
        this.iterator.advanceUnlessAtEnd();
    }

    isCurrent(string) {
        this.log(`isCurrent("${string}"): ${string === this.iterator.current()}`);

        return string === this.iterator.current();
    }

    isNext(string) {
        let peekingIterator = this.iterator.peek();
        peekingIterator.advanceUnlessAtEnd();

        this.log(`isNext("${string}"): ${string === peekingIterator.current()}`);

        return string === peekingIterator.current();
    }

    ensureSpace() {
        let current = this.iterator.current();
        this.log(`ensureSpace(): "${current}"`);

        // current is whitespace (not including newlines)
        if (/^[^\S\n]*$/.test(current)) {
            this.push(" ");
        } else if (isGreyspace(current)) {
            if (!/\n/.test(current)) {
                current = this._spaceWrap(current);
            }

            current = this.ensureIndentation(current);
            this.push(current);
        } else {
            this.croak(`ensuring space with not a space: "${current}"`);
        }

        this.iterator.advanceUnlessAtEnd();
    }

    ensureVoid() {
        let current = this.iterator.current();

        // current is whitespace (not including newlines)
        if (/^\s*$/.test(current)) {
            this.log(`ensureVoid(""): "${current}"`);
            this.push("");
        } else if (isGreyspace(current)) {
            this.log(`ensureVoid(Greyspace): "${current}"`);
            this.push(this.ensureIndentation(current));
        } else {
            this.log(`ensureVoid(): "${current}"`);
            this.croak("unhandled case in ensureVoid");
        }

        this.iterator.advanceUnlessAtEnd();
    }

    ensureNewline() {
        this.task("ensureNewline()");
        let current = this.iterator.current();

        this.assert(isGreyspace(current), `"${current}" is not greyspace`); // current has to be greyspace

        if (!/\n/.test(current)) { // contains newline
            current += "\n";
        }

        current = current.replace(/^[^\S\n]\n/, "\n");

        let indentedCurrent = this.ensureIndentation(current);
        this.push(indentedCurrent);
        this.iterator.advanceUnlessAtEnd();
        this.task("ensureNewline()");

        this.log(`ensureNewline(): "${current}"`);
    }

    insertIndentation() {
        this.log("insertIndentation()");
        this.task("insertIndentation()");
        this.out = this.out.replace(/\n[^\S\n]*$/, "\n" + this.getIndentationString());
        this.task("insertIndentation()");
    }

    // format multiline block comments into nice-looking block comments
    formatBlockComment(comment) {
        const indentation = this.getIndentationString();

        let lines = comment.split("\n");
        lines = lines.map((line, index) => {
            if (index === 0) return line;

            const isLast = index + 1 === lines.length;
            let replacement = indentation + " *";
            if (!isLast) replacement += " ";

            // Replace all leading whitespace with indentation + single whitespace
            line = line.replace(/^\s*\*?\s?/, replacement);
            return line;
        });

        return fastJoin(lines, "\n");
    }

    ensureIndentation(string) {
        // if (isGreyspace(string) && !/^\s*$/.test(string)) return string;

        // parseGreyspace will throw if given a string that is not greyspace.
        const indentation = this.getIndentationString();
        let parsedNodes = parseGreyspace(string);

        this.log(`ensureIndentation("${string}"): ${JSON.stringify(parsedNodes)}`);

        let transformedString = "";
        for (let node of parsedNodes) {
            if (node.type === "blockComment") {
                node.value = this.formatBlockComment(node.value);
            } else {
                let lines = node.value.split("\n");
                lines = lines.map((line, index) => {
                    if (index === 0) return line;

                    line = line.replace(/^\s*/, indentation);
                    return line;
                });
                this.log("lines: ", JSON.stringify(lines));

                node.value = fastJoin(lines, "\n");
            }

            transformedString += node.value;
        }

        return transformedString;
    }

    ensureAtEnd() {
        this.assert(this.iterator.atEnd(), `asserting that iterator is at end.`);
        this.log("ensured at end");
    }

    printIndented(node) {
        this.indent();
        this.print(node);
        this.dedent();
    }

    print(node) {
        this.parents.push(this.currentNode);

        if (this[node.type]) {
            let parent = this.currentNode;
            this.currentNode = node;

            this.log(`:::print(${node.type})`);
            try {
                this[node.type](node, parent);
            } catch (error) {
                this.croak(error);
            }

            this.currentNode = parent;
        } else {
            this.croak("cannot handle printing type: " + node.type);
        }

        this.parents.pop(this.currentNode);
    }

    nodeContainsNewlines(node) {
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

        return this.input.slice(start, end).indexOf("\n") >= 0;
    }

    isFunction(node) {
        return this.isFunctionExpression(node) || this.isFunctionDeclaration(node);
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
