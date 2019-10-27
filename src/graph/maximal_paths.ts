import { Token } from '../tokenizer';
import { Map2D } from './graph_utilities';
import { Edge } from './types';

// TODO:
//   x unit tests
//   improve unit test by sorting paths
//   improve unit test with ascii diagram
//   remove graph.test.ts
//   remove static_graph.ts
//   matcher labels edges with tokens
//   remove tokenFromEdge
//   get rid of DynamicGraph data structure? Or retain for upcoming, non-linear DAG?
//   unique number token factory
//   remove Edge.label, Edge.isNumber
//   possibly add Edge.alias
//   remove equivalentPaths()
//   remove findPath() - what about ignorePrefix - what is this for?
//   rename walk() to allPaths().
//   reimplement allPaths() as a variant of maximalPaths() that keeps all back links.
//   make maximalPaths() and allPaths() static members of Graph?
//   Update samples/unified
//   Reinstate relevance_suite.ts

// export interface Edge2 extends Edge {
// export interface Edge2 {
//     token: Token;
//     length: number;
//     score: number;
// }

class Vertex {
    score = -1;
    back = new Map2D<Vertex, Token, Edge>();

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
        vertices.push(new Vertex());
    }

    // Forward propagate
    vertices[0].score = 0;
    for (let i=0; i < edgeLists.length; ++i) {
        const from = vertices[i];

        // Only add edges if `from` vertex lies on a path from the start.
        if (from.score >= 0) {
            const edges = edgeLists[i];
            for (const edge of edges) {
                const to = vertices[edge.length + i];
                to.addBackLink(from, edge);
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
        vertices.push(new Vertex());
    }

    // Forward propagate
    vertices[0].score = 0;
    for (let i=0; i < edgeLists.length; ++i) {
        const from = vertices[i];

        // Only add edges if `from` vertex lies on a path from the start.
        if (from.score >= 0) {
            const edges = edgeLists[i];
            for (const edge of edges) {
                const to = vertices[edge.length + i];
                to.addTopScoringBackLink(from, edge);
            }
        }
    }

    // Back trace
    yield* backtraceRecursion(vertices[vertices.length - 1], []);
}

function *backtraceRecursion(
    vertex: Vertex,
    path: Edge[]
): IterableIterator<Edge[]> {
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
