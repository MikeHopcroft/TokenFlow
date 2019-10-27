import { assert } from 'chai';
import 'mocha';

import { Token } from '../../src/tokenizer';
import { Edge, maximalPaths } from '../../src/graph';

const TEST_TOKEN: unique symbol = Symbol('TEST_TOKEN');
type TEST_TOKEN = typeof TEST_TOKEN;

interface TestToken extends Token {
    type: TEST_TOKEN;
    value: number;
}

function testToken(value: number): TestToken {
    return {
        type: TEST_TOKEN,
        value
    };
}

describe('Graph utilities', () => {
    it('maximalPaths()', () => {
        // Edges on the best paths.
        const e0: Edge = {
            token: testToken(0),
            length: 1,
            score: 1,
        };
        const e1a: Edge = {
            token: testToken(1),
            length: 1,
            score: 1,
        };
        const e1b: Edge = {
            token: testToken(2),
            length: 1,
            score: 1,
        };
        const e2: Edge = {
            token: testToken(3),
            length: 1,
            score: 1,
        };
        const e3a: Edge = {
            token: testToken(4),
            length: 1,
            score: 1,
        };
        const e3b: Edge = {
            token: testToken(5),
            length: 1,
            score: 1,
        };
        const e4: Edge = {
            token: testToken(6),
            length: 1,
            score: 1,
        };

        // Noise edges not on the best paths.
        const na: Edge = {
            token: testToken(7),
            length: 2,  // Different length than best path edges.
            score: 1,
        };
        const nb: Edge = {
            token: testToken(8),
            length: 1,
            score: 0.5,   // Different score than best path edges.
        };

        const edges: Edge[][] = [
            [na, e0],
            [na, e1a, nb, e1b, na],
            [na, e2, nb],
            [nb, e3a, na, e3b],
            [e4, nb]
        ];

        const paths: number[][] = [];
        for (const p of maximalPaths(edges)) {
            paths.push(p.map( x => (x.token as TestToken).value ));
        }

        // TODO: This test is tightly coupled to the algorithm and the order
        // the paths are generated. Should decoupe by sorting the paths.
        const expected = [
            [0, 1, 3, 4, 6],
            [0, 2, 3, 4, 6],
            [0, 1, 3, 5, 6],
            [0, 2, 3, 5, 6],
        ];

        assert.deepEqual(paths, expected);
    });
});
