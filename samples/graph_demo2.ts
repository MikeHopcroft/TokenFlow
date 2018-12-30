import { DynamicGraph, Edge, GraphWalker } from '../src/graph';

// Returns a string representation of the current path and its score.
// The path is rendered as a sequence of vertices, each of which is
// represented by the letters a, b, c, ...
function getPath(g: GraphWalker) {
    const path = [ ...g.left, ...g.right ];
    const current = g.current;
    let score = 0;
    const vertices = [0];
    let text = (current === 0) ? 'a*' : 'a';
    for (const edge of path) {
        const vertex = vertices[vertices.length - 1] + edge.length;
        vertices.push(vertex);
        text = text.concat(String.fromCharCode(97 + vertex));
        if (current === vertices[vertices.length - 1]) {
            text = text.concat('*');
        }
        score += edge.score;
    }
    return `${text}: ${score}`;
}

// Exercises the GraphWalker API to generates all paths in a graph.
function* walk(g: GraphWalker): IterableIterator<string> {
    while (true) {
        // Advance down next edge in current best path.
        g.advance();

        if (g.complete()) {
            // If the path is complete, ie it goes from the first vertex to the
            // last vertex, then yield the path.
            yield(getPath(g));
        }
        else {
            // Otherwise, walk further down the path.
            yield* walk(g);
        }

        // We've now explored all paths down this edge.
        // Retreat back to the previous vertex.
        g.retreat(true);
    
        // Then, attempt to discard the edge we just explored. If, after
        // discarding, there is no path to the end then break out of the loop.
        // Otherwise go back to the top to explore the new path.
        if (!g.discard()) {
            break;
        }
    }
}

function makeEdgeList(vertexCount: number): Edge[][] {
    const edgeList: Edge[][] = [];

    for (let i = 0; i < vertexCount; ++i) {
        const edges: Edge[] = [];
        for (let j = 2; i + j <= vertexCount; ++j) {
            const label = i * 10 + i + j;
            const length = j;
            const score = j - Math.pow(0.2, j);
            edges.push({ score, length, label });
        }
        edgeList.push(edges);
    }

    return edgeList;
}

function go() {
    const edgeList1: Edge[][] = makeEdgeList(6);
    const graph1 = new DynamicGraph(edgeList1);
    const walker1 = new GraphWalker(graph1);
    const walk1 = walk(walker1);
    const paths = [...walk1];
    console.log(paths);
}

go();
