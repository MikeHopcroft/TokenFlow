export interface Edge2<T> {
    from: number;
    to: number;
    token: T;
    score: number;
}

export function createEdge2<T>(
    from: number,
    score: number,
    to: number,
    token: T
): Edge2<T> {
    return { from, score, to, token };
}

export class Graph2<T> {
    // Data structure that maintains the mapping,
    //   (from, to, token) => edge
    // where `from` and `to` are vertex numbers.
    private edges: Array<Map<number, Map<T, Edge2<T>>>>;

    // Maintains the number incoming edges by vertex number.
    private inDegree: number[];

    constructor(vertexCount: number) {
        // Initialize the edges data structure.
        this.edges = [];
        this.inDegree = [];
        for (let i=0; i<vertexCount; ++i) {
            this.edges.push(new Map<number, Map<T, Edge2<T>>>());
            this.inDegree.push(0);
        }

        // TODO: this code should be in the matcher.
        // An input graph would not have a default path.
        // for (let i=0; i<vertexCount - 1; ++i) {
        //     this.addEdge({
        //         from: i,
        //         to: i+1,
        //         token: theUnknownToken,
        //         score: 0
        //     });
        // }
    }

    vertexCount(): number {
        return this.edges.length;
    }

    // Attempts an edge to the graph.
    // An edge will only be added if it is the highest scoring edge connecting
    // a pair of vertices with a specific token.
    addEdge(edge: Edge2<T>) {
        const tokenToEdge = this.edges[edge.from].get(edge.to);
        if (tokenToEdge) {
            // We already have a tokenToEdge map for (edge.from, edge.to).
            const existing = tokenToEdge.get(edge.token);
            if (existing) {
                // The tokenToEdge map already has an entry for edge.token.
                if (edge.score > existing.score) {
                    // Replace with higher scoring edge.
                    tokenToEdge.set(edge.token, edge);
                }
            } else {
                // Create a new entry for this edge.
                tokenToEdge.set(edge.token, edge);
                this.inDegree[edge.to]++;
            }
        } else {
                // Create a the tokenToEdge map and add edge.
                const tokenToEdge = new Map<T, Edge2<T>>();
                tokenToEdge.set(edge.token, edge);
                this.edges[edge.from].set(edge.to, tokenToEdge);
                this.inDegree[edge.to]++;
        }
    }

    isDAG(): boolean {
        // TODO: implement this function.
        return true;
    }

    *edgesFrom(v: number): IterableIterator<Edge2<T>>
    {
        for (const tokenToEdge of this.edges[v].values()) {
            for (const edge of tokenToEdge.values()) {
                yield edge;
            }
        }
    }

    *allPaths(): IterableIterator<Array<Edge2<T>>> {
        yield* this.allPathsRecursion(0, []);
    }

    private *allPathsRecursion(
        v: number,
        path: Array<Edge2<T>>
    ): IterableIterator<Array<Edge2<T>>> {
        if (v === this.edges.length) {
            // Recursive base case
            yield path;
        } else {
            for (const edge of this.edgesFrom(v)) {
                path.push(edge);
                yield* this.allPathsRecursion(v+1, path);
                path.pop();
            }
        }
    }

    *maximalPaths(): IterableIterator<Array<Edge2<T>>> {
        // TODO: implement
    }

    private *maximalPathsRecursion(): IterableIterator<Array<Edge2<T>>> {
        // TODO: implement
    }
}
