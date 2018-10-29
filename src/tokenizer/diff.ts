/******************************************************************************
 * 
 * Levenshtein prefix distance.
 * 
 * Given sequences a and b, compute the minimum Levenshtein distance match
 * between b and a prefix of a.
 * 
 * This algorithm is intended to be used to evaluate potential partial matches
 * between catalog items and a longer phrases. Consider the following examples:
 * 
 *   a: "The Pontiac Trans Am parked in the driveway"
 *   b: "The Pontiac" matches at positon 0 with edit distance 0.
 *   b: "Pontiac" matches at postion 1 with edit distance 1.
 *   b: "Pontiac Trans Am" matches at position 1 with edit distance 1.
 *   b: "Pontiac parked in the driveway" matches at position 1 with d=3.
 * 
 * The algorithm can be applied to sequences represented as character string
 * and arrays. In the case of array-based sequences, one can pass an equality
 * predicate. The equality predicate is useful when performing pattern
 * matching against sequences of tokens. As an example:
 * 
 *   a: [PURCHASE] [QUANTITY(5)] [ITEM(27)] [CONJUNCTION] [ITEM(43)]
 *   b: [PURCHASE] [QUANTITY(*)] [ITEM(*)]
 * 
 * matches at position 0 with d=1, when using an equality predicate where
 * [QUANTITY(*)] is equal to any QUANTITY and ITEM(*) is equal to any ITEM.
 * 
 ******************************************************************************/

// Types of edits used in dynamic programming algorithm.
enum Edit {
    NONE,       // First position in sequence. No preceding edits.
    DELETE_A,   // Delete one item from sequence A at this point.
    DELETE_B,   // Delete one item from sequence B at this point.
    REPLACE,    // Replace an item in A with one from B or vice versa.
    MATCH       // Both sequences match at this point.
}

// Vertices corresepond to cells in the dynamic programming matrix.
class Vertex {
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

export type TokenPredicate<T> = (a: T) => boolean;
export type DownstreamTermPredicate<T> = (a: T) => boolean;
export type EqualityPredicate<T> = (a: T, b: T) => boolean;

function GenericEquality<T>(a: T, b: T): boolean {
    return a === b;
}

export interface DiffResults<T> {
    match: T[];
    cost: number;
    leftmostA: number;
    rightmostA: number;
    common: number;
}

class DiffMatrix<T> {
    // The longer, query sequence.
    a: T[];

    // The shorter, prefix sequence.
    b: T[];

    isDownstreamTerm: DownstreamTermPredicate<T>;
    isToken: TokenPredicate<T>;

    predicate: EqualityPredicate<T>;

    // Lengths of the two input sequences.
    aLen: number;
    bLen: number;

    // Dynamic programming matrix.
    matrix: Vertex[][] = [];

    // Best sequence match and Levenshtein distance will be stored here once
    // the constructor exits.
    result: DiffResults<T> = {
        match: [],
        cost: 0,
        leftmostA: 0,
        rightmostA: 0,
        common: 0
    };

    constructor(
        a: T[],
        b: T[],
        isDownstreamTerm: DownstreamTermPredicate<T>,
        isToken: TokenPredicate<T>,
        predicate: EqualityPredicate<T> = GenericEquality
    ) {
        this.a = a;
        this.b = b;
        this.isDownstreamTerm = isDownstreamTerm;
        this.isToken = isToken;
        this.predicate = predicate;

        this.aLen = a.length;
        this.bLen = b.length;

        this.initializeMatrix();
        this.findBestPath();
        this.tracePath();
    }

    // Initialize the dynamic programming matrix with a vertex at each cell.
    // Initialize delete path for sequence `a` (row 0) and sequence `b`
    // (column 0).
    initializeMatrix(): void {
        this.matrix = new Array(this.bLen + 1).fill([]);
        for (let j = 0; j <= this.bLen; ++j) {
            if (j === 0) {
                const row = new Array(this.aLen + 1);
                row[0] = new Vertex(0);
                for (let i = 1; i <= this.aLen; ++i) {
                    const cost = (this.isToken(this.a[i - 1])) ? DiffMatrix.tokenReplaceCost : 1;
                    row[i] = new Vertex(cost + row[i - 1].cost);
                }
                this.matrix[j] = row;
            }
            else {
                const row = new Array(this.aLen + 1);
                row[0] = new Vertex(j);
                for (let i = 1; i <= this.aLen; ++i) {
                    row[i] = new Vertex(0);
                }
                this.matrix[j] = row;
            }
        }
    }

    // DESIGN NOTE: Would like to use infinity for the cost of deleting or
    // replacing a token, but this would prevent tracing out a minimum cost
    // paths, since any path with a token deletion or replacement in the
    // suffix would result in an infinite cost. Using a large integer allows
    // the algorithm to differentiate between a variety of paths that
    // include a token deletion or replacement.
    static tokenReplaceCost = Math.pow(2, 32);

