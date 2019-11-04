import { 
    DiffResults,
    DownstreamTermPredicate,
} from '../matchers/common';

import { Hash, Token } from '../tokenizer';

import { createEdge2, Edge2, Graph2 } from './graph2';

// TODO:
//   is leftMostA always equal to zero?
//   backtrace needs to be able to prune off trailing vertices
//   graphLevenshtein unit tests
//   graph tokenizer outer loop
//   better way to do debugging/tracing in computeScore()
//   implement exact matcher on graph2
//   implement number parser on graph2
//   implement maximalPaths on graph2

// Types of edits used in dynamic programming algorithm.
enum Edit {
    NONE,       // First position in sequence. No preceding edits.
    DELETE_A,   // Delete one item from sequence A at this point.
    DELETE_B,   // Delete one item from sequence B at this point.
    REPLACE,    // Replace an item in A with one from B or vice versa.
    MATCH       // Both sequences match at this point.
}

// Cell in the dynamic programming matrix.
class Cell {
    edit: Edit;     // The Edit on the best known path into this vertex.
    cost: number;   // The cost of the best known path through this vertex.

    constructor(cost: number) {
        this.edit = Edit.NONE;
        this.cost = cost;
    }

    // Compares a proposed path with the best known path through this vertex.
    // Updates vertex with new path if it corresponds to a lower edit distance.
    update(edit: Edit, cost: number) {
        if (this.edit === Edit.NONE) {
            // This is the first path considered, so it's the best we've seen
            // so far, so take it.
            this.cost = cost;
            this.edit = edit;
        }
        else if (cost < this.cost) {
            // This path is better than the best seen so far, so take it.
            this.cost = cost;
            this.edit = edit;
        }
    }
}

// TODO: Consider templating Graph2 and Edge2 by token Type.
// This will allow us to run directly against a graph of Hashes.
export function *graphLevenshtein(
    graph: Graph2<Hash>,
    from: number,
    bVector: Hash[],
    token: Token,
    isDownstreamTerm: DownstreamTermPredicate<Hash>
): IterableIterator<Edge2<Token>> {
    const matrix: Cell[][] = [];
    const aVector: Hash[] = [];
    yield* graphLevenshteinRecursion(
        matrix,
        graph,
        from,
        from,
        aVector,
        bVector,
        token,
        isDownstreamTerm
    );
}

function *graphLevenshteinRecursion(
    matrix: Cell[][],
    graph: Graph2<Hash>,
    from: number,           // Starting vertex id
    to: number,             // Ending vertex id,
    aVector: Hash[],        // Hashes along current path
    bVector: Hash[],        // Prefix sequence to match against path in graph
    token: Token,           // Token to use as label for matching edges
    isDownstreamTerm: DownstreamTermPredicate<Hash>
): IterableIterator<Edge2<Token>> {
    let atEndOfPath = true;

    // For each outgoing edge from the current vertex.
    for (const edge of graph.edgesFrom(from)) {
        atEndOfPath = false;
        to = edge.to;

        // Add a new column to the matrix.
        matrix.push(createColumn(matrix, edge.token, bVector));
        aVector.push(edge.token);

        // Recurse
        yield* graphLevenshteinRecursion(
            matrix,
            graph,
            from + 1,
            to,
            aVector,
            bVector,
            token,
            isDownstreamTerm);

        // Remove the column
        aVector.pop();
        matrix.pop();
    }

    if (atEndOfPath) {
        // Recursive base case.
        const diff = backtrace(matrix, aVector, isDownstreamTerm);
        const { score } = computeScore(
            aVector,
            bVector,
            isDownstreamTerm,
            diff
        );

        if (score > 0) {
            yield(createEdge2(from, score, to, token));
        }
    }
}

function createColumn(
    matrix: Cell[][],
    aValue: Hash,
    bVector: Hash[]
): Cell[] {
    const bl = bVector.length;
    const ai = matrix.length;
    const column = new Array<Cell>(bl + 1);
    if (ai === 0) {
        for (let bi = 0; bi <= bl; ++bi) {
            column[bi] = new Cell(bi);
        }
    } else {
        column[0] = new Cell(ai);
        for (let bi = 1; bi <= bl; ++bi) {
            const bValue = bVector[bi - 1];
            column[bi] = createCell(matrix, ai, bi, aValue, bValue);
        }
    }
    return column;
}

