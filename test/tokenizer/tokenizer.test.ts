import { assert } from 'chai';
import 'mocha';

import { EnglishNumberParser } from '../../src/number-parser';
import { DefaultTermModel, Token, Tokenizer, TokenizerAlias } from '../../src/tokenizer';
import { levenshtein } from '../../src';

type PID = number;

const PIDTOKEN: unique symbol = Symbol('PIDTOKEN');
type PIDTOKEN = typeof PIDTOKEN;

function* aliasGenerator(items: string[]) {
    for (const item of items) {
        yield {
            token: { type: PIDTOKEN, pid: 1},
            text: item,
            matcher: levenshtein
        };
    }
}

interface PIDToken extends Token {
    type: PIDTOKEN;
    pid: PID;
}

const termModel = new DefaultTermModel();

function tokenizerAlias(pid: PID, text: string): TokenizerAlias
{
    const token = { type: PIDTOKEN, pid };
    const terms = text.split(/\s+/);
    const stemmed = terms.map(termModel.stem);
    const hashes = stemmed.map(termModel.hashTerm);
    const isDownstreamTerm = (hash: number) => false;

    return {
        token,
        text,
        terms,
        stemmed,
        hashes,
        matcher: levenshtein,
        isDownstreamTerm
    };
}

describe('Tokenizer', () => {
    describe('#addItem', () => {
        it('Add TokenizerAliases to `this.aliases`.', () => {
            const numberParser = new EnglishNumberParser(termModel.stemAndHash);
            const tokenizer = new Tokenizer(termModel, numberParser, false);
            const items:Array<[PID, string]> = [
                [1, 'one'],
                [2, 'two'],
                [3, 'three']];

            items.forEach((item, index) => {
                const [pid, text] = item;
                tokenizer.addItem(tokenizerAlias(pid, text));

                assert.equal(tokenizer['aliases'].length, index + 1);
                assert.equal(tokenizer['aliases'][index].text, text);
                const pidToken: PIDToken = tokenizer['aliases'][index].token as PIDToken;
                assert.equal(pidToken.pid, pid);
            });
        });

        it('Construct posting lists.', () => {
            const numberParser = new EnglishNumberParser(termModel.stemAndHash);
            const tokenizer = new Tokenizer(termModel, numberParser, false);

            // DESIGN NOTE: the terms 'a'..'f' are known to stem to themselves.
            const items = ['a b c', 'b c d', 'd e f'];

            for (const [index, item] of items.entries()) {
                tokenizer.addItem(tokenizerAlias(index, item));
            }

            // Verify that item text and stemmed item text are recorded.
            items.forEach((item, index) => {
                assert.equal(tokenizer['aliases'][index].text, items[index]);
                assert.equal(tokenizer['aliases'][index].stemmed.join(' '), items[index]);
            });

            // Verify that posting lists are correct.
            const terms = ['a', 'b', 'c', 'd', 'e', 'f'];
            const expectedPostings = [
                [0],        // a
                [0, 1],     // b
                [0, 1],     // c
                [1, 2],     // d
                [2],        // e
                [2]         // f
            ];

            const observedPostings = terms.map((term) =>
                tokenizer['postings'].get(termModel.hashTerm(term)));
            assert.deepEqual(observedPostings, expectedPostings);

            // Verify that term frequencies are correct.
            const expectedFrequencies = [
                1,  // a
                2,  // b
                2,  // c
                2,  // d
                1,  // e
                1   // f
            ];
            const observedFrequencies = terms.map((term) =>
                tokenizer['hashToFrequency'][termModel.hashTerm(term)]);
            assert.deepEqual(observedFrequencies, expectedFrequencies);
        });
    });
});
