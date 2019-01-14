import { DynamicGraph, Edge, GraphWalker } from '../src/graph';

// This file demonstrates using the GraphWalker API to enumerate all possible
// paths through a graph corresponding to the term sequence, `a-b-c-d-e-f`,
// followed by a terminating vertex `g`. Each term in the graph has edges to
// all successive terms. The edges are weighted to that a longer edge is always
// preferred to any combination of shorter edges.

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

// Creates an edge list representing a graph with `number` vertices.
// Each vertex has edges to all successive vertices. Edges are scored so that
// longer edges are always preferred over any combination of shorter edges.
function makeEdgeList(vertexCount: number): Edge[][] {
    const edgeList: Edge[][] = [];

    for (let vertex = 0; vertex < vertexCount; ++vertex) {
        const edges: Edge[] = [];
        for (let length = 2; vertex + length <= vertexCount; ++length) {
            const label = vertex * 10 + vertex + length;

            // Choose score so that longer edge is always preferred over any
            // combination of shorter edges.
            const score = length - Math.pow(0.2, length);

            edges.push({ score, length, label, isNumber: false });
        }
        edgeList.push(edges);
    }

    return edgeList;
}

function go() {
    const edgeList: Edge[][] = makeEdgeList(6);
    const graph = new DynamicGraph(edgeList);
    const walker = new GraphWalker(graph);
    const paths = [...walk(walker)];
    console.log(paths);
}

go();
