import { Edge, Graph } from '../src';

class Graph2 {
    edgeScore: { [label: string]: number } = {};

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
            // console.log(`graph2: ${i}: ${getPath(i, n)}`);
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
    console.log(`${vertices.map(n => String.fromCharCode(97 + n)).join('')}: ${score}`);
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

function go2(n: number) {
    // Get number of vertex sets.
    // All paths start with vertex `a` and then pass through some combination
    // of 2^(n-1) other vertices.
    const pathCount = Math.pow(2, n - 1);
    for (let i = 0; i < pathCount; ++i) {
        console.log(`${i}: ${getPath(i, n)}`);
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
    const graph2 = new Graph2(edgeList);

    printBestPath(graph);

    graph.advance();

    graph.discard();
    printBestPath(graph);

    graph.discard();
    printBestPath(graph);

    graph.discard();
    printBestPath(graph);

    graph.discard();
    printBestPath(graph);

    graph.discard();
    printBestPath(graph);

    graph.discard();
    printBestPath(graph);

    console.log('retreat(false)');
    graph.retreat(false);
    graph.advance();
    printBestPath(graph);

    console.log('retreat(true) - BUG: not implemented');
    graph.retreat(true);
    graph.advance();
    printBestPath(graph);
}

go2(6);
go();
