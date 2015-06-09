export default class InputStream {
    constructor(input) {
        this.input = input;
        this.char = 0;
        this.consumed = null;
    }

    clone() {
        let copy = new InputStream(this.input);
        copy.input = this.input;
        copy.char = this.char;
        copy.consumed = this.consumed;

        return copy;
    }

    _updateConsumed(text) {
        this.consumed = text;
        this.char += text.length;
    }

    consume(condition) {
        this.consumed = null;

        if (this.atEnd()) return false;

        if (typeof condition === "string") {
            if (this.input.startsWith(condition, this.char)) { // Starts with the condition
                this._updateConsumed(condition);
                return true;
            }
        } else { // Assume that it is a regex
            // Will return even when the regex is empty (empty string match)
            let result = condition.exec(this.input.slice(this.char));
            if (result && result.index === 0) {
                this._updateConsumed(result[0]);
                return true;
            }
        }

        return false;
    }

    sync(other) {
        this.input = other.input;
        this.char = other.char;
        this.consumed = other.consumed;
    }

    peek() {
        return this.clone();
    }

    atEnd() {
        return this.char >= this.input.length;
    }
}