function createCell(
    matrix: Cell[][],
    ai: number,
    bi: number,
    aValue: Hash,
    bValue: Hash
): Cell {
    const cell = new Cell(0);

    // Delete from A
    cell.update(Edit.DELETE_A, matrix[ai - 1][bi].cost + 1);

    // Delete from B
    cell.update(Edit.DELETE_B, matrix[ai][bi - 1].cost + 1);

    if (aValue === bValue) {
        // Match
        cell.update(Edit.MATCH, matrix[ai - 1][bi - 1].cost);
    }
    else {
        // Replace
        cell.update(Edit.REPLACE, matrix[ai - 1][bi - 1].cost + 1);
    }

    return cell;
}

function backtrace(
    matrix: Cell[][],
    a: Hash[],
    isDownstreamTerm: DownstreamTermPredicate<Hash>
): DiffResults<Hash> {
    const path = [];

    const bLen = matrix[0].length;

    let ai = matrix.length;
    let bi = bLen;

    let current = matrix[ai][bi];
    let cost = current.cost;

    // Since we're doing a prefix match, we don't include the edits in the
    // suffix of sequence `a` that don't match sequence `b`. The suffix is
    // considered to be a consecutive sequence of deletes from `a` at the
    // end of the match.
    let inSuffix = true;
    let leftmostA = -1;
    let rightmostA = -1;
    let alignments = 0;
    const commonTerms = new Set<Hash>();

    while (current.edit !== Edit.NONE) {
        switch (current.edit) {
            case Edit.DELETE_A:
                if (inSuffix) {
                    cost = matrix[ai - 1][bi].cost;
                }
                ai--;
                leftmostA = ai;
                break;
            case Edit.DELETE_B:
                bi--;
                break;
            case Edit.REPLACE:
                {
                    // DESIGN NOTE: it is important to take the item from
                    // sequence `a` instead of `b`, in order to allow wildcards
                    // from `b` to match items in `a`. In other words, we don't
                    // want the match to contain the wildcard specifier from
                    // `b`. Rather we want to it to contain the item from `a`
                    // that matches the wildcard specifier.
                    const term = a[ai - 1];

                    // Don't match a trailing downstream terms in the suffix.
                    // For example, suppose the query is "rack and trailer hitch"
                    // and the prefix is "rack and pinion". We don't want to
                    // generate a match of "rack and".
                    //
                    // Take the matched term if either of the following is true
                    //   1. we haven't taken any terms yet,
                    //      meaning that we've been in the suffix
                    //      and can continue trimming downstream terms
                    //   2. this term is not a downstream term.
                    //
                    if (path.length > 0 || !isDownstreamTerm(term)) {
                        path.unshift(term);
                        // TODO: Do we want to decrease the cost if we don't take the term?
                        if (rightmostA < 0) {
                            rightmostA = ai - 1;
                        }
                    }

                    // EXPERIMENT: replace above line with code below.
                    // if (!inSuffix) {
                    //     path.push(this.a[ai - 1]);
                    // }
                    ai--;
                    bi--;
                    // EXPERIMENT: comment out // inSuffix = false;
                    inSuffix = false;
                    leftmostA = ai;
                }
                break;
            case Edit.MATCH:
                {
                    const term = a[ai - 1];

                    // Take the matched term if any of the following are true
                    //   1. we haven't taken any terms yet,
                    //      meaning that we've been in the suffix
                    //      and can continue trimming downstream terms
                    //   2. this terms matches the last term in b,
                    //      meaning we will stop trimming downstream terms.
                    //   3. this term is not a downstream term.
                    //
                    if (path.length > 0 || bi === bLen || !isDownstreamTerm(term)) {
                        path.unshift(term);
                        if (rightmostA < 0) {
                            rightmostA = ai - 1;
                        }
                        alignments++;
                        commonTerms.add(term);
                    }

                    ai--;
                    bi--;
                    inSuffix = false;
                    leftmostA = ai;
                }
                break;
            default:
                // Should never get here.
                break;
        }

        current = matrix[ai][bi];
    }

    return {
        match: path,
        cost: Math.min(cost, Infinity),
        leftmostA,
        rightmostA,
        alignments,
        commonTerms
    };
}

