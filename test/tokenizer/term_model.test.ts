import { assert } from 'chai';
import 'mocha';

import { DefaultTermModel, Lexicon, Tokenizer } from '../../src/tokenizer';
import { levenshtein } from '../../src';

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

describe('TermModel', () => {
    it('Apply MurmurHash3 with seed value of 0.', () => {
        const termModel = new DefaultTermModel();
        const tokenizer = new Tokenizer(termModel, false);
        const input = 'small unsweeten ice tea';
        
        const lexicon = new Lexicon();
        lexicon.addDomain(aliasGenerator([input]));
        lexicon.ingest(tokenizer);

        const observed = tokenizer['aliases'][0].hashes;
        const expected:number[] = [2557986934, 1506511588, 4077993285, 1955911164];
        assert.deepEqual(observed, expected);
    });

    it('Apply the Snowball English Stemmer', () => {
        const termModel = new DefaultTermModel();
        const input = 'red convertible sedan rims tires knobby spinners slicks turbo charger';
        const terms = input.split(/\s+/);
        const stemmed = terms.map((term) => termModel.stem(term));
        const observed = stemmed.join(' ');
        const expected = 'red convert sedan rim tire knobbi spinner slick turbo charger';
        assert.equal(observed, expected);
    });
});

