import { Edge, Graph } from './types';

export interface Path2 {
    edges: Edge[];
    score: number;
}

function printPath(path: Edge[]) {
    let score = 0;
    const vertices = [0];
    for (const edge of path) {
        vertices.push(vertices[vertices.length - 1] + edge.length);
        score += edge.score;
    }
    console.log(`  ${vertices.map(n => String.fromCharCode(97 + n)).join('')}: ${score}`);
}


export class StaticGraph implements Graph {
    edgeLists: Edge[][];

    paths: Path2[] = [];

    left: Edge[] = [];
    right: Edge[] = [];
    current = 0;

    constructor(edgeLists: Edge[][]) {
        this.edgeLists = edgeLists.map((edges: Edge[]) => [
            { score: 0, length: 1, label: -1 }, ...edges
        ]);

        // Add outgoing edges for final vertex.
        this.edgeLists.push([]);

        this.createPaths([], this.edgeLists);
        this.paths.sort((a, b) => b.score - a.score);

        this.right = this.findPath(this.left, 0);

        console.log('=== PATHS start ===');
        for (const path of this.paths) {
            printPath(path.edges);
        }
        console.log('=== PATHS end ===');

        // console.log('----------------');
        // printPath(this.left);
    }

    createPaths(prefix: Edge[], graph: Edge[][]) {
        let vertex = 0;
        for (const edge of prefix) {
            vertex += edge.length;
        }

        if (vertex < graph.length) {
            for (const edge of graph[vertex]) {

                // TODO: consider case where edge extends beyond last vertex.

                const edges = [...prefix, edge];
                let score = 0;
                for (const e of edges) {
                    score += e.score;
                }

                // TODO: this is storing a path prefix. Limit to complete paths?
                if (vertex + edge.length === graph.length - 1) {
                    this.paths.push({ edges, score });
                }
                else {
                    this.createPaths(edges, graph);
                }
            }
        }
    }

    lastVertex() {
        return this.edgeLists.length - 1;
        // return this.edgeLists.length - 1;
    }

    findPath(prefix: Edge[], start: number):Edge[] {
        let index;
        for (index = 0; index < this.paths.length; ++index) {
            if (StaticGraph.startsWith(this.paths[index].edges, prefix) &&
                StaticGraph.validPath(this.paths[index].edges)) {
                return this.paths[index].edges;
            }
        }

        return [];
    }

    private static startsWith(path: Edge[], prefix: Edge[]): boolean {
        if (prefix.length <= path.length) {
            for (const [index, value] of prefix.entries()) {
                if (path[index] !== value) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    
    private static validPath(path: Edge[]): boolean {
        for (const edge of path) {
            if (edge.discarded) {
                return false;
            }
        }
        return true;
    }    
}
