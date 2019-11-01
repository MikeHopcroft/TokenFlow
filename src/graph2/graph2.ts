import { Hash, theUnknownToken, Token } from '../tokenizer';

export interface Edge2 {
    from: number;
    to: number;
    token: Token;
    score: number;
}

export class Graph2 {
    // Data structure that maintains the mapping,
    //   (from, to, token) => edge
    // where `from` and `to` are vertex numbers.
    private edges: Array<Map<number, Map<Token, Edge2>>>;

    // Maintains the number incoming edges by vertex number.
    private inDegree: number[];

    constructor(vertexCount: number) {
        // Initialize the edges data structure.
        this.edges = [];
        this.inDegree = [];
        for (let i=0; i<vertexCount; ++i) {
            this.edges.push(new Map<number, Map<Token, Edge2>>());
            this.inDegree.push(0);
        }
        
        for (let i=0; i<vertexCount - 1; ++i) {
            this.addEdge({
                from: i,
                to: i+1,
                token: theUnknownToken,
                score: 0
            });
        }
    }

    vertexCount(): number {
        return this.edges.length;
    }

    // Attempts an edge to the graph.
    // An edge will only be added if it is the highest scoring edge connecting
    // a pair of vertices with a specific token.
    addEdge(edge: Edge2) {
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
                const tokenToEdge = new Map<Token, Edge2>();
                tokenToEdge.set(edge.token, edge);
                this.edges[edge.from].set(edge.to, tokenToEdge);
                this.inDegree[edge.to]++;
        }
    }

    isDAG(): boolean {
        // TODO: implement this function.
        return true;
    }

    *edgesFrom(v: number): IterableIterator<Edge2>
    {
        for (const tokenToEdge of this.edges[v].values()) {
            for (const edge of tokenToEdge.values()) {
                yield edge;
            }
        }
    }

    *allPaths(): IterableIterator<Edge2[]> {
        yield* this.allPathsRecursion(0, []);
    }

    private *allPathsRecursion(
        v: number,
        path: Edge2[]
    ): IterableIterator<Edge2[]> {
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

    *maximalPaths(): IterableIterator<Edge2[]> {
        // TODO: implement
    }

    private *maximalPathsRecursion(): IterableIterator<Edge2[]> {
        // TODO: implement
    }
}

// TODO: Consider templating Graph2 and Edge2 by token Type.
// This will allow us to run directly against a graph of Hashes.
export function *match2(
    graph: Graph2,
    from: number,
    prefix: Hash[],
    token: Token
): IterableIterator<Edge2> {
    // TODO: implement
}

function *match2Recursion(): IterableIterator<Edge2> {
    // TODO: implement
}