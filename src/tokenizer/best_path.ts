export interface Edge {
    score: number;
    length: number;
    label: number;
    // TODO: do we really want to expose the discarded property to the caller?
    discarded?: boolean;
}

export class Vertex {
    edges: Edge[];
    score = -Infinity;
    backtraceVertex: Vertex | null = null;
    backtraceEdge: Edge | null = null;
    checkpoint = false;

    constructor(edges: Edge[], score: number) {
        this.edges = edges;
        this.score = score;
    }
}

export class Graph {
    vertices: Vertex[];

    defaultEdge: Edge;
    left: Edge[] = [];
    right: Edge[] = [];
    current = 0;

    constructor(edgeLists: Edge[][]) {
        // TODO: ISSUE: should edgelists be sorted?
        // Probably not necessary as we always pick the edge
        // on the best scoring path.

        // TODO: clear the discarded property on each edge?
        // Or make a copy of edge lists? Don't really like
        // side-effecting caller's edges, but copying them
        // seems wasteful.
        // TODO: some method for user to clear discarded property?
        const vertexCount = edgeLists.length;

        // NOTE: using label value of -1 as sentinel for no label.
        this.defaultEdge = { score: 0, length: 1, label: -1 };
        this.vertices = edgeLists.map((edges, index) => {
            const score = index === 0 ? 0 : -Infinity;
            return new Vertex([{ ...this.defaultEdge}, ...edges], score);
            // return new Vertex([{ ...this.defaultEdge }, ...edges], score);
        });
        this.vertices.push(new Vertex([], -Infinity));

        // TODO: existing token-flow code will find the best
        // path twice. Modify code below to return this.left.
        this.right = this.findPath2(0);
    }

    // Returns true when the current path extends to the final vertex.
    complete(): boolean {
        // return this.current === this.vertices.length;
        return this.current === this.vertices.length - 1;
        // return this.right.length === 0;
    }

    // Attempt to extend the current path by advancing forward along the next
    // Edge in the top-scoring path through the current vertex. Returns the
    // extended path. NOTE that calling advance() from the last vertex is legal,
    // but the path will not be extended. At all other vertices, advance() will
    // succeed in extending the path because of default edges which cannot be
    // discarded.
    advance(): boolean {
        // TODO: consider throwing if this.complete() === true.
        const edge = this.right.shift();
        if (edge !== undefined) {
            this.current += edge.length;
            this.left.push(edge);
            return true;
        }
        return false;
        // return this.right.length !== 0;
    }

    // Attempt to move backwards one edge to the previous vertex. Before
    // moving, clear the checkpoint on the current vertex. When `reset` is
    // true, reinstate edges discarded from the previous vertex.
    retreat(reset: boolean): Edge[] {
        this.retreatHelper(reset);
        // this.right = this.findPath2(this.left.length);
        this.right = this.findPath2(this.current);
        return this.left;
    }
    
    private retreatHelper(reset: boolean) {
        const edge = this.left.pop();
        
        if (edge === undefined) {
            throw TypeError('Graph.retreatHelper(): attempt to retreat from first vertex.');
        }
        else {
            this.vertices[this.current].checkpoint = false;
            for (const e of this.vertices[this.current].edges) {
                e.discarded = false;
            }
            this.current -= edge.length;

            // TODO: following line shouldn't be necessary.
            this.right.unshift(edge);
        }
    }

    // Attempts to remove the most recently traversed Edge from the graph
    // and then advances from the previous vertex along the new top-scoring
    // path. Returns the new Edge.
    //
    // NOTE: this method always returns an edge because
    //   1. discard() can never retreat to the last vertex as this would
    //      imply a vertex after the last vertex.
    //   2. discard() is not allowed to remove the default edge.
    //
    // NOTE: edges are not necessarily removed in order of decreasing score.
    // Need to mark edges as removed.
    // discard(): boolean {
    //     if (this.left.length === 0) {
    //         throw TypeError('Graph.discard(): attempt to discard from first vertex.');   
    //     }
    //     else {
    //         const edge = this.left[this.left.length - 1];
    //         if (edge.discarded) {
    //             throw TypeError('Graph.discard(): edge already discarded.');   
    //         }

    //         edge.discarded = true;
    //         this.retreat(false);
    //         this.advance();
    //         if (this.left[this.left.length - 1] === this.defaultEdge) {
    //             console.log('HERE!');
    //         }

