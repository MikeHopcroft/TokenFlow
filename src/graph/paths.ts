import { Token } from '../tokenizer';

import { Map2D } from './graph_utilities';
import { Edge } from './types';
// import { tokenToString } from '../../samples/unified';

// TODO:
//   Fix breaking api changes in short-order
//   Move this list to TODO.md
//   Move this code into graph_utilities?
//   Verify filter and coalesce
//   Unit test filter and coalesce
//   x unit tests
//   improve unit test by sorting paths
//   improve unit test with ascii diagram
//   remove graph.test.ts - why?
//   x remove static_graph.ts
//   x matcher labels edges with tokens
//   x remove tokenFromEdge
//   get rid of DynamicGraph data structure? Or retain for upcoming, non-linear DAG?
//   x unique number token factory
//   x remove Edge.label, Edge.isNumber
//   possibly add Edge.alias
//   x remove equivalentPaths()
//   x remove findPath() - what about ignorePrefix - what is this for?
//   x rename walk() to allPaths().
//   x reimplement allPaths() as a variant of maximalPaths() that keeps all back links.
//   make maximalPaths() and allPaths() static members of Graph?
//   Update samples/unified
//   Reinstate relevance_suite.ts
//   Update repl with enhancements from short-order
//   Document that score should never be -1. Ensure that this never happens.

class Vertex {
    score = -1;
    back = new Map2D<Vertex, Token, Edge>();
    id: number;

    constructor(id: number) {
        this.id = id;
    }

    addTopScoringBackLink(previous: Vertex, edge: Edge) {
        const score = previous.score + edge.score;
        if (score > this.score) {
            // We've found a higher scoring path to this vertex.
            // Replace all of the old back links with the new one.
            this.score = score;
            this.back = new Map2D<Vertex, Token, Edge>();
            this.back.set(previous, edge.token, edge);
        } else if (score === this.score) {
            // The path has the same score as other.
            // Add it to the collection of back links, possibly
            // replacing another back link for the same token.
            this.back.set(previous, edge.token, edge);
        } else {
            // Do nothing. This path score lower than other known
            // paths to this vertex.
        }
    }

    addBackLink(previous: Vertex, edge: Edge) {
        this.score = 1;
        this.back.set(previous, edge.token, edge);
    }
}

export function *allPaths(edgeLists:Edge[][]): IterableIterator<Edge[]> {
    // Create array of vertices
    const vertices: Vertex[] = [];
    for (let i=0; i <= edgeLists.length; ++i) {
        vertices.push(new Vertex(i));
    }

    // Forward propagate
    vertices[0].score = 0;
    for (let i=0; i < edgeLists.length; ++i) {
        const from = vertices[i];

        // Only add edges if `from` vertex lies on a path from the start.
        if (from.score >= 0) {
            const edges = edgeLists[i];
            for (const edge of edges) {
                // TODO: REVIEW: why check for edges off the end here and not
                // in maximalPaths().
                // Add edges that don't extend beyond last vertex.
                const toIndex = edge.length + i;
                if (toIndex < vertices.length) {
                    const to = vertices[toIndex];
                    to.addBackLink(from, edge);
                }
            }
        }
    }

    // Back trace
    yield* backtraceRecursion(vertices[vertices.length - 1], []);
}

export function *maximalPaths(edgeLists:Edge[][]): IterableIterator<Edge[]> {
    // Create array of vertices
    const vertices: Vertex[] = [];
    for (let i=0; i <= edgeLists.length; ++i) {
        vertices.push(new Vertex(i));
    }

    // Forward propagate
    vertices[0].score = 0;
    for (let i=0; i < edgeLists.length; ++i) {
        const from = vertices[i];

        // Only add edges if `from` vertex lies on a path from the start.
        if (from.score >= 0) {
            const edges = edgeLists[i];
            for (const edge of edges) {
                const toIndex = edge.length + i;
                // TODO: REVIEW: why check for edges off the end in
                // allPaths() and not here?
                // if (toIndex < vertices.length) {
                    const to = vertices[toIndex];
                    to.addTopScoringBackLink(from, edge);
                // }
            }
        }
    }

    // for (const vertex of vertices) {
    //     console.log(`Vertex ${vertex.id}`);
    //     for (const [k, v] of vertex.back.entries.entries()) {
    //         console.log(`  From ${k.id}`);
    //         for (const [k2, v2] of v.entries()) {
    //             console.log(`    ${tokenToString(v2.token)}`);
    //         }
    //     }
    // }

    // const l = [...backtraceRecursion(vertices[vertices.length - 1], [])];
    // for (const x of l) {
    //     yield x;
    // }

    // Back trace
    yield* backtraceRecursion(vertices[vertices.length - 1], []);
}

function *backtraceRecursion(
    vertex: Vertex,
    path: Edge[]
): IterableIterator<Edge[]> {
    // if (path.length === 0) {
    //     console.log(`backtraceRecursion: ${btrCounter} path length === 0`);
    // }
    // if (path.length < 10) {
    //     console.log(`backtraceRecursion: ${path.map(e => tokenToString(e.token))}`);
    // }
    if (vertex.back.isEmpty()) {
        // Recursive base case. Yield a copy of the path.
        yield [...path];
    } else {
        // For each previous vertex
        for (const [previous, tokenToEdge] of vertex.back.entries) {
            // For each edge from that vertex
            for (const e of tokenToEdge.values()) {
                // Prepend the edge to the path
                path.unshift(e);
                // Continue backtrace
                yield* backtraceRecursion(previous, path);
                // Restore path
                path.shift();
            }
        }
    }
}
