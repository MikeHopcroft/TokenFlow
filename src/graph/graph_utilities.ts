import { theUnknownToken, Token, Tokenizer } from '../tokenizer';

import { DynamicGraph2 } from './dynamic_graph';
import { Edge, Graph } from './types';

///////////////////////////////////////////////////////////////////////////////
//
// Graph filtering and coalescing
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
    for (let i = 0; i < graph.edgeLists.length; ++i) {
        const edgeList = graph.edgeLists[i];
        const edges = new Map2D<Token,number,Edge>();

        for (const edge of edgeList) {
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
        const filtered = [...edges.values()].sort((a,b) => b.score - a.score);
        edgeLists.push(filtered);
    }

    return new DynamicGraph2(edgeLists);
}

export function filterGraph(graph: Graph, threshold: number) {
    const edgeLists: Edge[][] = [];

    for (let i = 0; i < graph.edgeLists.length; ++i) {
        const edgeList = graph.edgeLists[i];
        const edges: Edge[] = [];

        for (const edge of edgeList) {
          // TODO: investigate whether theUnknownToken can appear anywhere
          // other than input edges.
          if ((edge.score >= threshold) || (edge.token === theUnknownToken)) {
              edges.push(edge);
          }
        }

        edgeLists.push(edges);
    }

    const g2 = new DynamicGraph2(edgeLists);
    for (const edgeList of g2.edgeLists) {
        edgeList.sort((a,b) => b.score - a.score);
    }
    return g2;
}
