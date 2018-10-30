import { PID, Recognizer2, Token2, TokenFactory2, WORD, WordToken } from '../../src/tokenizer';
import { PeekableSequence } from '../../src/utilities';

import { INTENT, IntentToken } from './intent_recognizer';
import { QUANTITY, QuantityToken } from './quantity_recognizer';

///////////////////////////////////////////////////////////////////////////////
//
// FixupRecognizer is an example of a recognizer that combines certain
// sequences of tokens into a new token. This recognizer looks for a
// QUANTITY token, followed by the WORD token "of" followed by the WORD
// token "them". When it finds this pattern, it replaces the three tokens
// with a single INTENT token with pid 100010.
//
// NOTE that the goal of this sample is to demonstrate token manipulation.
// Real code would need to deal with stemming and reduce coupling with
// IntentRecognizer.
//
///////////////////////////////////////////////////////////////////////////////

export class FixupRecognizer implements Recognizer2 {
    factory = (id: PID, children: Token2[]): IntentToken => {
        if (id !== 100010) {
            throw TypeError('FixupRecognizer: internal error.');
        }
        return { type: INTENT, id: 100010, name: 'PREPOSITIONS', children };
    };

    apply = (tokens: Token2[]) => {
        return [...convertQuantityOfThem(tokens, this.factory)];
    }

    terms = (): Set<string> => {
        return new Set<string>(['of', 'them']);
    }

    stemmer = (word: string): string => {
        // DESIGN NOTE: This example doesn't stem, but probably should.
        return word;
    }
}

function* convertQuantityOfThem(tokens: Token2[], factory: TokenFactory2) {
    const sequence = new PeekableSequence<Token2>(tokens[Symbol.iterator]());
    while (!sequence.atEOF()) {
        const token1 = sequence.get() as QuantityToken;
        if (sequence.atEOF() || token1.type !== QUANTITY) {
            yield token1;
        }
        else {
            const token2 = sequence.get() as WordToken;
            if (sequence.atEOF() || token2.type !== WORD || token2.text !== 'of')
            {
                yield token1;
                yield token2;
            }
            else {
                const token3 = sequence.get() as WordToken;
                if (token3.type !== WORD || token3.text !== 'them')
                {
                    yield token1;
                    yield token2;
                    yield token3;
                }
                else {
                    // We've found a QUANTITY token followed by WORD tokens
                    // "of" and "them". Replace these three tokens with a
                    // single PREPOSITION intent token.

                    // Yield the PREPOSITION intent token.
                    yield factory(100010, [token1, token2, token3]);
                }
            }
        }
    }
}
