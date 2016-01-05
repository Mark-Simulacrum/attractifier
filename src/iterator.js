export default class Iterator {
    constructor(array) {
        this.array = array;
        this.pos = 0;
        this.peeking = false;
        this.charactersSeen = 0;
    }

    advance() {
        this._incrementPosition();
        if (this.atEnd()) {
            throw new Error("iterator advanced past end");
        }
    }

    advanceUnlessAtEnd() {
        if (!this.atEnd()) {
            this._incrementPosition();
        }
    }

    _incrementPosition() {
        this.charactersSeen += this.current().length;
        this.pos++;
    }

    peek() {
        let iter = new Iterator(this.array);
        iter.pos = this.pos;
        iter.peeking = true;
        return iter;
    }

    current() {
        return this.array[this.pos];
    }

    isCurrent(value) {
        return this.current() === value;
    }

    atEnd() {
        return this.pos + 1 >= this.array.length;
    }
}
