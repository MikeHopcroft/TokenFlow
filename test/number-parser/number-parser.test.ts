import { assert } from 'chai';
import 'mocha';
import { v3 } from 'murmurhash';

import { NumberMatch, NumberParser, PeekableSequence } from '../../src';

const hashes: Array<[string, number]> = [
    ['zero', 0],
    ['one', 1],
    ['two', 2],
    ['three', 3],
    ['four', 4],
    ['five', 5],
    ['six', 6],
    ['seven', 7],
    ['eight', 8],
    ['nine', 9],
    ['ten', 10],
    ['eleven', 11],
    ['twelve', 12],
    ['thirteen', 13],
    ['fourteen', 14],
    ['fifteen', 15],
    ['sixteen', 16],
    ['seventeen', 17],
    ['eighteen', 18],
    ['nineteen', 19],
    ['twenty', 20],
    ['thirty', 30],
    ['forty', 40],
    ['fifty', 50],
    ['sixty', 60],
    ['seventy', 70],
    ['eighty', 80],
    ['ninety', 90],
    ['hundred', 100],
    ['thousand', 1e3],
    ['million', 1e6],
    ['billion', 1e9],
    ['trillion', 1e12]
];

const dict = new Map<string, number>(hashes);

// Murmurhash seed.
const seed = 0;

// To aid in debugging, this stemming and hashing function maps numeric terms
// to their values. Other terms are hashed with Murmurhash v3.
function stemAndHash(text: string): number {
    let hash = dict.get(text);
    if (!hash) {
        hash = v3(text, seed);
    }
    return hash;
}

// Parses one string and compares the result with the expected list of values.
function test(parser: NumberParser, text: string, expected: NumberMatch[]) {
    const output: NumberMatch[] = [];

    const terms = text.split(/\s+/);
    const hashes = terms.map(stemAndHash);
    const input = new PeekableSequence<number>(hashes[Symbol.iterator]());
    const value = parser.parse(input, output);

    assert.deepEqual(output, expected, `For input "${text}"`);
}


