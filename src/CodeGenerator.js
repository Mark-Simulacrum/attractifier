import fs from "fs";
import assert from "assert";
import util from "util";
import repeat from "lodash.repeat";
import each from "lodash.foreach";

import InputStream from "./InputStream";
import Iterator from "./iterator";
import {isGreyspace, log} from "./utils";

class Position {
    constructor(string) {
        this.string = string;
        this.lastChar = 0;
        this.position = {
            line: 1,
            col: 1
        };
    }

    update(char) {
        let incrementStr = this.string.slice(this.lastChar, char);
        for (let i = 0; i < incrementStr.length; i++) {
            let ch = incrementStr.charAt(i);
            if (ch === "\n") {
                this.position.col = 0;
                this.position.line++;
            } else {
                this.position.col++;
            }
        }
        this.lastChar = char;
    }

    getString() {
        return `${this.position.line}:${this.position.col}`;
    }
}

function fastJoin(array, joiner) {
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
    constructor(ast, input, parsedInput) {
        this.ast = ast;
        this.input = input;
        this.parsedInput = parsedInput;
        this.position = new Position(input);
        this.iterator = new Iterator(parsedInput);
        this.out = "";
        this.indentation = 0;
        this.parents = [];
    }

    log(...messages) {
        log(repeat(" ", this.parents.length * 4),
            `At ${this.getPosition().getString()}: `,
            fastJoin(fastJoin(messages, " ").split("\n"), "\\n")
        );
    }

    getPosition() {
        let outputtedInput = fastJoin(this.parsedInput.slice(0, this.iterator.pos), "");
        this.position.update(outputtedInput.length);
        return this.position;
    }

    getPositionMessage() {
        return ` at ${this.getPosition().getString()}.`;
    }

    croak(message) {
        if (message instanceof Error) {
            message.msg += this.getPositionMessage();
            throw message;
        } else {
            throw new Error(message + this.getPositionMessage());
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
        this.out += string;
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
        let current = this.iterator.current();

        this.assert(isGreyspace(current), `"${current}" is not greyspace`); // current has to be greyspace

        this.log(`ensureNewline(): "${current}"`.replace(/\n/g, "\\n"));

        if (!/\n/.test(current)) { // contains newline
            current += "\n";
        }

        current = current.replace(/^[^\S\n]\n/, "\n");

        let indentedCurrent = this.ensureIndentation(current);
        this.push(indentedCurrent);
        this.iterator.advanceUnlessAtEnd();
    }

    insertIndentation() {
        this.log("insertIndentation()");
        this.out = this.out.replace(/\n[^\S\n]*$/, "\n" + this.getIndentationString());
    }

    ensureIndentation(string) {
        const indentation = repeat(" ", this.indentation * 4);

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
        if (Array.isArray(node)) {
            if (node.length > 0) {
                return this.input.slice(
                    node[0].start, node[node.length - 1].end
                    ).indexOf("\n") >= 0;
            } else {
                return false;
            }
        }

        return this.input.slice(node.start, node.end).indexOf("\n") >= 0;
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
