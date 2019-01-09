import { PeekableSequence } from '../utilities';

interface Region {
    value: number;
    magnitude: number;
}

export type StemAndHash = (term: string) => number;

const quantifyingDigits: Array<[string,number]> = [
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

const elevenToNineteen: Array<[string,number]> = [
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

const twentyToNinety: Array<[string,number]> = [
    ['twenty', 20],
    ['thirty', 30],
    ['forty', 40],
    ['fifty', 50],
    ['sixty', 60],
    ['seventy', 70],
    ['eighty', 80],
    ['ninety', 90],
];

const magnitudes: Array<[string,number]> = [
    ['thousand', 3],
    ['million', 6],
    ['billion', 9],
    ['trillion', 12],
];

class NumberParser {
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
            m.set(hash, {value, magnitude: 0});
        }
        return m;
    }

    createMagnitudeMap(items: Array<[string, number]>): Map<number, Region> {
        const m = new Map<number, Region>();
        for (const [text, magnitude] of items) {
            const hash = this.stemAndHash(text);
            const value = Math.pow(10, magnitude);
            m.set(hash, {value, magnitude});
        }
        return m;
    }

    parseV(input: PeekableSequence<number>): number | undefined {
        let value = 0;

        if (input.nextIs(this.Z)) {
            input.get();
            this.report('parseV', value, 1);
            return value;
        }

        // Look for a sequence of regions with decreasing magnitude.
        let magnitude = Infinity;
        while (!input.atEOF()) {
            const region = this.parseRegion(input, value);
            if (!region || region.magnitude >= magnitude) {
                // We either couldn't parse the next region,
                // or its magnitude is not less than the current
                // magnitude. Stop parsing here.
                break;
            }
            value += region.value;
            magnitude = region.magnitude;
            this.report('parseV', value, 0);
        }

        // TODO: need to handle the case where nothing is parsed
        // and we return undefined. Chances are this code will be
        // modified to return an edge with a value and a length.
        return value;
    }

    // TODO: what is this three-digit portion of a number, the
    // portion before each comma, called?
    parseRegion(input: PeekableSequence<number>, value: number): Region | undefined {
        let region = this.parseMQ(input, value);

        if (region && !input.atEOF()) {
            const magnitude = this.magnitudes.get(input.peek());
            if (magnitude) {
                input.get();
                region = multiply(region, magnitude);
                this.report('parseRegion', value + region.value, 0);
            }
        }

        return region;
    }

    parseMQ(input: PeekableSequence<number>, value: number): Region | undefined {
        let region: Region | undefined;

        if (input.nextIs(this.A)) {
            input.skip(this.A);

            // Might be A ('a'), as in 'a million'
            region = { value: 1, magnitude: 0 };

            // Consistant with either A or A M2 [[AND] TV]
            if (input.nextIs(this.M2)) {
                // This is A M2 [[AND] TV]
                region.value *= 100;
                input.skip(this.M2);

                region = add(region, this.parseANDTV(input, value));
            }
        }
        else {
            // Consistent with either HQ M2 [[AND] TV] or just TV.
            region = this.parseTV(input, value);

            if (region && isHQ(region) && input.nextIs(this.M2)) 
            {
                // Consistent with HQ M2 [[AND] TV].
                input.skip(this.M2);
                region.value *= 100;

                region = add(region, this.parseANDTV(input, value));
            }
            else {
                // Otherwise, region is consistent with TV.
            }
        }

        return region;
    }

    parseANDTV(input: PeekableSequence<number>, value: number): Region | undefined {
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

    parseHQ(input: PeekableSequence<number>, value: number): Region | undefined {
        // First try QUX10 = [a, 1..9, 11..19].
        let region = this.parseQUX10(input, value);

        if (!region) {
            // Then try QT QD.
            const qt = this.parseQT(input, value);
            const qd = this.parseQD(input, value);

            // Need both QT and QD. Disallow "twenty hundred".
            if (qt && qd) {
                region = add(qt, qd);
            }
        }

        return region;
    }

    parseTV(input: PeekableSequence<number>, value: number): Region | undefined {
        // First try QU = [1..19]
        let region = this.parseQU(input, value);
        if (!region) {
            // Then try QT [QD]
            region = this.parseQT(input, value);
            if (region) {
                region = add(region, this.parseQD(input, value));
            }
        }

        return region;
    }

    parseQU(input: PeekableSequence<number>, value: number): Region | undefined {
        return this.parseToken(input, this.QU);
    }

    parseQUX10(input: PeekableSequence<number>, value: number): Region | undefined {
        return this.parseToken(input, this.QUX10);
    }

    parseQT(input: PeekableSequence<number>, value: number): Region | undefined {
        return this.parseToken(input, this.QT);
    }

    parseQD(input: PeekableSequence<number>, value: number): Region | undefined {
        return this.parseToken(input, this.QD);
    }

    parseToken(input: PeekableSequence<number>, m: Map<number, Region>): Region | undefined {
        let region: Region | undefined;

        if (!input.atEOF()) {
            const token = input.peek();

            region = m.get(token);
            if (region) {
                input.get();
            }
        }

        return region;
    }

    parseM() {
    }

    report(location: string, value: number, length: number) {
        console.log(`${location}: value: ${value}, length: ${length}`);
    }
}


function multiply(a: Region, b: Region): Region {
    if (a.magnitude !== 0) {
        throw TypeError('Region `a` must have magnitude zero.');
    }

    return { value: a.value * b.value, magnitude: b.magnitude };
}

function add(a: Region, b: Region | undefined): Region {
    if (!b) {
        return a;
    }

    if (a.magnitude !== 0 || b.magnitude !== 0) {
        throw TypeError('Regions `a` and `b` must have magnitude zero.');
    }

    return { value: a.value + b.value, magnitude: a.magnitude };
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
