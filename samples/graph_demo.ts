import { Edge, Graph } from '../src';

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
        const defaultEdge = { score: 0, length: 1, label: -1 };
        const augmented = graph.map( (edges: Edge[]) => [
            defaultEdge, ...edges
        ]);
        this.createPaths([], augmented);
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
        let index;
        for (index = 0; index < this.paths.length; ++index) {
            if (startsWith(this.paths[index].edges, prefix) &&
                validPath(this.paths[index].edges)) {
                return this.paths[index];
            }
        }

        return null;
    }
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

function getPath(path: Edge[], current: number) {
    const vertices = [ 0 ];
    let text = (current === 0) ? 'a*': 'a';
    for (const edge of path) {
        const vertex = vertices[vertices.length - 1] + edge.length;
        vertices.push(vertex);
        text = text.concat(String.fromCharCode(97 + vertex));
        if (current ===  vertices[vertices.length - 1]) {
            text = text.concat('*');
        }
    }
    return text;
}

function scorePath(path: Edge[]): number {
    let score = 0;
    const vertices = [ 0 ];
    for (const edge of path) {
        score += edge.score;
    }
    return score;
}

function check(g: Graph, g3: Graph3) {
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
            if (scorePath(path) === path3.score) {
                console.log('  Different paths - same scores');
            }
            else {
                console.log('  Different paths - different scores');
            }
        }
    }
    else {
        console.log('  Path is null');
    }
}

let level = 0;
let counter = 0;

function walk(g: Graph): string[] {
    let paths: string[] = [];
    ++level;
    const indent = ' '.repeat(level *2);
    // console.log(`${indent}${level}`);
    g.advance();
    const p1 = getPath([ ...g.left, ...g.right ], g.current);
    console.log(`${indent}advance() to ${p1}`);
    while (true) {
        const path = [ ...g.left, ...g.right ];
        // console.log(`${indent}counter = ${counter}`);
        // printPath(path);
        if (g.left[g.left.length - 1] === g.defaultEdge) {
            console.log(`${indent}defaultEdge`);
            break;
        }
        if (!g.complete()) {
            console.log(`${indent}walk()`);
            paths = paths.concat(walk(g));
        }
        else {
            ++counter;
            console.log(`${indent}${counter}: ${getPath(path, g.current)}`);
            paths.push(`${indent}${counter}: ${getPath(path, g.current)}`);
        }
        g.discard();
        const p2 = getPath([ ...g.left, ...g.right ], g.current);
        console.log(`${indent}discard() to ${p2}`);
        }
    g.retreat(true);
    const p3 = getPath([ ...g.left, ...g.right ], g.current);
    console.log(`${indent}retreat() to ${p3}`);
    // }
    // else {
    //     console.log('  complete');
    // }
    --level;
    return paths;
}

function go() {
    const edgeList: Edge[][] = [];
    for (let i = 0; i < 6; ++i) {
        const edges: Edge[] = [];
        for (let j = 1; i + j <= 6; ++j) {
            const label = i * 10 + i + j;
            const length = j;
            const score = j - Math.pow(0.2, j);
            // console.log(`label=${label}, length=${length}, score=${score} avg=${score/length}`);
            edges.push({score, length, label});
        }
        edgeList.push(edges);
    }

    const graph = new Graph(edgeList);

    console.log('======================');
    const paths = walk(graph);
    for (const path of paths) {
        console.log(path);
    }

    // const graph3 = new Graph3(edgeList);

    // console.log('=================');

    // console.log('advance()');
    // graph.advance();
    // check(graph, graph3);

    // console.log('discard()');
    // graph.discard();
    // check(graph, graph3);

    // console.log('discard()');
    // graph.discard();
    // check(graph, graph3);

    // console.log('discard()');
    // graph.discard();
    // check(graph, graph3);

    // console.log('discard()');
    // graph.discard();
    // check(graph, graph3);

    // console.log('discard()');
    // graph.discard();
    // check(graph, graph3);

    // console.log('discard()');
    // graph.discard();
    // check(graph, graph3);



    // console.log('retreat(false)');
    // graph.retreat(false);
    // graph.advance();
    // printBestPath(graph);

    // console.log('retreat(true) - BUG: not implemented');
    // graph.retreat(true);
    // graph.advance();
    // printBestPath(graph);
}

go();
