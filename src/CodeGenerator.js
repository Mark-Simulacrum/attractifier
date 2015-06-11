import fs from "fs";
import assert from "assert";
import util from "util";
import repeat from "lodash.repeat";
import prettyTime from "pretty-hrtime";
import each from "lodash.foreach";

import InputStream from "./InputStream";
import Iterator from "./iterator";
import {isGreyspace, log} from "./utils";

function fastJoin(array, joiner = "") {
    let string = "";
    each(array, function join(element, index) {
        if (typeof element === "object") element = JSON.stringify(element);
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
            return `\n${task} took ${prettyTime(time)}`;
        });

        let posMessage = `At ${this.getPositionMessage()}: `;

        log(repeat(" ", this.parents.length * 4),
            posMessage,
            fastJoin(fastJoin(messages, " ").split("\n"), "\\n"),
            repeat(" ", posMessage.length),
            ...times);

        this.stoppedTimes = {};
    }

    getSemicolonsBeforePosition(position) {
        return this.insertedSemicolons.filter(colonPosition => {
            return colonPosition <= position;
        }) || [];
    }

    getPositions() {
        let positions = {};

        let newString = fastJoin(this.parsedInput);
        let origString = this.input;

        let linesSeen = 1;
        let charsSeen = 0;
        let lastPos = 0;
        for (let pos = 0; pos < origString.length; pos++) {
            let semisBefore = this.getSemicolonsBeforePosition(pos).length;

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
        positions = this.parsedInput.map((element, index) => {
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
            this.croak("AssertionError: " + message);
        }
    }

    generate() {
        this.print(this.ast);

        let lines = this.out.split("\n");
        lines = lines.map(line => {
            if (/^[^\S\n]*$/.test(line)) {
                return "";
            } else {
                return line;
            }
        });

        this.out = fastJoin(lines, "\n");

        return this.out;
    }

    push(string) {
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
        this.log(`ensureSpace(): "${current}"`.replace(/\n/g, "\\n"));

        // current is whitespace (not including newlines)
        if (/^[^\S\n]*$/.test(current)) {
            this.push(" ");
        } else if (isGreyspace(current)) {
            this.push(
                this.ensureIndentation(
                    this._spaceWrap(current)
                    )
                );
        } else {
            this.croak(`ensuring space with not a space: "${current}"`.replace((/\n/g, "\\n")));
        }

        this.iterator.advanceUnlessAtEnd();
    }

    ensureVoid() {
        let current = this.iterator.current();

        // current is whitespace (not including newlines)
        if (/^\s*$/.test(current)) {
            this.log(`ensureVoid(""): "${current}"`.replace(/\n/g, "\\n"));
            this.push("");
        } else if (isGreyspace(current)) {
            this.log(`ensureVoid(Greyspace): "${current}"`.replace(/\n/g, "\\n"));
            this.push(this.ensureIndentation(current));
        } else {
            this.log(`ensureVoid(): "${current}"`.replace(/\n/g, "\\n"));
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

    ensureIndentation(string) {
        const indentation = this.getIndentationString();

        let lines = string.split("\n");

        lines = lines.map((line, index) => {
            if (index === 0) return line;

            line = line.replace(/^\s*/, "");
            line = indentation + line;
            return line;
        });

        return lines.join("\n");
    }

    ensureAtEnd() {
        this.assert(this.iterator.atEnd(), `asserting that iterator is at end.`);
        this.log("ensured at end");
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
for (let generatorName of Object.keys(generators)) {
    CodeGenerator.prototype[`is${generatorName}`] = function (node) {
        this.log(`is${generatorName}(): ${node && node.type === generatorName}`);
        return node && node.type === generatorName;
    };

    if (generatorName in CodeGenerator.prototype) throw new Error("base generator already in CodeGenerator");
        CodeGenerator.prototype[generatorName] = generators[generatorName];
}
