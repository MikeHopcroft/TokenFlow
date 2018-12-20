import { Edge, Graph } from '../src';

function printBestPath(graph: Graph) {
    const path = [...graph.left, ...graph.right];

    let score = 0;
    const vertices = [ 0 ];
    for (const edge of path) {
        vertices.push(vertices[vertices.length - 1] + edge.length);
        score += edge.score;
    }
    console.log(`${vertices.join('-')}: ${score}`);
}

function go() {
    const edgeList: Edge[][] = [];
    for (let i = 0; i < 6; ++i) {
        const edges: Edge[] = [];
        for (let j = 1; i + j < 6; ++j) {
            const label = i * 10 + i + j;
            const length = j;
            const score = j - Math.pow(0.2, j);
            console.log(`label=${label}, length=${length}, score=${score} avg=${score/length}`);
            edges.push({score, length, label});
        }
        edgeList.push(edges);
    }

    const graph = new Graph(edgeList);

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

go();
