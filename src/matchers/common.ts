export type TokenPredicate<T> = (a: T) => boolean;
export type DownstreamTermPredicate<T> = (a: T) => boolean;
export type EqualityPredicate<T> = (a: T, b: T) => boolean;

export function GenericEquality<T>(a: T, b: T): boolean {
    return a === b;
}

export type Matcher = (
    query: number[],
    prefix: number[],
    isDownstreamTerm: DownstreamTermPredicate<number>,
    isTokenHash: TokenPredicate<number>,
    isEqual: EqualityPredicate<number>
) => DiffResults<number>;

export interface DiffResults<T> {
    match: T[];             // The sequence that represents the match that
                            // minimizes Levenshtein edit distance.
    cost: number;           // The Levenshtein edit distance for this match.
    leftmostA: number;      // The position in sequence `a` the leftmost term
                            // that aligns with a term in `b`.
    rightmostA: number;     // The position in sequence `a` of the rightmost term
                            // that aligns with a term in `b`.
    alignments: number;     // The number of alignments where
                            // no edit was performed. NOTE that `alignments`
                            // will be greater than the cardinality of 
                            // `commonTerms` whenever a term appears more than
                            // once in `match`.
    commonTerms: Set<T>;    // The set of terms in the match
                            // corresponding to alignments between
                            // sequences `a` and `b`.
}

