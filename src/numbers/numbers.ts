import { PeekableSequence } from '../utilities';

interface Region {
    value: number;
    magnitude: number;
}

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
    ['thousand', 1000],
    ['million', 1e6],
    ['billion', 1e9],
    ['trillion', 1e12],
];

class NumberParser {
    A: number;
    AND: number;
    M2: number;
    Z: number;

    // [1..9]
    QD: Map<number, Region>;

    // [a, 1..9, 11..19]
    QUX10: Map<number, Region>;

    // [20, 30, 40, 50, 60, 70, 80, 90]
    QT: Map<number, Region>;

    magnitudes: Map<number, Region>;

    constructor() {
        this.A = this.hash('a');
        this.AND = this.hash('and');
        this.M2 = this.hash('hundred');
        this.Z = this.hash('zero');

        this.QD = this.createMap(quantifyingDigits);
        this.QUX10 = this.createMap([...quantifyingDigits, ...elevenToNineteen]);
        this.QT = this.createMap(twentyToNinety);
        this.magnitudes = this.createMap(magnitudes);
    }

    hash(text: string): number {
        // TODO: Implement
    }

    createMap(items: Array<[string, number]>): Map<number, Region> {
        // TODO: Implement
        const m = new Map<number, Region>();
        for (const [text, value] of items) {
            const hash = this.hash(text);
            // TODO: Set magnitude correctly.
            const forceCompileError;
            m.set(hash, {value, magnitude: 0});
        }
        return m;
    }

    parseV(input: PeekableSequence<number>): number | undefined {
        // if (!input.atEOF() && input.peek() === this.Z) {
        //     // Number is zero.
        //     input.get();
        //     return 0;
        // }
        if (input.nextIs(this.Z)) {
            return 0;
        }
        
        let value = 0;

        // Look for a sequence of regions with decreasing magnitude.
        const regions: Region[] = [];
        while (!input.atEOF()) {
            const region = this.parseRegion(input, value);
            if (region &&
                (
                    regions.length === 0 ||
                    regions[regions.length - 1].magnitude > region.magnitude
                )) 
            {
                value += region.value;
                // console.log(`parseV: ${value}`);
                this.report('parseV', value, 0);
                regions.push(region);
            }
            else {
                break;
            }
        }

        // return valueOf(regions);
        return value;
    }

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
            input.skipOptional(this.A);

            // Might be A ('a'), as in 'a million'
            region = { value: 1, magnitude: 0 };

