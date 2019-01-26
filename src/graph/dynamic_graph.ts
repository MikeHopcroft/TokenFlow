import { Edge, Graph } from './types';

export class Vertex {
    edges: Edge[];
    score: number;
    backtraceVertex: Vertex | null = null;
    backtraceEdge: Edge | null = null;

    constructor(edges: Edge[], score: number) {
        this.edges = edges;
        this.score = score;
    }
}

export class DynamicGraph implements Graph {
    edgeLists: Edge[][];

    vertices: Vertex[];

    constructor(edgeLists: Edge[][]) {
        // TODO: clear the discarded property on each edge?
        // Or make a copy of edge lists? Don't really like
        // side-effecting caller's edges, but copying them
        // seems wasteful.
        // TODO: provide a method for user to clear discarded property?

        // TODO: Reevaluate the design choice of the -1 sentinel.
        // Perhaps use `undefined`?
        // NOTE: using label value of -1 as sentinel for edge with no label.
        this.edgeLists = edgeLists.map((edges: Edge[]) => [
            { score: 0, length: 1, label: -1, isNumber: false }, ...edges
        ]);

        // Add outgoing edges for final vertex.
        this.edgeLists.push([]);

        this.vertices = this.edgeLists.map((edges, index) => {
            const score = index === 0 ? 0 : -Infinity;
            return new Vertex(edges, score);
        });
    }

    // Returns the index of the last vertex in the graph.
    lastVertex() {
        // NOTE that the constructor extends this.edgeLists to include an empty
        // list of outgoing edges associated with a synthetic final vertex,
        // which lies beyond the last vertex. This is why we subtract 1 in the
        // following line.
        return this.edgeLists.length - 1;
    }

    // Finds the highest scoring path from this.vertices[start] that does
    // not pass through a discarded edge. Ignores `prefix`.
    findPath(ignorePrefix: Edge[], start: number): Edge[]
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

        // TODO: consider using `unshift()` instead of `push()/reverse()`.
        const forwardPath = reversePath.reverse();

        return forwardPath;
    }

    score(): number {
        return this.vertices[this.vertices.length - 1].score;
    }
}
