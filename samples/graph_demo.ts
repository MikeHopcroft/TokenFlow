import { allPaths, Edge, maximalPaths } from '../src/graph';
import { Token } from '../src/tokenizer';

// This file demonstrates using the maximalPaths() and allPaths to enumerate
// paths through a graph corresponding to the term sequence, `a-b-c-d-e-f`,
// followed by a terminating vertex `g`. Each term in the graph has edges to
// all successive terms. The edges are weighted to that a longer edge is always
// preferred to any combination of shorter edges.

const WORD_TOKEN: unique symbol = Symbol('WORD_TOKEN');
type WORD_TOKEN = typeof WORD_TOKEN;

interface WordToken extends Token {
    type: WORD_TOKEN;
    value: string;
}

function wordToken(value: string): WordToken {
    return {
        type: WORD_TOKEN,
        value
    };
}

// Creates an edge list representing a graph with `number` vertices.
// Each vertex has edges to all successive vertices. Edges are scored so that
// longer edges are always preferred over any combination of shorter edges.
function makeEdgeList(vertexCount: number): Edge[][] {
    const edgeList: Edge[][] = [];

    for (let vertex = 0; vertex < vertexCount; ++vertex) {
        const edges: Edge[] = [];
        // const maxLength = vertexCount - vertex;
        for (let length = 1; vertex + length <= vertexCount; ++length) {
            const label = vertex * 10 + vertex + length;
            const token = wordToken(`${vertex} to ${vertex + length}`);

            // Choose score so that longer edge is always preferred over any
            // combination of shorter edges.
            const score = length - Math.pow(0.2, length);

            edges.push({ score, length, token });
        }
        edgeList.push(edges);
    }

    return edgeList;
}

function printPath(path: Edge[]) {
    for (const edge of path) {
        console.log(`  score: ${edge.score}, length: ${edge.length}, label: ${(edge.token as WordToken).value}`);
    }
}

function printGraph(edgeLists: Edge[][]) {
    for (const [i, edges] of edgeLists.entries()) {
        console.log(`Vertex ${i}:`);
        for (const edge of edges) {
            console.log(`  score: ${edge.score}, length: ${edge.length}, label: ${(edge.token as WordToken).value}`);
        }
    }
}

function scorePath(path: Edge[]) {
    let score = 0;
    for (const edge of path) {
        score += edge.score;
    }
    return score;
}

function go() {
    const edgeLists: Edge[][] = makeEdgeList(6);

    console.log("Graph:");
    printGraph(edgeLists);

    console.log('');

    const paths = [...maximalPaths(edgeLists)];
    console.log('Maximally scoring paths:');
    for (const [i, path] of paths.entries()) {
        console.log(`Path ${i}: ${scorePath(path)}`);
        printPath(path);
    }

    console.log('');

    const paths2 = [...allPaths(edgeLists)];
    console.log('All paths:');
    for (const [i, path] of paths2.entries()) {
        console.log(`Path ${i}: ${scorePath(path)}`);
        printPath(path);
    }
}

go();