function computeScore(
    query: number[],
    prefix: number[],
    isDownstreamTerm: DownstreamTermPredicate<number>,
    diff: DiffResults<number>
): { length: number, score: number } {
    const { match, cost, leftmostA, rightmostA, alignments, commonTerms } = diff;

    // The matchFactor attempts to express the quality of the match through
    // the relationship between the number of terms in the match and the
    // number of edits made. Note that matchFactor is a heuristic since it
    // cannot distinguish between edits that are adds, deletions, and
    // replacements.
    let matchFactor: number;
    const l = rightmostA + 1;
    if (l > cost) {
        matchFactor = (l - cost) / l;
    }
    else {
        matchFactor = 1 / (l + cost);
    }

    // The commonFactor attempts to characterize quality of the match
    // through the fraction of terms in the match that are also in the
    // query.
    // ISSUE: commonFactor will be less than 1.0 when words are repeated.
    const matchTerms = new Set<number>(match);
    const commonFactor = commonTerms.size / matchTerms.size;
    // const commonFactor = commonTerms.size / match.length;

    // The positionFactor attempts to characterize the quality of the match
    // through its starting position in the query. Matches that start at
    // the beginning of the query has positionFactor === 1.0. The value of
    // the factor decreases as the match shifts to the right.
    const positionFactor = Math.max(match.length - leftmostA, 0) / match.length;

    // The lengthFactor is the base score for a match and is equal to the
    // length of the match. The rationale for using match length, instead
    // of the length of the matched region in the query (rightmostA + 1) or
    // the prefix (prefix.length) is as follows:
    //
    // 1. Don't want to boost the score for large values of rightmostA that
    // represent skipping over the middle of the query:
    //    query = 'a b c d e f g h i j k'
    //    prefix = 'a k'
    //    match = 'a k'
    // Similarly, don't want to reward skipping over the middle of the
    // prefix:
    //    query = 'a k'
    //    prefix = 'a b c d e f g h i j k'
    //    match = 'a k'
    const lengthFactor = match.length;

    let score = matchFactor * commonFactor * positionFactor * lengthFactor;

    // These are the terms that the query and match have in common that are
    // not downstream terms.
    const commonDownstreamWords = 
        new Set([...commonTerms].filter(isDownstreamTerm));

    // Exclude matches that are all downstream words, except those that
    // match every word in the prefix. This exception is important because
    // the stemming process cause an attribute word to collide with a
    // different entity word. In this cases, the entity should still be
    // allowed to match, if the match is perfect. Note that using a
    // lemmatizer instead of a stemmer could also help here.
    const downstreamWordFactor = 
        (commonTerms.size - commonDownstreamWords.size) / commonTerms.size;

    // NOTE: BUG BUG: The test, (common !== prefix.length), assumes that
    // the prefix does not have duplicated terms. Example: query = "a b",
    // and prefix = "a b b". Then commonTerms={a,b}, so common === 2,
    // even though prefix.length === 3. ACTUALLY: in diff.ts, common
    // is the number of exact matches, while commonTerms is the set of
    // exact matches (removing duplicates).
    const prefixTerms = new Set<number>(prefix);
    if (commonTerms.size > 0 &&
        commonTerms.size === commonDownstreamWords.size &&
        commonTerms.size !== prefixTerms.size) {
        // commonTerms.size !== prefix.length) {
        score = -1;
    }

    // TODO: Is this exclusion necessary?
    if (score <= 0.01) {
        score = -1;
    }

    // if (this.debugMode) {
    //     const queryText = query.map(this.decodeTerm).join(' ');
    //     const prefixText = prefix.map(this.decodeTerm).join(' ');
    //     const matchText = match.map(this.decodeTerm).join(' ');
    //     this.logger.log(`      score=${score} mf=${matchFactor}, cf=${commonFactor}, pf=${positionFactor}, lf=${lengthFactor}, df=${downstreamWordFactor}`);
    //     this.logger.log(`      length=${match.length}, cost=${cost}, left=${leftmostA}, right=${rightmostA}, common=${commonTerms.size}`);
    //     this.logger.log(`      query="${queryText}"`);
    //     this.logger.log(`      prefix="${prefixText}"`);
    //     this.logger.log(`      match="${matchText}"`);
    //     this.logger.log(`      query="${query}"`);
    //     this.logger.log(`      prefix="${prefix}"`);
    //     this.logger.log(`      match="${match}"\n`);
    // }

    return { score, length: rightmostA + 1 };
}
