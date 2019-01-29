import { PeekableSequence } from '../utilities';

export interface NumberMatch {
    value: number;
    length: number;
}

    // A "period" is a three-digit grouping of numerical digits in standard form.
    // e.g. the thousands period, the millions period, etc. The `Period` interface
    // represents the numeric value of the sequence of digits that make uo 
    // particular period.
    export interface Period {
    // The numerical value of this period's input terms.
    value: number;

    // TODO: do periods even need magnitudes?
    // The log base 10 of this period's least significant digit.
    // E.g. the magnitude of 20 is 0, because 20 is in the 1s period.
    // The magnitude of 20,000 is 3, because 20,000 is in the 1000s period.
    magnitude: number;

    // The number of input terms this period spans.
    length: number;
}

export type StemAndHash = (term: string) => number;

const quantifyingDigits: Array<[string, number]> = [
    ['one', 1],
    ['two', 2],
    ['three', 3],
    ['four', 4],
    ['five', 5],
    ['six', 6],
    ['seven', 7],
    ['eight', 8],
    ['nine', 9],
];

const elevenToNineteen: Array<[string, number]> = [
    ['eleven', 11],
    ['twelve', 12],
    ['thirteen', 13],
    ['fourteen', 14],
    ['fifteen', 15],
    ['sixteen', 16],
    ['seventeen', 17],
    ['eighteen', 18],
    ['nineteen', 19],
];

const ten: [string, number] = ['ten', 10];

const twentyToNinety: Array<[string, number]> = [
    ['twenty', 20],
    ['thirty', 30],
    ['forty', 40],
    ['fifty', 50],
    ['sixty', 60],
    ['seventy', 70],
    ['eighty', 80],
    ['ninety', 90],
];

const magnitudes: Array<[string, number]> = [
    ['thousand', 3],
    ['million', 6],
    ['billion', 9],
    ['trillion', 12],
];

// TODO: Does this even need to be a class?
export class NumberParser {
    stemAndHash: StemAndHash;

    A: number;
    AND: number;
    M2: number;
    Z: number;

    // [1..9]
    QD: Map<number, Period>;

    // [1..19]
    QU: Map<number, Period>;

    // [a, 1..9, 11..19]
    QUX10: Map<number, Period>;

    // [20, 30, 40, 50, 60, 70, 80, 90]
    QT: Map<number, Period>;

    magnitudes: Map<number, Period>;

    constructor(stemAndHash: StemAndHash) {
        this.stemAndHash = stemAndHash;

        this.A = this.stemAndHash('a');
        this.AND = this.stemAndHash('and');
        this.M2 = this.stemAndHash('hundred');
        this.Z = this.stemAndHash('zero');

        this.QD = this.createMap(quantifyingDigits);
        this.QU = this.createMap([...quantifyingDigits, ten, ...elevenToNineteen]);
        this.QUX10 = this.createMap([...quantifyingDigits, ...elevenToNineteen]);
        this.QT = this.createMap(twentyToNinety);
        this.magnitudes = this.createMagnitudeMap(magnitudes);
    }

    private createMap(items: Array<[string, number]>): Map<number, Period> {
        const m = new Map<number, Period>();
        for (const [text, value] of items) {
            const hash = this.stemAndHash(text);
            m.set(hash, { value, magnitude: 0, length: 1 });
        }
        return m;
    }

    private createMagnitudeMap(items: Array<[string, number]>): Map<number, Period> {
        const m = new Map<number, Period>();
        for (const [text, magnitude] of items) {
            const hash = this.stemAndHash(text);
            const value = Math.pow(10, magnitude);
            m.set(hash, { value, magnitude, length: 1 });
        }
        return m;
    }

    // Parses the input sequence to generate the set of numbers consistent
    // with the head of the input sequence. For example, the input sequence
    // 'one hundred twenty threee horses' is consistent with 1, 100, 120, and
    // 123.
    // 
    // The input sequence is a PeekableSequence of hashes of stemmed English
    // language words. The hashes should be consistent with the StemAndHash
    // function passed to the constructor.
    //
    // The resulting NumberMatches will be pushed onto the output array.
    parse(input: PeekableSequence<number>, output: NumberMatch[]) {
        if (input.nextIs(this.Z)) {
            // Special case for the term 'zero'.
            input.get();
            report(output, 0, 1);
            return;
        }

        let value: Period = {
            value: 0,
            magnitude: Infinity,
            length: 0
        };

        // Look for a sequence of periods with decreasing magnitude.
        while (!input.atEOF()) {
            const period = this.parsePeriod(input, value, output);
            if (!period || period.magnitude >= value.magnitude) {
                // We either couldn't parse the next period,
                // or its magnitude is not less than the current
                // magnitude. Stop parsing here.
                break;
            }

            value = add(value, period);
            report(output, value.value, value.length);
        }
    }