            // Consistant with either A or A M2 [[AND] TV]
            if (input.nextIs(this.M2)) {
                // This is A M2 [[AND] TV]
                region = { value: 100, magnitude: 0 };
                input.skipOptional(this.M2);
                input.skipOptional(this.AND);

                region = add(region, this.parseTV(input, value));
            }
        }
        else {
            // Consistent with either HQ M2 [[AND] TV] or just TV
            region = this.parseTV(input, value);

            if (region && isHQ(region) && input.nextIs(this.M2)) 
            {
                // Consistent with HQ M2 [[AND] TV]
                input.skipOptional(this.M2);
                input.skipOptional(this.AND);
                region.value *= 100;

                region = add(region, this.parseTV(input, value));
            }
            // Otherwise, consistent with TV
        }

        return region;
    }

    // parseMQ2(input: PeekableSequence<number>, value: number): Region | undefined {
    //     if (input.peek() === this.A) {
    //         // Could be A or A M2 [[AND] TV]
    //         input.get();

    //         if (input.nextIs(this.M2)) {
    //             // Consistent with A M2 [[AND] TV]
    //             // as in 'a hundred and five'
    //             input.get();
    //             let region = { value: 100, magnitude: 0 };
    //             this.report('parseMQ:1', value + region.value, 0);
    //             // console.log(`parseMQ:1: ${value + region.value}`);
                
    //             // TODO: What if we skip over AND but don't find a TV?
    //             // Seems we should "unskip"
    //             input.skipOptional(this.AND);

    //             // TODO: Perhaps parseTV should check for EOF.
    //             if (!input.atEOF()) {
    //                 const tv = this.parseTV(input, value);
    //                 if (tv) {
    //                     region = add(region, tv);
    //                     this.report('parseMQ:2', value + region.value, 0);
    //                     // console.log(`parseMQ:2: ${value + region.value}`);
    //                 }
    //             }

    //             // TODO: Need to return region here.
    //         }
    //         else {
    //             // This is A ('a'), as in 'a million'
    //             return { value: 1, magnitude: 0 };
    //         }
    //     }
    //     else {
    //         // Could be HQ M2 [[AND] TV] or just HQ
    //         let region = this.parseHQ(input, value);

    //         if (region && input.skipOptional(this.M2)) {
    //             // Have found HQ M2.
    //             this.report('parseMQ:3', value + region.value, 0);

    //             // Look for optional [[AND] TV]
    //             input.skipOptional(this.AND);
    //             const tv = this.parseTV(input, value);
                
    //             region = add(region, tv);
    //             // if (tv) {
    //             //     region = add(region, tv);
    //             //     // return add(region, tv);
    //             // }
    //         }
    //         return region;
    //     }
    // }

    parseHQ(input: PeekableSequence<number>, value: number): Region | undefined {
        if (!input.atEOF()) {
            const token = input.peek();

            // Test for QUX10 = [a, 1..9, 11..19]
            const qux10 = this.QUX10.get(token);
            if (qux10) {
                return qux10;
            }

            const qt = this.QT.get(token);
            if (qt) {
                const qd = this.QD.get(token);
                if (qd) {
                    // Found sequence QT QD
                    return add(qt, qd);
                }
            }
        }

        return undefined;
    }

    parseTV(input: PeekableSequence<number>, value: number): Region | undefined {
    }

    parseQU() {
    }

    parseQT() {
    }

    parseQD() {
    }

    parseM() {
    }

    report(location: string, value: number, length: number) {
        console.log(`${location}: value: ${value}, length: ${length}`);
    }

    // // TODO: Consider static method, function, or make a mmember of
    // // PeekableSequence.
    // skipOptional(input: PeekableSequence<number>, token: number): boolean {

    // }

    // // TODO: Consider static method, function, or make a mmember of
    // // PeekableSequence.
    // skipRequired(input: PeekableSequence<number>, token: number): boolean {

    // }
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

    // if (!a) {
    //     return b;
    // }

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



        // if (input.peek() === this.A) {
        //     // Consistent with A or A M2
        //     input.get();
        //     if (!input.atEOF() && input.peek() === this.M2) {
        //         // This is A M2
        //         input.get();

        //         // Need to get [[AND] TV]

        //         return { value: 100, magnitude: 0 };
        //     }
        //     else {
        //         // This is A
        //         return { value: 1, magnitude: 0 };
        //     }
        // }
        // else {
        //     // Consistent with TV or HQ M2 [[AND] TV]
        // }


                // if (regions.length === 0) {
        //     return undefined;
        // }
        // else {
        //     let sum = 0;
        //     for (const region of regions) {
        //         sum += region.value;
        //     }
        //     return sum;
        // }

        // while (!input.atEOF()) {
        //     let region = this.parseMQ(input, regions);
        //     if (!region) {
        //         break;
        //     }

        //     if (!input.atEOF()) {
        //         const magnitude = this.magnitudes.get(input.peek());
        //         if (magnitude) {
        //             region = multiply(region, magnitude);
        //         }
        //         else {
        //             // TODO: we failed here to get a magnitude
        //             // Must be at the last region.
        //             // Need to add to region list and then break.
        //         }
        //     }

        //     if (regions.length === 0 ||
        //         regions[regions.length - 1].magnitude > region.magnitude) {
        //         regions.push(region);
        //     }
        //     else {
        //         break;
        //     }
        // }

