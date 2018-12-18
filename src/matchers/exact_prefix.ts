/******************************************************************************
 * 
 * Exact prefix matcher.
 * 
 * Given sequences `a` and `b`, detect and score matches where either
 *   `b` is a prefix of `a`
 * or
 *   a prefix of `b` is a prefix of `a`.
 *
 * The score, or cost of a match is equal to the length of the suffix of `b`
 * that is not included in the match.
 * 
 * EXAMPLES: allowPartialMatch === false
 * In this case `b` must be a prefix of `a`
 *   a = 'abcdef', b = 'abc', match = 'abc', cost = 0
 *   a = 'abcdef', b = 'abcp', match = '', cost = 4
 *   a = 'abcdef', b = 'pqr', match = '', cost = 3
 * 
 * EXAMPLES: allowPartialMatch === true
 * In this case a prefix of `b` must be a prefix of `a`
 *   a = 'abcdef', b = 'abc', match = 'abc', cost = 0
 *   a = 'abcdef', b = 'abcp', match = 'abc', cost = 1
 *   a = 'abcdef', b = 'apqr', match = 'a', cost = 3
 *   a = 'abcdef', b = 'pqr', match = '', cost = 3
 * 
 * When partial matches are allowed, and a partial match is found, trailing
 * downstream terms will be trimmed away.
 * 
 * EXAMPLE: allowPartialMatch === true, and 'x'. 'y', and 'z' are downstream
 * terms that cannot appear in the suffix of partial matches.
 *   a = 'axydef', b = 'axy', match = 'axy', cost = 0
 *   a = 'axydef', b = 'axyd', match = 'a', cost = 3
 *   a = 'xyzdef', b = 'xyz', match = 'xyz', cost = 0
 *   a = 'xyzdef', b = 'xyzz', match = '', cost = 4
 * 
 ******************************************************************************/

import {
    DiffResults,
    DownstreamTermPredicate,
    EqualityPredicate,
    GenericEquality,
    TokenPredicate
} from './common';

// Generic sequence diff.
export function exactPrefix<T>(
    query: T[],
    prefix: T[],
    allowPartialMatch: boolean,
    isDownstreamTerm: DownstreamTermPredicate<T>,
    isToken: TokenPredicate<T>,
    equal: EqualityPredicate<T> = GenericEquality
): DiffResults<T> {
    let index = 0;
    while (index < prefix.length) {
        if (index >= query.length || !equal(prefix[index], query[index])) {
            break;
        }
        ++index;
    }

    let match: T[] = [];
    if (index === prefix.length || allowPartialMatch) {
        match = prefix.slice(0, index);
    }

    // When partial matches are allows, trim off trailing
    // downstream terms from matches that are not exact.
    if (allowPartialMatch && match.length < prefix.length) {
        let i = match.length - 1;
        while (i >= 0) {
            if (!isDownstreamTerm(match[i])) {
                break;
            }
            --i;
        }
        match = match.slice(0, i + 1);
    }

    const commonTerms = new Set<T>();
    for (const value of match) {
        commonTerms.add(value);
    }

    // TODO: investigate special handling for isToken.
    // It seems that tokens cannot be edited out of the query.
    // On the other hand, there seems to be no requirement they
    // are retained in the prefix.

    return {
        match,
        cost: prefix.length - match.length,
        leftmostA: match.length === 0 ? -1 : 0,
        rightmostA: match.length - 1,
        alignments: match.length,
        commonTerms
    };
}

// String diff.
export function exactPrefixString(
    query: string,
    prefix: string,
    allowPartialMatch: boolean,
    isDownstreamTerm: DownstreamTermPredicate<string>,
    isToken: TokenPredicate<string>
) {
    const a = [...query];
    const b = [...prefix];
    const { match, ...rest } = exactPrefix(a, b, allowPartialMatch, isDownstreamTerm, isToken);
    return { match: match.join(''), ...rest };
}
