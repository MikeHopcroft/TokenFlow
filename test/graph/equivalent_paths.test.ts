import { assert } from 'chai';
import 'mocha';

import { Edge, equivalentPaths } from '../../src/graph';

describe('Graph utilities', () => {
    it('bestPathsRecursion()', () => {
        // Edges on the best paths.
        const e0: Edge = {
            label: 0,
            length: 1,
            score: 1,
            isNumber: false
        };
        const e1a: Edge = {
            label: 1,
            length: 1,
            score: 1,
            isNumber: false
        };
        const e1b: Edge = {
            label: 2,
            length: 1,
            score: 1,
            isNumber: false
        };
        const e2: Edge = {
            label: 3,
            length: 1,
            score: 1,
            isNumber: false
        };
        const e3a: Edge = {
            label: 4,
            length: 1,
            score: 1,
            isNumber: false
        };
        const e3b: Edge = {
            label: 5,
            length: 1,
            score: 1,
            isNumber: false
        };
        const e4: Edge = {
            label: 6,
            length: 1,
            score: 1,
            isNumber: false
        };

        // Noise edges not on the best paths.
        const na: Edge = {
            label: 7,
            length: 2,  // Different length than best path edges.
            score: 1,
            isNumber: false
        };
        const nb: Edge = {
            label: 8,
            length: 2,
            score: 1,   // Different score than best path edges.
            isNumber: false
        };

        const path: Edge[] = [e0, e1a, e2, e3b, e4];
        const edges: Edge[][] = [
            [na, e0],
            [na, e1a, nb, e1b, na],
            [na, e2, nb],
            [nb, e3a, na, e3b],
            [e4, nb]
        ];

        const paths: number[][] = [];
        for (const p of equivalentPaths(edges, path)) {
            paths.push(p.map( x => x.label ));
        }

        const expected = [
            [0, 1, 3, 4, 6],
            [0, 1, 3, 5, 6],
            [0, 2, 3, 4, 6],
            [0, 2, 3, 5, 6],
        ];

        assert.deepEqual(paths, expected);
    });
});
