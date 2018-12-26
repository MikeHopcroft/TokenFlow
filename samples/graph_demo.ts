import { Edge, Graph } from '../src';
import { start } from 'repl';

interface Path {
    vertices: string;
    score: number;
    discarded: boolean;
}

interface Path2 {
    edges: Edge[];
    score: number;
}

function startsWith<T>(path: T[], prefix: T[]): boolean {
    if (prefix.length <= path.length) {
        for (const [index, value] of prefix.entries()) {
            if (path[index] !== value) {
                break;
            }
        }
        return true;
    }
    return false;
}

function validPath(path: Edge[]): boolean {
    for (const edge of path) {
        if (edge.discarded) {
            return false;
        }
    }
    return true;
}

function pathsEqual(a: Edge[], b: Edge[]): boolean {
    if (a.length === b.length) {
        for (const [index, value] of a.entries()) {
            if (value !== b[index]) {
                return false;
            }
        }
        return true;
    }
    return false;
}

class Graph3 {
    paths: Path2[] = [];

    constructor(graph: Edge[][]) {
        this.createPaths([], graph);
        this.paths.sort( (a, b) => b.score - a.score );

        for (const path of this.paths) {
            printPath(path.edges);
        }
    }

    createPaths(prefix: Edge[], graph: Edge[][]) {
        let vertex = 0;
        for (const edge of prefix) {
            vertex += edge.length;
        }

        if (vertex < graph.length) {
            for (const edge of graph[vertex]) {

                // TODO: consider case where edge extends beyond last vertex.

                const edges = [ ...prefix, edge ];
                let score = 0;
                for (const e of edges) {
                    score += e.score;
                }

                // TODO: this is storing a path prefix. Limit to complete paths?
                if (vertex + edge.length === graph.length) {
                    this.paths.push({ edges, score });
                }
                else {
                    this.createPaths(edges, graph);
                }
            }
        }
    }

    nextBestPath(prefix: Edge[]): Path2 | null {
        // Find `prefix` in this.paths.
        let index;
        for (index = 0; index < this.paths.length; ++index) {
            if (startsWith(this.paths[index].edges, prefix) &&
                validPath(this.paths[index].edges)) {
                return this.paths[index];
            }
        }

        return null;

        // // From there scan forward for paths
        // //   With prefix `path`
        // //   Without discarded edges.
        // for (index = index + 1; index < this.paths.length; ++index) {
        //     if (startsWith(this.paths[index].edges, prefix) &&
        //         validPath(this.paths[index])) {
        //         break;
        //     }
        // }
    }
}

class Graph2 {
    edgeScore: { [label: string]: number } = {};
    paths: Path[] = [];
    left = 'a';
    currentPath = 0;

    constructor(edgeList: Edge[][]) {
        // Index scores for all edges.
        for (const [start, edges] of edgeList.entries()) {
            for (const edge of edges) {
                const path = 
                    String.fromCharCode(97 + start) + 
                    String.fromCharCode(97 + start + edge.length);
                console.log(`${path}: ${edge.score}`);
                this.edgeScore[path] = edge.score;
            }
        }
        console.log();

        //
        // Index score for all legal paths.
        //

        // All paths start with vertex `a` and then pass through some combination
        // of 2^(n-1) other vertices.
        // Get number of vertex subsets.
        const n = edgeList.length;
        const pathCount = Math.pow(2, n - 1);
        for (let i = 0; i < pathCount; ++i) {
            const path = getPath(i, n);
            const score = this.scorePath(path);
            console.log(`graph2: ${i}: ${path}: ${score}`);
            this.paths.push({ vertices: path, score, discarded: false });
            // console.log(`graph2: ${i}: ${getPath(i, n)}`);
        }
        this.paths.sort( (a, b) => b.score - a.score);

        console.log('=================');

        for (const path of this.paths) {
            console.log(`graph3: ${path.vertices}: ${path.score}`);
        }
    }

    scorePath(path: string): number {
        let total = 0;
        for (let i = 1; i < path.length; ++i) {
            const start = path[i - 1];
            const end = path[i];
            const score = this.edgeScore[start + end];
            if (score) {
                total += score;
            }
            else {
                total = -Infinity;
                break;
            }
        }
        return total;
    }

    advance() {
        const path = this.paths[this.currentPath].vertices;
        if (this.left.length < path.length) {
            this.left = path.slice(0, this.left.length + 1);
        }
        return this.left;
    }

    retreat() {
        if (this.left.length > 0) {
            this.left = this.left.slice(0, this.left.length - 1);
        }
        return this.left;
    }

    discard() {
        const left = this.left;
        const prefix = this.left.slice(0, -1);

        for (const path of this.paths) {
            if (path.vertices.startsWith(left)) {
                path.discarded = true;
            }
        }
        // const prefix = this.paths[this.currentPath].vertices.slice(0, this.left.length - 1);
        for (let i = this.currentPath + 1; i < this.paths.length; ++i) {
            const path = this.paths[i];
            if (path.vertices.startsWith(prefix) &&
                !path.discarded) {
                this.currentPath = i;
                this.left = path.vertices.slice(0, prefix.length + 1);
                // this.left = this.paths[this.currentPath].vertices.slice(0, prefix.length + 1);
                break;
            }
        }
        return this.left;
    }
}

