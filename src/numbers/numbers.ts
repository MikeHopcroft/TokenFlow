import { PeekableSequence } from '../utilities';

// TODO: Unit test
// TODO: Emit edges with values and phrase lengths
//   Regions hold lengths?
//   Pass region down, instead of (value, length) tuple.

export interface Region {
    // The numerical value of this regions terms.
    value: number;

    // The magnitude of this region's most significant three-digit grouping.
    magnitude: number;

    // The number of terms this region spans.
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

export class NumberParser {
    stemAndHash: StemAndHash;

    A: number;
    AND: number;
    M2: number;
    Z: number;

    // [1..9]
    QD: Map<number, Region>;

    // [1..19]
    QU: Map<number, Region>;

    // [a, 1..9, 11..19]
    QUX10: Map<number, Region>;

    // [20, 30, 40, 50, 60, 70, 80, 90]
    QT: Map<number, Region>;

    magnitudes: Map<number, Region>;

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

    createMap(items: Array<[string, number]>): Map<number, Region> {
        const m = new Map<number, Region>();
        for (const [text, value] of items) {
            const hash = this.stemAndHash(text);
            m.set(hash, { value, magnitude: 0, length: 1 });
        }
        return m;
    }

    createMagnitudeMap(items: Array<[string, number]>): Map<number, Region> {
        const m = new Map<number, Region>();
        for (const [text, magnitude] of items) {
            const hash = this.stemAndHash(text);
            const value = Math.pow(10, magnitude);
            m.set(hash, { value, magnitude, length: 1 });
        }
        return m;
    }

    parseV(input: PeekableSequence<number>): number | undefined {
        let value = {
            value: 0,
            magnitude: 0,
            length: 0
        };

        if (input.nextIs(this.Z)) {
            input.get();
            this.report('parseV', value.value, 1);
            return value.value;
        }

        // Look for a sequence of regions with decreasing magnitude.
        let magnitude = Infinity;
        while (!input.atEOF()) {
            // COPYING value because parseRegion changes it.
            // COPY is now done by callee.
            // const region = this.parseRegion(input, {...value});
            const region = this.parseRegion(input, value);
            if (!region || region.magnitude >= magnitude) {
                // We either couldn't parse the next region,
                // or its magnitude is not less than the current
                // magnitude. Stop parsing here.
                break;
            }
            // TODO: Right now add requires both magnitudes to be zero.
            value = add(value, {...region, magnitude: 0});
            // value += region.value;
            magnitude = region.magnitude;
            this.report('parseV', value.value, value.length);
        }

        // TODO: need to handle the case where nothing is parsed
        // and we return undefined. Chances are this code will be
        // modified to return an edge with a value and a length.
        return value.value;
    }

    // TODO: what is this three-digit portion of a number, the
    // portion before each comma, called?
    parseRegion(input: PeekableSequence<number>, v: Region): Region | undefined {
        const value = copy(v);
        let region = this.parseMQ(input, value);

        if (region && !input.atEOF()) {
            const magnitude = this.magnitudes.get(input.peek());
            if (magnitude) {
                // TODO: parseRegion needs value to be passed in as region
                // in order to accumulate length correctly.
                this.report('parseRegion:1', value.value + region.value, value.length + region.length);

                input.get();
                region = multiply(region, magnitude);
                value.value += region.value;
                value.length += region.length;
                // this.report('parseRegion:2', value, 0);
            }
        }

        return region;
    }

    parseMQ(input: PeekableSequence<number>, v: Region): Region | undefined {
        let value = copy(v);
        let region: Region | undefined;

        if (input.nextIs(this.A)) {
            input.skip(this.A);

            // Might be A ('a'), as in 'a million'
            region = { value: 1, magnitude: 0, length: 1 };

            // Consistant with either A or A M2 [[AND] TV]
            if (input.nextIs(this.M2)) {
                // This is A M2 [[AND] TV]
                region.value *= 100;
                region.length += 1;
                input.skip(this.M2);

                // Do report intermediate value.
                value.value += region.value;
                value.length += region.length;
                this.report('parseMQ:1', value.value, value.length);

                region = add(region, this.parseANDTV(input, value));

                value.value += region.value;
                value.length += region.length;
                // Don't report final values.
                // this.report('parseMQ:2', value, 0);
            }
        }
        else {
            // Consistent with either HQ M2 [[AND] TV] or just TV.
            region = this.parseTV(input, value);

            if (region) {
                //                value += region.value;
                // TODO: ONLY REPORT HERE IF THIS IS AN INTERMEDIATE VALUE.
                // this.report('parseMQ:2', value + region.value, 0);
            }

            if (region && isHQ(region) && input.nextIs(this.M2)) {
                this.report('parseMQ:2', value.value + region.value, value.length + region.length);

                // Consistent with HQ M2 [[AND] TV].
                input.skip(this.M2);
                region.value *= 100;
                region.length++;

                // TODO: How to decide when to report here. It is possible
                // that andtv() will need to report, but it seems its report
                // should come after this function reports. Do we care?
                // Our semantics for determining whether to report seem correct.
                // We'd just like to report vefore andtv() if possible, but we
                // don't know until andtv() returns, whether we should have
                // reported.
                // value += region.value;
                value = add(value, region);
                const andtv = this.parseANDTV(input, value);
                if (andtv) {
                    this.report('parseMQ:3', value.value, value.length);
                    value = add(value, andtv);
                    this.report('parseMQ:4', value.value, value.length);
                    region = add(region, andtv);
                }

                // Only report intermediate values.
                // value += region.value;
                // this.report('parseMQ:4', value + region.value, 0);
            }
            else {
                // Otherwise, region is consistent with TV.
            }
        }

        return region;
    }

