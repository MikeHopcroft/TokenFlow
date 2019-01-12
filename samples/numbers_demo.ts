import { NumberMatch, NumberParser } from '../src';
import { PeekableSequence } from '../src';

import { v3 } from 'murmurhash';

// return v3(term, this.seed)

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

const seed = 0;

function stemAndHash(text: string): number {
    let hash = dict.get(text);
    if (!hash) {
        hash = v3(text, seed);
    }
    return hash;
}

const parser = new NumberParser(stemAndHash);

function test(text: string) {
    const output: NumberMatch[] = [];

    console.log(`"${text}"`);
    const terms = text.split(/\s+/);
    const hashes = terms.map(stemAndHash);
    const input = new PeekableSequence<number>(hashes[Symbol.iterator]());
    const value = parser.parseV(input, output);
    // console.log(`  VALUE: ${value}, length: XXX`);
    for (const match of output) {
        console.log(`  value: ${match.value}, length: ${match.length}`);
    }
}

// test('one');
// test('two');
// test('ten');
// test('eleven');
//// test('twenty');
//// test('twenty one');

// BADTEST: parseTV:2 returns 120 before parseMQ:3 returns 100
// test('one hundred twenty one');
// test('five hundred and twenty one');
//// test('four hundred eighty six thousand twenty one');
// test('four hundred eighty six');
// DONE: TODO: running previous line makes next line fail. Some state is being retained.

// TODO: shouldn't be able to put 2100 (or 2153) after 486,000 since
// both portions overlap in the thousands place.
// BADTEST: this shouldn't parse
// test('four hundred eighty six thousand twenty one hundred fifty three');

// BADTEST: MQ should be able to start with AND, if this is not the first region.
// test(`three billion a million and 5`);

// TODO: test phrases with multiple numbers
// test('five hundred thousand two million three');

test('a hundred');
test('a hundred five');
test('hundred');

test('a thousand');
test('a million and three');