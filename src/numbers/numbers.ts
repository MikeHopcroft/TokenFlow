import { PeekableSequence } from '../utilities';

interface Region {
    value: number;
    magnitude: number;
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

class NumberParser {
    const A: number;
    const AND: number;
    const M2: number;
    const Z: number;

    // [a, 1..9, 11..19]
    const QUX10: Map<number, Region>;

    // [20, 30, 40, 50, 60, 70, 80, 90]
    const QT: Map<number, Region>;

    // [1..9]
    const QD: Map<number, Region>;

    const magnitudes: Map<number, Region>;

    parseV(input: PeekableSequence<number>): number | undefined {
        if (!input.atEOF() && input.peek() === this.Z) {
            // Number is zero.
            input.get();
            return 0;
        }
        
        let value = 0;

        // Look for a sequnce of regions with decreasing magnitude.
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
                console.log(`parseV: ${value}`);
                regions.push(region);
            }
            else {
                break;
            }
        }

        return valueOf(regions);

    }

    parseRegion(input: PeekableSequence<number>, value: number): Region | undefined {
        let region = this.parseMQ(input, value);

        if (region && !input.atEOF()) {
            const magnitude = this.magnitudes.get(input.peek());
            if (magnitude) {
                input.get();
                region = multiply(region, magnitude);
            }
        }

        return region;
    }

    parseMQ(input: PeekableSequence<number>, value: number): Region | undefined {
        if (input.peek() === this.A) {
            // Could be A or A M2 [[AND] TV]
            input.get();

            if (!input.atEOF()) {
                const hq = this.parseHQ(input, value);
            }

            if (input.peek() === this.M2) {
                // Consistent with A M2 [[AND] TV]
                input.get();
                let region = { value: 100, magnitude: 0 };
                console.log(`parseMQ:1: ${value + region.value}`);
                
                // TODO: What if we skip over AND but don't find a TV?
                // Seems we should "unskip"
                this.skipOptional(input, this.AND);

                // TODO: Perhaps parseTV should check for EOF.
                if (!input.atEOF()) {
                    const tv = this.parseTV(input, value);
                    if (tv) {
                        region = add(region, tv);
                        console.log(`parseMQ:2: ${value + region.value}`);
                    }
                }

                // TODO: Need to return region here.
            }
            else {
                // This is A ('a')
                return { value: 1, magnitude: 0 };
            }
        }
        else {
            // Could be HQ M2 [[AND] TV]
            const hq = this.parseHQ(input, value);
            if (hq && input.skipRequired(this.M2)) {
                // Have found HQ M2.
                // Look for optional [[AND] TV]
                input.skipOptional(this.AND);
                const tv = this.parseTV(input, value);
                return add(hq, tv);
            }

        }
    }

    parseHQ(input: PeekableSequence<number>, regions: Region[]): Region | undefined {
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

    parseTV(input: PeekableSequence<number>, regions: Region[]): Region | undefined {
    }

    parseQU() {
    }

    parseQT() {
    }

    parseQD() {
    }

    parseM() {

    }

    // TODO: Consider static method, function, or make a mmember of
    // PeekableSequence.
    skipOptional(input: PeekableSequence<number>, token: number): boolean {

    }

    // TODO: Consider static method, function, or make a mmember of
    // PeekableSequence.
    skipRequired(input: PeekableSequence<number>, token: number): boolean {

    }
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