    parseANDTV(input: PeekableSequence<number>, v: Region): Region | undefined {
        const value = copy(v);
        let region: Region | undefined;

        if (input.nextIs(this.AND)) {
            input.skip(this.AND);
            const tv = this.parseTV(input, value);
            // If we see AND, we require the TV.
            if (tv) {
                region = tv;
            }
        }
        else {
            // If we don't see AND, the TV is optional.
            region = this.parseTV(input, value);
        }

        return region;
    }

    parseHQ(input: PeekableSequence<number>, v: Region): Region | undefined {
        const value = copy(v);

        // First try QUX10 = [a, 1..9, 11..19].
        let region = this.parseQUX10(input);

        if (!region) {
            // Then try QT QD.
            const qt = this.parseQT(input);
            const qd = this.parseQD(input);

            // Need both QT and QD. Disallow "twenty hundred".
            if (qt && qd) {
                region = add(qt, qd);
                value.value += region.value;
                value.length += region.length;
                this.report('parseHQ:2', value.value, value.length);
            }
        }
        else {
            value.value += region.value;
            value.length += region.length;
            this.report('parseHQ:1', value.value, value.length);
        }

        return region;
    }

    parseTV(input: PeekableSequence<number>, v: Region): Region | undefined {
        const value = copy(v);

        // First try QU = [1..19]
        let region = this.parseQU(input);
        if (!region) {
            // Then try QT [QD]
            region = this.parseQT(input);
            if (region) {
                const qd = this.parseQD(input);
                if (qd) {
                    // Report here because this is an intermediate value.
                    this.report('parseTV:2', value.value + region.value, value.length + region.length);
                    region = add(region, qd);
                    //                    region = add(region, this.parseQD(input));
                }
            }
        }
        else {
            // Don't report here. The pattern is to only report internal
            // value change steps on the way to the final value.
            //            this.report('parseTV:1', value + region.value, 0);
        }

        return region;
    }

    parseQU(input: PeekableSequence<number>): Region | undefined {
        return this.parseToken(input, this.QU);
    }

    parseQUX10(input: PeekableSequence<number>): Region | undefined {
        return this.parseToken(input, this.QUX10);
    }

    parseQT(input: PeekableSequence<number>): Region | undefined {
        return this.parseToken(input, this.QT);
    }

    parseQD(input: PeekableSequence<number>): Region | undefined {
        return this.parseToken(input, this.QD);
    }

    parseToken(input: PeekableSequence<number>, m: Map<number, Region>): Region | undefined {
        let region: Region | undefined;

        if (!input.atEOF()) {
            const token = input.peek();

            region = m.get(token);
            if (region) {
                // IMPORTANT: need to copy region here because callers assume
                // they may make edits. TODO: is there a safer/better way to 
                // do the copy?
                region = { ...region };
                input.get();
            }
        }

        return region;
    }

    parseM() {
    }

    report(location: string, value: number, length: number) {
        console.log(`  ${location}: value: ${value}, length: ${length}`);
    }
}


function multiply(a: Region, b: Region): Region {
    if (a.magnitude !== 0) {
        throw TypeError('Region `a` must have magnitude zero.');
    }

    return { 
        value: a.value * b.value,
        magnitude: b.magnitude,
        length: a.length + b.length
    };
}

function add(a: Region, b: Region | undefined): Region {
    if (!b) {
        return a;
    }

    if (a.magnitude !== 0 || b.magnitude !== 0) {
        throw TypeError('Regions `a` and `b` must have magnitude zero.');
    }

    return {
        value: a.value + b.value,
        magnitude: a.magnitude,
        length: a.length + b.length
    };
}

function copy(a: Region) {
    return {...a};
}

function valueOf(regions: Region[]): number | undefined {
    if (regions.length === 0) {
        return undefined;
    }
    else {
        let sum = 0;
        for (const region of regions) {
            sum += region.value;
        }
        return sum;
    }
}

function isHQ(region: Region) {
    return region.magnitude === 0 && region.value % 10 !== 0;
}
