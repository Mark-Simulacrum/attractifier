export default class Iterator {
    constructor(array) {
        this.array = array;
        this.pos = 0;
        this.peeking = false;
    }

    advance() {
        this.pos++;
        if (this.atEnd()) {
            throw new Error("iterator advanced past end");
        }
    }

    advanceUnlessAtEnd() {
        if (!this.atEnd()) {
            this.pos++;
        }
        // console.log("advanceUnlessAtEnd", this.atEnd(), this.pos, this.peeking, this.array.length);
        // assert(this.peeking || this.pos !== 127);
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
