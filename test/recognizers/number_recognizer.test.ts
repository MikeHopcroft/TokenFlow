import { assert } from 'chai';
import 'mocha';

import { CompositeToken, PID, Token, WORD } from '../../src/tokenizer';
import { NumberRecognizer } from '../../src/recognizers';

export const QUANTITY: unique symbol = Symbol('QUANTITY');
export type QUANTITY = typeof QUANTITY;

export interface QuantityToken extends CompositeToken {
    type: QUANTITY;
    children: Token[];
    value: number;
}

function tokenFactory(pid: PID, children: Token[]) {
    return { type: QUANTITY, value: pid, children };
}

function go(text: string): Token[] {
    const recognizer = new NumberRecognizer(tokenFactory);
    const terms = text.split(/\s+/).map( text => ({ type: WORD, text }));
    return recognizer.apply(terms);
}

describe('NumberRecognizer', () => {
    it('one number, single-digit', () => {
        const observed = go('one');
        const expected = [
            {
                type: QUANTITY,
                value: 1,
                children: [ { type: WORD, text: 'one' }]
            }
        ];

        assert.deepEqual(observed, expected);
    });

    it('one number, multi-digit', () => {
        const observed = go('twenty four');
        const expected = [
            {
                type: QUANTITY,
                value: 24,
                children: [
                    { type: WORD, text: 'twenty' },
                    { type: WORD, text: 'four' }
                ]
            }
        ];

        assert.deepEqual(observed, expected);
    });

    it('two numbers', () => {
        const observed = go('two four');
        const expected = [
            {
                type: QUANTITY,
                value: 2,
                children: [
                    // NOTE: ideally we'd see 'two' here but a limitation in
                    // the algorithm loses the correspondence with the original
                    // text.
                    { type: WORD, text: '2' }
                ]
            },
            {
                type: QUANTITY,
                value: 4,
                children: [
                    // NOTE: ideally we'd see 'four' here but a limitation in
                    // the algorithm loses the correspondence with the original
                    // text.
                    { type: WORD, text: '4' }
                ]
            }
        ];

        assert.deepEqual(observed, expected);
    });

    it('number followed by text', () => {
        const observed = go('one red convertable');
        const expected = [
            {
                type: QUANTITY,
                value: 1,
                children: [ { type: WORD, text: 'one' }]
            },
            {
                type: WORD,
                text: 'red'
            },
            {
                type: WORD,
                text: 'convertable'
            }
        ];

        assert.deepEqual(observed, expected);
    });

    it('number surrounded by text', () => {
        const observed = go('red four door convertable');
        const expected = [
            {
                type: WORD,
                text: 'red'
            },
            {
                type: QUANTITY,
                value: 4,
                children: [ { type: WORD, text: 'four' }]
            },
            {
                type: WORD,
                text: 'door'
            },
            {
                type: WORD,
                text: 'convertable'
            }
        ];

        assert.deepEqual(observed, expected);
    });

    it('text only no numbers', () => {
        const observed = go('red convertable');
        const expected = [
            {
                type: WORD,
                text: 'red'
            },
            {
                type: WORD,
                text: 'convertable'
            }
        ];

        assert.deepEqual(observed, expected);
    });
});

