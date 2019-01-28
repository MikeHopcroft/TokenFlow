import { assert } from 'chai';
import 'mocha';

import { DefaultTermModel, Lexicon, Token, Tokenizer, TokenizerAlias } from '../../src/tokenizer';
import { levenshtein } from '../../src';

function* aliasGenerator(items: string[]) {
    for (const item of items) {
        yield {
            token: { type: PIDTOKEN, pid: 1},
            text: item,
            matcher: levenshtein
        };
    }
}

const termModel = new DefaultTermModel();

type PID = number;
const PIDTOKEN: unique symbol = Symbol('PIDTOKEN');
type PIDTOKEN = typeof PIDTOKEN;

interface PIDToken extends Token {
    type: PIDTOKEN;
    pid: PID;
}

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
        it('Add TokenizerAlias to `this.aliases`.', () => {
            const tokenizer = new Tokenizer(termModel, false);
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

        it('Apply MurmurHash3 with seed value of 0.', () => {
            const tokenizer = new Tokenizer(termModel, false);
            const input = 'small unsweeten ice tea';
            
            const lexicon = new Lexicon();
            lexicon.addDomain(aliasGenerator([input]));
            lexicon.ingest(tokenizer);

            const observed = tokenizer['aliases'][0].hashes;
            const expected:number[] = [2557986934, 1506511588, 4077993285, 1955911164];
            assert.deepEqual(observed, expected);
        });

        it('Construct posting lists.', () => {
            const tokenizer = new Tokenizer(termModel, false);

            // DESIGN NOTE: the terms 'a'..'f' are known to stem to themselves.
            const items = ['a b c', 'b c d', 'd e f'];

            const lexicon = new Lexicon();
            lexicon.addDomain(aliasGenerator(items));
            lexicon.ingest(tokenizer);

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
                tokenizer['postings'][lexicon.termModel.hashTerm(term)]);
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
                tokenizer['hashToFrequency'][lexicon.termModel.hashTerm(term)]);
            assert.deepEqual(observedFrequencies, expectedFrequencies);
        });

        // it should add tokens to downstream terms
    });

    describe('#stemTerm', () => {
        it('should apply the Snowball English Stemmer', () => {
            const tokenizer = new Tokenizer(termModel, false);
            const input = 'red convertible sedan rims tires knobby spinners slicks turbo charger';
            const terms = input.split(/\s+/);
            const stemmed = terms.map((term) => termModel.stem(term));
            const observed = stemmed.join(' ');
            const expected = 'red convert sedan rim tire knobbi spinner slick turbo charger';
            assert.equal(observed, expected);
        });
    });
});
