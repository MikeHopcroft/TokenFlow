import { Edge, Graph } from '../../src/graph/types';

export interface Path2 {
    edges: Edge[];
    score: number;
    text: string;
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
        // TODO: Reevaluate the design choice of the -1 sentinel.
        // Perhaps use `undefined`?
        // NOTE: using label value of -1 as sentinel for edge with no label.
        this.edgeLists = edgeLists.map((edges: Edge[]) => [
            { score: 0, length: 1, label: -1, isNumber: false }, ...edges
        ]);

        // Add outgoing edges for final vertex.
        this.edgeLists.push([]);

        // TODO: enforce design limitation that verticies are associated with
        // lowercase ascii characters.
        this.createPaths([], 'a', this.edgeLists);

        // Sort paths in order they would be encountered by GraphWalker applied
        // to an equivalent DynamicGraph. First sort by decreasing score, then
        // lexigraphically by vertex.
        //
        // Using this sort simplifies comparing walks over a StaticGraph and
        // its equivalent DynamicGraph.
        //
        // TODO: this ordering makes an assumption on how the edgeLists were
        // constructed - namely that shorter edges appear before longer edges.
        this.paths.sort((a, b) => {
            if (a.score === b.score) {
                return a.text.localeCompare(b.text);
            }
            else {
                return b.score - a.score;
            }
        });

        this.right = this.findPath(this.left, 0);
    }

    createPaths(prefix: Edge[], prefixText: string, graph: Edge[][]) {
        let vertex = 0;
        for (const edge of prefix) {
            vertex += edge.length;
        }

        if (vertex < graph.length) {
            for (const edge of graph[vertex]) {
                const edges = [...prefix, edge];
                let score = 0;
                for (const e of edges) {
                    score += e.score;
                }
                const text = prefixText.concat(String.fromCharCode(vertex + edge.length + 97));
                
                // TODO: consider case where edge extends beyond last vertex.
                // Risk of infinite recursion.
                if (vertex + edge.length === graph.length - 1) {
                    this.paths.push({ edges, text, score });
                }
                else {
                    this.createPaths(edges, text, graph);
                }
            }
        }
    }

    // Returns the index of the last vertex in the graph.
    lastVertex() {
        // NOTE that the constructor extends this.edgeLists to include an empty
        // list of outgoing edges associated with a synthetic final vertex,
        // which lies beyond the last vertex. This is why we subtract 1 in the
        // following line.
        return this.edgeLists.length - 1;
    }

    // Attempts to find the highest scoring path that passes through a `start`
    // vertex that lies at the end of a path `prefix`. The path will not
    // make use of discarded edges. Returns [] if no path exists.
    // NOTE that this implementation ignores `start`. Instead it only relies
    // on `prefix`.
    findPath(prefix: Edge[], ignoredStart: number):Edge[] {
        let index;
        for (index = 0; index < this.paths.length; ++index) {
            if (StaticGraph.startsWith(this.paths[index].edges, prefix) &&
                StaticGraph.validPath(this.paths[index].edges)) {
                return this.paths[index].edges.slice(prefix.length);
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