    // Dynamic programming algorithm fills in best edits and corresponding
    // Levenshtein distances at each vertex.
    findBestPath(): void {
        for (let j = 1; j <= this.bLen; ++j) {
            for (let i = 1; i <= this.aLen; ++i) {
                // Delete from A
                if (this.isToken(this.a[i - 1])) {
                    // We're never allowed to delete tokens from the query.
                    this.matrix[j][i].update(Edit.DELETE_A, DiffMatrix.tokenReplaceCost);
                }
                else {
                    this.matrix[j][i].update(Edit.DELETE_A, this.matrix[j][i - 1].cost + 1);
                }

                // Delete from B
                this.matrix[j][i].update(Edit.DELETE_B, this.matrix[j - 1][i].cost + 1);

                if (this.predicate(this.a[i - 1], this.b[j - 1])) {
                    // Match
                    this.matrix[j][i].update(Edit.MATCH, this.matrix[j - 1][i - 1].cost);
                }
                else {
                    // Replace
                    if (this.isToken(this.a[i - 1]))
                    {
                        // We're never allowed to replace tokens from the query.
                        this.matrix[j][i].update(Edit.REPLACE, DiffMatrix.tokenReplaceCost);
                    }
                    else {
                        this.matrix[j][i].update(Edit.REPLACE, this.matrix[j - 1][i - 1].cost + 1);
                    }
                }
            }
        }
    }

    // Walk backwards over best path, gathering match sequence, while computing
    // Levenshtein distance.
    tracePath(): void {
        const path = [];

        let ai = this.aLen;
        let bi = this.bLen;
        let current = this.matrix[bi][ai];
        let cost = current.cost;

        // Since we're doing a prefix match, we don't include the edits in the
        // suffix of sequence `a` that don't match sequence `b`. The suffix is
        // considered to be a consecutive sequence of deletes from `a` at the
        // end of the match.
        let inSuffix = true;
        let leftmostA = -1;
        let rightmostA = -1;
        let common = 0;

        while (current.edit !== Edit.NONE) {
            switch (current.edit) {
                case Edit.DELETE_A:
                    if (inSuffix) {
                        cost = this.matrix[bi][ai - 1].cost;
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
                        const term = this.a[ai - 1];

                        // Don't match a trailing downstream terms in the suffix.
                        // For example, suppose the query is "rack and trailer hitch"
                        // and the prefix is "rack and pinion". We don't want to
                        // generate a match of "rack and".
                        //
                        // Take the matched term if either of the following is true
                        //   1. we haven't taken any terms yet,
                        //      meaning that we've been in the suffix
                        //      and can continue trimming contributing terms
                        //   2. this term is not a contributing term.
                        //
                        if (path.length > 0 || !this.isDownstreamTerm(term)) {
                            path.push(term);
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
                        const term = this.a[ai - 1];

                        // Take the matched term if any of the following are true
                        //   1. we haven't taken any terms yet,
                        //      meaning that we've been in the suffix
                        //      and can continue trimming contributing terms
                        //   2. this terms matches the last term in b,
                        //      meaning we will stop trimming contributing terms.
                        //   3. this term is not a contributing term.
                        //
                        if (path.length > 0 || bi === this.bLen || !this.isDownstreamTerm(term)) {
                            path.push(term);
                            if (rightmostA < 0) {
                                rightmostA = ai - 1;
                            }
                        }

                        ai--;
                        bi--;
                        common++;
                        inSuffix = false;
                        leftmostA = ai;
                    }
                    break;
                default:
                    // Should never get here.
                    break;
            }

            current = this.matrix[bi][ai];
        }

        this.result = {
            match: path.reverse(),
            cost: Math.min(cost, Infinity),
            leftmostA,
            rightmostA,
            common
        };
    }
}

// Generic sequence diff.
export function diff<T>(
    query: T[],
    prefix: T[],
    isDownstreamTerm: DownstreamTermPredicate<T>,
    isToken: TokenPredicate<T>,
    predicate: EqualityPredicate<T> = GenericEquality
): DiffResults<T> {
    const d = new DiffMatrix<T>(query, prefix, isDownstreamTerm, isToken, predicate);
    return d.result;
}

// String diff.
export function diffString(
    query: string,
    prefix: string,
    isDownstreamTerm: DownstreamTermPredicate<string>,
    isToken: TokenPredicate<string>
) {
    const a = [...query];
    const b = [...prefix];
    const d = new DiffMatrix(a, b, isDownstreamTerm, isToken);
    const { match, ...rest } = d.result;
    return { match: match.join(''), ...rest };
}