function printBestPath(graph: Graph) {
    const path = [...graph.left, ...graph.right];

    let score = 0;
    const vertices = [ 0 ];
    for (const edge of path) {
        vertices.push(vertices[vertices.length - 1] + edge.length);
        score += edge.score;
    }
//    console.log(`${vertices.join('-')}: ${score}`);
    console.log(`  graph: ${vertices.map(n => String.fromCharCode(97 + n)).join('')}: ${score}`);
}

function printPath(path: Edge[]) {
    let score = 0;
    const vertices = [ 0 ];
    for (const edge of path) {
        vertices.push(vertices[vertices.length - 1] + edge.length);
        score += edge.score;
    }
    console.log(`  ${vertices.map(n => String.fromCharCode(97 + n)).join('')}: ${score}`);
}


function getPath(b: number, n: number) {
    // All paths start at `a` (vertex 0).
    let path = 'a';
    
    // Add remaining verties specified by bits in `b`.
    // Lower order bit corresponds to vertex 1.
    let vertex = 1;
    let bits = b;
    
    while (bits !== 0) {
        if (bits % 2 === 1) {
            path += String.fromCharCode(97 + vertex);
        }
        bits = (bits >> 1);
        ++vertex;
    }

    // All paths end at same, final vertex.
    path += String.fromCharCode(97 + n);

    return path;
}

// function go2(n: number) {
//     // Get number of vertex sets.
//     // All paths start with vertex `a` and then pass through some combination
//     // of 2^(n-1) other vertices.
//     const pathCount = Math.pow(2, n - 1);
//     for (let i = 0; i < pathCount; ++i) {
//         console.log(`${i}: ${getPath(i, n)}`);
//     }
// }

function check(g: Graph, g3: Graph3) {
//    printBestPath(g);
    const prefix = g.left.slice(0, -1);
    const path = [...g.left, ...g.right];
    const path3 = g3.nextBestPath(prefix);
    printPath(path);

    if (path3) {
        printPath(path3.edges);
        if (pathsEqual(path, path3.edges)) {
            console.log('  Paths equal');
        }
        else {
            console.log('  Different paths');
        }
    }
    else {
        console.log('  Path is null');
    }
}

function go() {
    const edgeList: Edge[][] = [];
    for (let i = 0; i < 6; ++i) {
        const edges: Edge[] = [];
        for (let j = 1; i + j <= 6; ++j) {
            const label = i * 10 + i + j;
            const length = j;
            const score = j - Math.pow(0.2, j);
            console.log(`label=${label}, length=${length}, score=${score} avg=${score/length}`);
            edges.push({score, length, label});
        }
        edgeList.push(edges);
    }

    const graph = new Graph(edgeList);
    // const graph2 = new Graph2(edgeList);
    const graph3 = new Graph3(edgeList);

    printBestPath(graph);

    console.log('=================');

//    let path = graph2.left;
//    let path: Path2;
    // let prefix: Edge[];
    // let path: Path2 | null;

    console.log('advance()');
    graph.advance();
    check(graph, graph3);

    console.log('discard()');
    graph.discard();
    check(graph, graph3);

    console.log('discard()');
    graph.discard();
    check(graph, graph3);

    console.log('discard()');
    graph.discard();
    check(graph, graph3);

    console.log('discard()');
    graph.discard();
    check(graph, graph3);

    console.log('discard()');
    graph.discard();
    check(graph, graph3);

    console.log('discard()');
    graph.discard();
    check(graph, graph3);
    // prefix = graph.advance().slice(0, -1);
    // path = graph3.nextBestPath(prefix);
    // if (path) {
    //     console.log(`  graph3: ${path.score}`);
    // }
    // else {
    //     console.log(`graph3: no path`);
    // }
    // printBestPath(graph);
    // // path = graph2.advance();

    // console.log('discard()');
    // path = graph2.discard();
    // console.log(`  graph2: ${path}`);
    // graph.discard();
    // printBestPath(graph);

    // console.log('discard()');
    // path = graph2.discard();
    // console.log(`  graph2: ${path}`);
    // graph.discard();
    // printBestPath(graph);

    // console.log('discard()');
    // path = graph2.discard();
    // console.log(`  graph2: ${path}`);
    // graph.discard();
    // printBestPath(graph);

    // console.log('discard()');
    // path = graph2.discard();
    // console.log(`  graph2: ${path}`);
    // graph.discard();
    // printBestPath(graph);

    // console.log('discard()');
    // path = graph2.discard();
    // console.log(`  graph2: ${path}`);
    // graph.discard();
    // printBestPath(graph);

    // console.log('discard()');
    // path = graph2.discard();
    // console.log(`  graph2: ${path}`);
    // graph.discard();
    // printBestPath(graph);

    // console.log('retreat(false)');
    // graph.retreat(false);
    // graph.advance();
    // printBestPath(graph);

    // console.log('retreat(true) - BUG: not implemented');
    // graph.retreat(true);
    // graph.advance();
    // printBestPath(graph);
}

// go2(6);
go();