    // A "period" is a three-digit grouping of numerical digits in standard form.
    // e.g. the thousands period, the millions period, etc.
    private parsePeriod(input: PeekableSequence<number>, value: Period, output: NumberMatch[]): Period | undefined {
        const period = this.parseMQ(input, value, output);

        if (period && !input.atEOF()) {
            const magnitude = this.magnitudes.get(input.peek());
            if (magnitude) {
                // Report intermediate value returned by parseMQ().
                report(output, value.value + period.value, value.length + period.length);
                input.get();

                // Then update period with magnitude.
                period.value *= magnitude.value;
                period.magnitude = magnitude.magnitude;
                period.length += magnitude.length;
            }
        }

        return period;
    }

    private parseMQ(input: PeekableSequence<number>, value: Period, output: NumberMatch[]): Period | undefined {
        let period: Period | undefined;

        if (input.nextIs(this.A)) {
            input.skip(this.A);

            // Might be A ('a'), as in 'a million'
            period = { value: 1, magnitude: 0, length: 1 };

            // Consistant with either A or A M2 [[AND] TV]
            if (input.nextIs(this.M2)) {
                // NOTE: don't report here because `a` is not a number by itself.
                // TODO: decide whether `a` should be treated as the number `one`.
                // TODO: if `a` is `one`, what about `an`?

                // Consistent with A M2 [[AND] TV]
                period = this.parseM2ANDTV(input, value, output, period);
            }
        }
        else {
            // Consistent with either HQ M2 [[AND] TV] or just TV.
            period = this.parseTV(input, value, output);

            if (period && isHQ(period) && input.nextIs(this.M2)) {
                // Consistent with HQ M2 [[AND] TV].
                // Report intermediate value before parsing the M2.
                report(output, value.value + period.value, value.length + period.length);
                period = this.parseM2ANDTV(input, value, output, period);
            }
            else {
                // Consistent with TV
                // Just fall through to end of function.
            }
        }

        return period;
    }

    private parseM2ANDTV(input: PeekableSequence<number>, v: Period, output: NumberMatch[], tv: Period): Period {
        input.skip(this.M2);
        let period = {
            value: tv.value * 100,
            length: tv.length + 1,
            magnitude: tv.magnitude
        };
        
        // We may be at an intermediate value, so report it here.
        // Save the current position in output so that we can roll back
        // and "unreport" this value if parseANDTV doesn't report
        // values of its own.
        const value = add(v, period);
        report(output, value.value, value.length);
        const current = output.length;

        const andtv = this.parseANDTV(input, value, output);
        period = add(period, andtv);

        // Pop off the value pushed before parseANDTV, if it is still
        // at the end of the output array. In this case the value will
        // be returned and then reported by the caller.
        rollback(output, current);

        return period;
    }

    private parseANDTV(input: PeekableSequence<number>, value: Period, output: NumberMatch[]): Period | undefined {
        let period: Period | undefined;

        if (input.nextIs(this.AND)) {
            input.skip(this.AND);
            const tv = this.parseTV(input, value, output);
            // If we see AND, we require the TV.
            if (tv) {
                period = tv;
            }
        }
        else {
            // If we don't see AND, the TV is optional.
            period = this.parseTV(input, value, output);
        }

        return period;
    }

    private parseTV(input: PeekableSequence<number>, value: Period, output: NumberMatch[]): Period | undefined {
        // First try QU = [1..19]
        let period = this.parseQU(input);
        if (!period) {
            // Then try QT [QD]
            period = this.parseQT(input);
            if (period) {
                const qd = this.parseQD(input);
                if (qd) {
                    // Report here because this is an intermediate value.
                    report(output, value.value + period.value, value.length + period.length);
                    period = add(period, qd);
                }
            }
        }

        return period;
    }

    private parseQU(input: PeekableSequence<number>): Period | undefined {
        return this.parseToken(input, this.QU);
    }

    private parseQUX10(input: PeekableSequence<number>): Period | undefined {
        return this.parseToken(input, this.QUX10);
    }

    private parseQT(input: PeekableSequence<number>): Period | undefined {
        return this.parseToken(input, this.QT);
    }

    private parseQD(input: PeekableSequence<number>): Period | undefined {
        return this.parseToken(input, this.QD);
    }

    private parseToken(input: PeekableSequence<number>, m: Map<number, Period>): Period | undefined {
        let period: Period | undefined;

        if (!input.atEOF()) {
            const token = input.peek();

            period = m.get(token);
            if (period) {
                // IMPORTANT: must copy Period here because callers assume they
                // may make edits to the Period that is returned.
                // TODO: is there a safer/better way to do the copy?
                period = { ...period };
                input.get();
            }
        }

        return period;
    }
}

function report(output: NumberMatch[], value: number, length: number) {
    output.push({ value, length });
}

function rollback(output: NumberMatch[], current: number) {
    if (output.length === current) {
        output.pop();
    }
}

function add(a: Period, b: Period | undefined): Period {
    if (!b) {
        return a;
    }

    if (a.magnitude < b.magnitude) {
        throw TypeError('Periods `b` must have smaller magnitude.');
    }

    return {
        value: a.value + b.value,
        magnitude: b.magnitude,
        length: a.length + b.length
    };
}

function copy(a: Period) {
    return {...a};
}

function isHQ(period: Period) {
    return period.magnitude === 0 && period.value % 10 !== 0;
}