    //         return (!this.complete() && this.right.length === 0);


    //         // return this.left[this.left.length - 1] !== this.defaultEdge;
    //         // return true;
    //         // }
    //         // console.log('THERE THERE THERE!');
    //         // return false;
    //     }
    // }


    // discard(): boolean {
    //     if (this.left.length === 0) {
    //         throw TypeError('Graph.discard(): attempt to discard from first vertex.');   
    //     }
    //     else {
    //         const edge = this.left[this.left.length - 1];
    //         if (edge !== this.defaultEdge) {
    //             edge.discarded = true;
    //             this.retreat(false);
    //             this.advance();
    //             if (this.left[this.left.length - 1] === this.defaultEdge) {
    //                 console.log('HERE!');
    //             }
    //             // return this.left[this.left.length - 1] !== this.defaultEdge;
    //             return true;
    //         }
    //         console.log('THERE THERE THERE!');
    //         return false;
    //     }
    // }

    discard(): boolean {
        if (this.right.length === 0) {
            throw TypeError('Graph.discard(): attempt to discard from last vertex.');   
        }

        this.right[0].discarded = true;
        this.right = this.findPath2(this.current);
        return this.right.length > 0;
    }


    // Marks the current vertex as checkpointed for possible later use by the
    // restore() method.
    checkpoint() {
        this.vertices[this.left.length].checkpoint = true;
    }

    // Retreats to the most recently checkpointed vertex, removing checkpoint
    // markers along the way.
    // NOTE: Attempting to restore from an empty stack will result in an
    // exception.
    restore(reset: boolean): Edge[] {
        if (this.left.length > 0) {
            while (this.left.length !== 0) {
                this.retreatHelper(reset);

                // TODO: BUGBUG: current is wrong. Need vertex index, not edge number.
                if (this.vertices[this.left.length].checkpoint) {
                    break;
                }
            }
            this.right = this.findPath2(this.left.length);
        }
        return this.left;
    }

    // Finds the highest scoring path from this.vertices[start] that does
    // not pass through a discarded edge.
    private findPath2(start: number): Edge[]
    {
        // Initialize vertices and forward propagate paths.
        for (let index = start; index < this.vertices.length; ++index) {
            const vertex = this.vertices[index];
            vertex.score = index === start ? 0 : -Infinity;
            vertex.backtraceVertex = null;
            vertex.backtraceEdge = null;
        }

        for (let index = start; index < this.vertices.length; ++index) {
            const vertex = this.vertices[index];
            for (const edge of vertex.edges) {
                if (edge.discarded !== true) {
                    const targetIndex = index + edge.length;

                    if (targetIndex < this.vertices.length) {
                        const target = this.vertices[targetIndex];
                        const newScore = vertex.score + edge.score;
                        if (target.score < newScore) {
                            target.score = newScore;
                            target.backtraceVertex = vertex;
                            target.backtraceEdge = edge;
                        }
                    }
                }
            }
        }

        // Extract path by walking backwards from last vertex.
        const reversePath = [];
        let current = this.vertices[this.vertices.length - 1];
        while (current.backtraceVertex) {
            reversePath.push(current.backtraceEdge as Edge);
            current = current.backtraceVertex;
        }

        const forwardPath = reversePath.reverse();

        return forwardPath;
    }

    findPath() {
        // Forward propagate paths.
        this.vertices.forEach((vertex, index) => {
            vertex.edges.forEach((edge) => {
                const targetIndex = index + edge.length;
                if (targetIndex < this.vertices.length) {
                    const target = this.vertices[targetIndex];
                    const newScore = vertex.score + edge.score;
                    if (target.score < newScore) {
                        target.score = newScore;
                        target.backtraceVertex = vertex;
                        target.backtraceEdge = edge;
                    }   
                }
            });
        });

        // Extract path by walking backwards from last vertex.
        const reversePath = [];
        let current = this.vertices[this.vertices.length - 1];
        while (current.backtraceVertex) {
            reversePath.push(current.backtraceEdge as Edge);
            current = current.backtraceVertex;
        }

        const forwardPath = reversePath.reverse();

        return forwardPath;
    }
}

export function findBestPath(edgeLists: Edge[][]) {
    const graph = new Graph(edgeLists);
    return graph.findPath();
}