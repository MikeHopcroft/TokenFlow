import { assert } from 'chai';
import 'mocha';

import { DownstreamTermPredicate, exactPrefix, exactPrefixString } from '../../src/matchers';

function returnFalse(term: string) {
    return false;
}

function CheckEachCase(
    cases: Array<[[string, string], [string, number, number, number, number]]>,
    isDownstreamTerm: DownstreamTermPredicate<string>,
    allowPartialMatches: boolean
) {
    cases.forEach((item, index) => {
        const query = item[0][0];
        const prefix = item[0][1];

        const expectedMatch = item[1][0];
        const expectedCost = item[1][1];
        const expectedLeftmostA = item[1][2];
        const expectedRightmostA = item[1][3];
        const expectedCommon = item[1][4];

        const { match, cost, leftmostA, rightmostA, alignments } =
            exactPrefixString(query, prefix, allowPartialMatches, isDownstreamTerm, returnFalse);

        // console.log(`"${query}" x "${prefix}" => "${match}", cost=${cost}, leftmost=${leftmostA}, rightmost=${rightmostA}, common=${common}`);

        assert.equal(match, expectedMatch);
        assert.equal(cost, expectedCost);
        assert.equal(leftmostA, expectedLeftmostA);
        assert.equal(rightmostA, expectedRightmostA);
        assert.equal(alignments, expectedCommon);
    });
}

describe('ExactPrefix', () => {
    it('Complete matches', () => {
        const cases: Array<[[string, string], [string, number, number, number, number]]> = [
            // Match cases
            [['abcdef', 'a'     ], ['a',      0, 0, 0, 1]],
            [['abcdef', 'ab'    ], ['ab',     0, 0, 1, 2]],
            [['abcdef', 'abc'   ], ['abc',    0, 0, 2, 3]],
            [['abcdef', 'abcd'  ], ['abcd',   0, 0, 3, 4]],
            [['abcdef', 'abcde' ], ['abcde',  0, 0, 4, 5]],
            [['abcdef', 'abcdef'], ['abcdef', 0, 0, 5, 6]],

            // No match cases
            [['abcdef', 'bcd'], ['', 3, -1, -1, 0]],        // No match at position 0
            [['abcdef', 'abcdefg'], ['', 7, -1, -1, 0]],    // Prefix longer than query
        ];

        CheckEachCase(cases, returnFalse, false);
    });


    it('Partial matches', () => {
        const cases: Array<[[string, string], [string, number, number, number, number]]> = [
            // Full match cases
            [['abcdef', 'a'     ], ['a',      0, 0, 0, 1]],
            [['abcdef', 'ab'    ], ['ab',     0, 0, 1, 2]],
            [['abcdef', 'abc'   ], ['abc',    0, 0, 2, 3]],
            [['abcdef', 'abcd'  ], ['abcd',   0, 0, 3, 4]],
            [['abcdef', 'abcde' ], ['abcde',  0, 0, 4, 5]],
            [['abcdef', 'abcdef'], ['abcdef', 0, 0, 5, 6]],
            
            // Partial match cases.
            [['abcdef', 'abx'], ['ab', 1, 0, 1, 2]],            // Match at position 0
            [['abcdef', 'abcdefg'], ['abcdef', 1, 0, 5, 6]],    // Prefix longer than query

            // No match cases
            [['abcdef', 'bcd'], ['', 3, -1, -1, 0]],
        ];
        
        CheckEachCase(cases, returnFalse, true);
    });


    it('Remove trailing downstream terms from partial matches', () => {
        const cases: Array<[[string, string], [string, number, number, number, number]]> = [
            // Full match cases - there are no downstream terms to trim.
            [['abcdef', 'a'     ], ['a',      0, 0, 0, 1]],
            [['abcdef', 'ab'    ], ['ab',     0, 0, 1, 2]],
            [['abcdef', 'abc'   ], ['abc',    0, 0, 2, 3]],
            [['abcdef', 'abcd'  ], ['abcd',   0, 0, 3, 4]],
            [['abcdef', 'abcde' ], ['abcde',  0, 0, 4, 5]],
            [['abcdef', 'abcdef'], ['abcdef', 0, 0, 5, 6]],

            // Full match of downstream terms - keep trailing downstreams.
            [['xycdef', 'xy'    ], ['xy',     0, 0, 1, 2]],
            [['abxyef', 'abxy'  ], ['abxy',   0, 0, 3, 4]],
            
            // Partial match cases - trim trailing downstreams.
            [['abxdef', 'abxp'], ['ab', 2, 0, 1, 2]],   // Trim trailing x.
            [['xycdef', 'xyp' ], ['',   3, -1, -1, 0]], // Trim everything.

            // No match cases- trimming code should not crash.
            [['abcdef', 'xyz'], ['', 3, -1, -1, 0]],
        ];
        
        const downstreamTerms = [ 'x', 'y', 'z' ];
        function isDownstreamTerm(term: string) {
            return downstreamTerms.indexOf(term) >= 0;
        }
        
        CheckEachCase(cases, isDownstreamTerm, true);
    });
});
