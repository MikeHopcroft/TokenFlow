export class PeekableSequence<T> {
    iterator: IterableIterator<T>;
    current: IteratorResult<T>;

    constructor(iterator: IterableIterator<T>) {
        this.iterator = iterator;
        this.current = this.iterator.next();
    }

    peek(): T {
        if (!this.current.done) {
            return this.current.value;
        }
        else {
            throw TypeError('PeekableSequence<T>.peek(): at end of stream.');
        }
    }

    get(): T {
        if (!this.current.done) {
            const value = this.current.value;
            this.current = this.iterator.next();
            return value;
        }
        else {
            throw TypeError('PeekableSequence<T>.get(): at end of stream.');
        }
    }

    atEOF(): boolean {
        return this.current.done;
    }

    skipOptional(value: T): boolean {
        if (!this.atEOF() && this.peek() === value)
        {
            this.get();
            return true;
        }
        return false;
    }

    nextIs(value: T): boolean {
        if (!this.atEOF()) {
            return this.peek() === value;
        }

        return false;
    }
}

