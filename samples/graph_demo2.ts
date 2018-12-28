import { DynamicGraph, Edge, Graph, GraphWalker, StaticGraph } from '../src/graph';
import { getRawInput } from 'readline-sync';

let level = 0;
let counter = 0;

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


function walk(g: GraphWalker): string[] {
    let paths: string[] = [];
    ++level;
    const indent = ' '.repeat(level *2);

    while (true) {
        g.advance();
        console.log(`${indent}advance() to ${getPath(g)}`);

        if (g.complete()) {
            ++counter;
            console.log(`${indent}############### ${counter}: ${getPath(g)}`);
            paths.push(`${indent}${counter}: ${getPath(g)}`);
        }
        else {
            console.log(`${indent}walk()`);
            paths = paths.concat(walk(g));
        }

        g.retreat(true);
        console.log(`${indent}retreat() to ${getPath(g)}`);
    
        if (!g.discard()) {
            console.log(`${indent}discard() to defaultEdge ${getPath(g)}`);
            break;
        }
        else {
            console.log(`${indent}discard() to ${getPath(g)}`);
        }
    }

    --level;
    return paths;
}

function go() {
    const edgeList: Edge[][] = [];
    for (let i = 0; i < 6; ++i) {
        const edges: Edge[] = [];
        for (let j = 2; i + j <= 6; ++j) {
            const label = i * 10 + i + j;
            const length = j;
            const score = j - Math.pow(0.2, j);
            console.log(`label=${label}, length=${length}, score=${score} avg=${score/length}`);
            edges.push({ score, length, label });
        }
        edgeList.push(edges);
    }

    console.log('New code');

    // const graph = new DynamicGraph(edgeList);
    const graph = new StaticGraph(edgeList);
    const walker = new GraphWalker(graph);

    console.log('======================');
    const paths = walk(walker);

    console.log('xxx=================');
    for (const path of paths) {
        console.log(path);
    }
    console.log('yyy================');
}

go();
