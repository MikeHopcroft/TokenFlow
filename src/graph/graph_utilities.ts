import { Span, Token, Tokenizer } from '..';

import { DynamicGraph } from './dynamic_graph';
import { GraphWalker } from './graph_walker';
import { Edge, Graph } from './types';
import { theUnknownToken } from '../tokenizer';

///////////////////////////////////////////////////////////////////////////////
//
// Path enumeration
//
///////////////////////////////////////////////////////////////////////////////

// Exercises the GraphWalker API to generates all paths in a graph.
export function* walk(
    tokenizer: Tokenizer,
    graph: Graph,
    walker: GraphWalker
): IterableIterator<Array<Token & Span>> {
    yield* walkRecursion(tokenizer, graph, walker);

    // IMPORTANT: the tokenize() function will talk this graph
    // multiple times. Ensure that discarded edges are restored
    // after walking.
    for (const e of graph.edgeLists[0]) {
        e.discarded = false;
    }
}

function* walkRecursion(
    tokenizer: Tokenizer,
    graph: Graph,
    walker: GraphWalker
): IterableIterator<Array<Token & Span>> {
    while (true) {
        // Advance down next edge in current best path.
        walker.advance();

        if (walker.complete()) {
            // If the path is complete, ie it goes from the first vertex to the
            // last vertex, then yield the path.
            const path: Edge[] = [...walker.left, ...walker.right];
            const tokens = new Array<Token & Span>();
            let start = 0;
            for (const edge of path) {
                tokens.push({
                    // ...tokenizer.tokenFromEdge(edge),
                    ...edge.token,
                    start,
                    length: edge.length
                });
                start += edge.length;
            }
            yield(tokens);
        }
        else {
            // Otherwise, walk further down the path.
            yield* walkRecursion(tokenizer, graph, walker);
        }

        // We've now explored all paths down this edge.
        // Retreat back to the previous vertex.
        walker.retreat(true);

        // Then, attempt to discard the edge we just explored. If, after
        // discarding, there is no path to the end then break out of the loop.
        // Otherwise go back to the top to explore the new path.
        if (!walker.discard()) {
            break;
        }
    }
}

export function *equivalentPaths(
    tokenizer: Tokenizer,
    graph: Graph,
    path: Edge[]
): IterableIterator<Array<Token & Span>> {
    yield* equivalentPathsRecursion(tokenizer, graph, 0, 0, path, []);
}

function *equivalentPathsRecursion(
    tokenizer: Tokenizer,
    graph: Graph,
    e: number,
    v: number,
    path: Edge[],
    prefix: Array<Token & Span>
): IterableIterator<Array<Token & Span>> {
    if (prefix.length === path.length) {
        // Recursive base case. Return the list of edges.
        yield [...prefix];
    }
    else {
        // Recursive case. Enumerate all equivalent edges from this vertex.
        const tokens = new Set<Token>();
        const currentEdge = path[e];
        const vertex = graph.edgeLists[v];
        for (const edge of vertex) {
            if (edge.score === currentEdge.score &&
                edge.length === currentEdge.length)
            {
                // const token: Token = tokenizer.tokenFromEdge(edge);
                const token = edge.token;
                if (!tokens.has(token)) {
                    tokens.add(token);
                    prefix.push({
                        ...token,
                        start: v,
                        length: edge.length
                        // TODO: consider storing reference to token here
                        // in case downstream users want to check for object
                        // equality.
                    });
                    yield* equivalentPathsRecursion(
                        tokenizer,
                        graph,
                        e + 1,
                        v + currentEdge.length,
                        path,
                        prefix
                    );
                    prefix.pop();
                }
            }
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//
// Graph filtering
//
///////////////////////////////////////////////////////////////////////////////
export class Map2D<A,B,V> {
    entries = new Map<A, Map<B,V>>();

    get(a:A, b:B): V | undefined {
        const d2 = this.entries.get(a);
        if (d2) {
            return d2.get(b);
        } else {
            return undefined;
        }
    }

    set(a:A, b:B, v:V): void {
        const d2 = this.entries.get(a);
        if (d2) {
            d2.set(b, v);
        } else {
            const d = new Map<B, V>();
            d.set(b, v);
            this.entries.set(a, d);
        }
    }

    isEmpty(): boolean {
        return this.entries.size === 0;
    }

    *values(): IterableIterator<V> {
        for (const d2 of this.entries.values()) {
            yield* d2.values();
        }
    }
}

export function coalesceGraph(tokenizer: Tokenizer, graph: Graph) {
    const edgeLists: Edge[][] = [];
    // Copy and filter all but the last edgeList, which is added by the
    // DynamicGraph constructor.
    for (let i = 0; i < graph.edgeLists.length - 1; ++i) {
        const edgeList = graph.edgeLists[i];
        const edges = new Map2D<Token,number,Edge>();

        for (const edge of edgeList) {
            // Don't copy default edges.
            if (edge.token !== theUnknownToken) {
            // if (edge.label !== -1) {
                // const token = tokenizer.tokenFromEdge(edge);
                const token = edge.token;
                const existing = edges.get(token, edge.length);
                if (existing) {
                    // Keep only the highest scoring edge for each
                    // (token, length) pair.
                    if (existing.score < edge.score) {
                        edges.set(token, edge.length, edge);
                    }
                } else {
                    edges.set(token, edge.length, edge);
                }
            }
        }
        const filtered = [...edges.values()].sort((a,b) => b.score - a.score);
        edgeLists.push(filtered);
    }

    return new DynamicGraph(edgeLists);
}

export function filterGraph(graph: Graph, threshold: number) {
    const edgeLists: Edge[][] = [];

    // Copy and filter all but the last edgeList, which is added by the
    // DynamicGraph constructor.
    for (let i = 0; i < graph.edgeLists.length - 1; ++i) {
        const edgeList = graph.edgeLists[i];
        const edges: Edge[] = [];

        // for (const edge of edgeList) {
        //     if ((edge.score >= threshold) && (edge.label !== -1)) {
        //         edges.push(edge);
        //     }
        // }
        for (const edge of edgeList) {
            if ((edge.score >= threshold) && (edge.token !== theUnknownToken)) {
                edges.push(edge);
            }
        }

        edgeLists.push(edges);
    }

    const g2 = new DynamicGraph(edgeLists);
    for (const edgeList of g2.edgeLists) {
        edgeList.sort((a,b) => b.score - a.score);
    }
    return g2;
}