describe('NumberParser', () => {
    // This test run a test cases from a list.
    it('list of cases', () => {
        const cases: Array<[string, NumberMatch[]]> = [
            // zero .. nine
            ['zero', [{ value: 0, length: 1 }]],
            ['one', [{ value: 1, length: 1 }]],
            ['two', [{ value: 2, length: 1 }]],
            ['three', [{ value: 3, length: 1 }]],
            ['four', [{ value: 4, length: 1 }]],
            ['five', [{ value: 5, length: 1 }]],
            ['six', [{ value: 6, length: 1 }]],
            ['seven', [{ value: 7, length: 1 }]],
            ['eight', [{ value: 8, length: 1 }]],
            ['nine', [{ value: 9, length: 1 }]],

            // ten .. nineteen
            ['ten', [{ value: 10, length: 1 }]],
            ['eleven', [{ value: 11, length: 1 }]],
            ['twelve', [{ value: 12, length: 1 }]],
            ['thirteen', [{ value: 13, length: 1 }]],
            ['fourteen', [{ value: 14, length: 1 }]],
            ['fifteen', [{ value: 15, length: 1 }]],
            ['sixteen', [{ value: 16, length: 1 }]],
            ['seventeen', [{ value: 17, length: 1 }]],
            ['eighteen', [{ value: 18, length: 1 }]],
            ['nineteen', [{ value: 19, length: 1 }]],

            // twenty, thirty, ... ninety
            ['twenty', [{ value: 20, length: 1 }]],
            ['thirty', [{ value: 30, length: 1 }]],
            ['forty', [{ value: 40, length: 1 }]],
            ['fifty', [{ value: 50, length: 1 }]],
            ['sixty', [{ value: 60, length: 1 }]],
            ['seventy', [{ value: 70, length: 1 }]],
            ['eighty', [{ value: 80, length: 1 }]],
            ['ninety', [{ value: 90, length: 1 }]],

            // a hundred, a thousand, a million, ...
            ['a hundred', [{ value: 100, length: 2 }]],

            // Broken cases - 'a' becomes '1'
            // ['a thousand', [{ value: 1e3, length: 2 }]],
            // ['a million', [{ value: 1e6, length: 2 }]],
            // ['a billion', [{ value: 1e9, length: 2 }]],
            // ['a trillion', [{ value: 1e12, length: 2 }]],

            // one hundred, two thousand, three million, ...
            ['one hundred', [
                { value: 1, length: 1 },
                { value: 100, length: 2 }
            ]],
            ['two thousand', [
                { value: 2, length: 1 },
                { value: 2e3, length: 2 }
            ]],
            ['three million', [
                { value: 3, length: 1 },
                { value: 3e6, length: 2 }
            ]],
            ['four billion', [
                { value: 4, length: 1 },
                { value: 4e9, length: 2 }
            ]],
            ['five trillion', [
                { value: 5, length: 1 },
                { value: 5e12, length: 2 }
            ]],

            // Multi-part numbers less than 1000.
            ['twenty one', [
                { value: 20, length: 1 },
                { value: 21, length: 2 },
            ]],

            ['one hundred thirty two', [
                { value: 1, length: 1 },
                { value: 100, length: 2 },
                { value: 130, length: 3 },
                { value: 132, length: 4 },
            ]],

            ['a hundred thirty two', [
                { value: 100, length: 2 },
                { value: 130, length: 3 },
                { value: 132, length: 4 },
            ]],

            ['one hundred and thirty two', [
                { value: 1, length: 1 },
                { value: 100, length: 2 },
                { value: 130, length: 3 },
                { value: 132, length: 4 },
            ]],

            // Multi-region numbers
            ['twenty thousand', [
                { value: 20, length: 1 },
                { value: 20e3, length: 2 },
            ]],

            ['thirty seven hundred fifty nine', [
                { value: 30, length: 1 },
                { value: 37, length: 2 },
                { value: 3700, length: 3 },
                { value: 3750, length: 4 },
                { value: 3759, length: 5 },
            ]],

            ['one hundred million', [
                { value: 1, length: 1 },
                { value: 100, length: 2 },
                { value: 100e6, length: 3 },
            ]],

            ['eight hundred sixty four million two hundred eighty eight thousand seven hundred ninety one', [
                { value: 8, length: 1 },
                { value: 800, length: 2 },
                { value: 860, length: 3 },
                { value: 864, length: 4 },
                { value: 864000000, length: 5 },
                { value: 864000002, length: 6 },
                { value: 864000200, length: 7 },
                { value: 864000280, length: 8 },
                { value: 864000288, length: 9 },
                { value: 864288000, length: 10 },
                { value: 864288007, length: 11 },
                { value: 864288700, length: 12 },
                { value: 864288790, length: 13 },
                { value: 864288791, length: 14 },
            ]],

            // Seqences with terms beyond number
            ['five thousand six million three', [
                { value: 5, length: 1 },
                { value: 5000, length: 2 },
                { value: 5006, length: 3 },
            ]],

            ['ten three', [
                { value: 10, length: 1 },
            ]],

            ['twenty zero', [
                { value: 20, length: 1 },
            ]],

            ['twenty hundred', [
                { value: 20, length: 1 },
            ]],

            ['five thousand six horses in the herd', [
                { value: 5, length: 1 },
                { value: 5000, length: 2 },
                { value: 5006, length: 3 },
            ]],

            ['two thousand thousand', [
                { value: 2, length: 1 },
                { value: 2000, length: 2 },
            ]],

            // Sequence with no numbers
            ['sequence with no numbers', []],
            ['', []],

            // Broken case - starts with 'a'
            // ['a sequence with no numbers', []],

            // Possible cases
            // ['a', [{ value: 1, length: 1 }]],
            // ['an', [{ value: 1, length: 1 }]],
            // 'an million'
         ];

        const parser = new NumberParser(stemAndHash);

        for (const [text, results] of cases) {
            test(parser, text, results);
        }
    });
});


/*

Undecided cases:
    "hundred" - no quantifier before - is this a number or not?
    "a million and 3" - "and" not used with hundreds. 1000000 or 1000003?
    "fifteen hundred two hundred eighty six"
    "four hundred eighty six thousand twenty one hundred fifty three"

*/
