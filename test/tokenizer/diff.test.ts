import { assert } from 'chai';
import 'mocha';

import { diff, diffString } from '../../src/tokenizer/diff';

function isDownstreamTerm(term: string) {
    return false;
}

function isTokenTerm(term: string) {
    return false;
}

function isDownstreamTermHash(hash: number) {
    return false;
}

function isTokenTermHash(hash: number) {
    return hash >= 2 * Math.pow(2, 32);
}

describe('Diff', () => {
    describe('#general', () => {
        it('should correctly match the prefix to the query string.', () => {
            const cases: Array<[[string, string], [string, number, number, number, number]]> = [
                [['abcdef', 'ab'], ['ab', 0, 0, 1, 2]],      // Prefix match at position 0
                [['abcdef', 'bcd'], ['bcd', 1, 1, 3, 3]],    // Prefix match at position 1
                [['abcdef', 'cde'], ['cde', 2, 2, 4, 3]],    // Prefix match at position 2
                [['abcdef', 'f'], ['f', 5, 5, 5, 1]],        // Match at end of sequence `a`
                [['abcdef', 'ac'], ['ac', 1, 0, 2, 2]],      // Delete one from middle.
                [['abcdef', 'ad'], ['ad', 2, 0, 3, 2]],      // Delete two from middle.
                [['abcdef', 'adf'], ['adf', 3, 0, 5, 3]],    // Delete in two places.
                [['a', 'af'], ['a', 1, 0, 0, 1]],            // BUG: Sequence `b` longer than `a`.
                [['a', 'def'], ['a', 3, 0, 0, 0]],           // BUG: Sequence `b` longer than `a`.
                [['abc', 'adc'], ['abc', 1, 0, 2, 2]]        // Replace
            ];

            cases.forEach((item, index) => {
                const query = item[0][0];
                const prefix = item[0][1];

                const expectedMatch = item[1][0];
                const expectedCost = item[1][1];
                const expectedLeftmostA = item[1][2];
                const expectedRightmostA = item[1][3];
                const expectedCommon = item[1][4];

                const { match, cost, leftmostA, rightmostA, common } =
                    diffString(query, prefix, isDownstreamTerm, isTokenTerm);

                console.log(`"${query}" x "${prefix}" => "${match}", cost=${cost}, leftmost=${leftmostA}, rightmost=${rightmostA}, common=${common}`);

                assert.equal(match, expectedMatch);
                assert.equal(cost, expectedCost);
                assert.equal(leftmostA, expectedLeftmostA);
                assert.equal(rightmostA, expectedRightmostA);
                assert.equal(common, expectedCommon);
            });
        });
    });

    describe('#predicate', () => {
        it('should work with an equality predicate.', () => {
            const query = [1, 2, 3, 4, 5];
            const prefix = [1, -1, 3];

            // const predicate = (x:number, y:number) => {
            function predicate(x: number, y: number) {
                if (y < 0) {
                    return true;
                }
                else {
                    return x === y;
                }
            }

            const expectedMatch = [1, 2, 3];
            const expectedCost = 0;

            const { match, cost, rightmostA } = diff<number>(query, prefix, isDownstreamTermHash, isTokenTermHash, predicate);

            assert.deepEqual(match, expectedMatch);
            assert.equal(cost, expectedCost);
        });
    });

    describe('#trailing junk', () => {
        it('should not produce a match with trailing junk.', () => {
            const query = [1, 2, 3, 4, 5];
            const prefix = [1, 6];

            const expectedMatch = [1, 2];
            const expectedCost = 1;

            const { match, cost, rightmostA } = diff<number>(query, prefix, isDownstreamTermHash, isTokenTermHash);

            assert.deepEqual(match, expectedMatch);
            assert.equal(cost, expectedCost);
        });
    });

    describe('#tokens', () => {
        it('should not produce delete or replace a token.', () => {
            const query = [2641553256, 9915785936, 2779594451, 1009084850];
            const prefix = [2641553256, 455026286];

            // Match stops after query first term because second query term is
            // a token which doesn't match.
            const expectedMatch = [2641553256];
            const expectedCost = 1;

            const { match, cost, rightmostA } = diff<number>(query, prefix, isDownstreamTermHash, isTokenTermHash);

            // assert.deepEqual(match, expectedMatch);
            assert.equal(cost, expectedCost);
        });

        it('should be able to match tokens.', () => {
            const query = [2641553256, 9915785936, 2779594451, 1009084850];
            const prefix = [2641553256, 9915785936];

            // Match stops after query first term because second query term is
            // a token which doesn't match.
            const expectedMatch = [2641553256, 9915785936];
            const expectedCost = 0;

            const { match, cost, rightmostA } = diff<number>(query, prefix, isDownstreamTermHash, isTokenTermHash);

            // assert.deepEqual(match, expectedMatch);
            assert.equal(cost, expectedCost);
        });

        // This bug involves a long query with a token near the middle.
        // In this case, there are enough terms after the token, that a path of
        // token replacements after the token can be lower cost than a path
        // that perfectly matches the first five terms. The fix for this bug is
        // to disallow any path containing a token deletion or replacement.
        it('bug reported by Andrei 11/15/18', () => {
            const query = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 8589934592, 11, 2, 13, 14, 15, 16 ];
            const prefix = [ 1, 2, 3, 4, 5, 6 ];

            const expectedMatch = [ 1, 2, 3, 4, 5, 6 ];
            const expectedCost = 0;

            const { match, cost, rightmostA } = diff<number>(query, prefix, isDownstreamTermHash, isTokenTermHash);

            assert.deepEqual(match, expectedMatch);
            assert.equal(cost, expectedCost);
        });

        it('regression introduced 12-6-18', () => {
            const isDownstreamTermHash = (hash: number) => hash === 0x200000001;
            const isTokenTermHash = (hash: number) => hash >= 0x200000000;

            const query = [ 1, 0x200000001, 0x200000002 ];
            const prefix= [ 1, 0x200000001, 0x200000003 ];
            const expectedMatch = [ 1 ];
            const expectedCost = 1; // REPLACE 0x200000002 <=> 0x200000003, then SKIP trailing downstream 0x200000001.
            const expectedCommon = 1;

            const { match, cost, common } = diff<number>(query, prefix, isDownstreamTermHash, isTokenTermHash);

            assert.deepEqual(match, expectedMatch);
            assert.equal(cost, expectedCost);
            assert.equal(common, expectedCommon);
        });

    });
});
