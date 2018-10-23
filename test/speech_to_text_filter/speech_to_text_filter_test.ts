import { assert } from 'chai';
import 'mocha';

import {speechToTextFilter} from '../../samples/speech_to_text_filter';

describe('speechToTextFiler', () => {
    it('should convert & to text.', () => {
        assert.equal(speechToTextFilter('one & two'), 'one and two');
    });

    it('should convert % to text.', () => {
        assert.equal(speechToTextFilter('one % two'), 'one percent two');
    });

    it('should remove punctuation.', () => {
        assert.equal(speechToTextFilter('a,b.c?d!e-f(g)h"i'), 'a b c d e f g h i');
    });

    it('should remove MS Word quotes.', () => {
        assert.equal(speechToTextFilter('a\u2018b\u2019c'), "a'b'c");
    });

    it('should collapse multiple spaces.', () => {
        assert.equal(speechToTextFilter('  a   b  c '), "a b c");
    });

    it('should convert Arabic numerals to text without dashes.', () => {
        assert.equal(speechToTextFilter('a 23 b 4 c'), "a twenty three b four c");
    });

    it('should convert Arabic numerals to text without commas.', () => {
        assert.equal(speechToTextFilter('a 1050 b'), "a one thousand fifty b");
    });

    it('should replace certain abbreviations and colloquialisms.', () => {
        assert.equal(speechToTextFilter('okay 1/2 1/4'), "ok half quarter");
    });
});
