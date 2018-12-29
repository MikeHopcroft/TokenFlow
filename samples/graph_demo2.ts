import { DynamicGraph, Edge, Graph, GraphWalker, StaticGraph } from '../src/graph';

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

let level = 0;
let counter = 0;

function* walk(g: GraphWalker): IterableIterator<string> {
    // let paths: string[] = [];
    ++level;
    const indent = ' '.repeat(level *2);

    while (true) {
        g.advance();
        // console.log(`${indent}advance() to ${getPath(g)}`);

        if (g.complete()) {
            ++counter;
            // console.log(`${indent}############### ${counter}: ${getPath(g)}`);

            // paths.push(`${indent}${counter}: ${getPath(g)}`);
            // yield(`${indent}${counter}: ${getPath(g)}`);
            yield(getPath(g));
        }
        else {
            // console.log(`${indent}walk()`);

            // paths = paths.concat(walk(g));
            yield* walk(g);
        }

        g.retreat(true);
        // console.log(`${indent}retreat() to ${getPath(g)}`);
    
        if (!g.discard()) {
            // console.log(`${indent}discard() to defaultEdge ${getPath(g)}`);
            break;
        }
        else {
            // console.log(`${indent}discard() to ${getPath(g)}`);
        }
    }

    --level;
    // return paths;
}

function makeEdgeList(vertexCount: number): Edge[][] {
    const edgeList: Edge[][] = [];

    for (let i = 0; i < vertexCount; ++i) {
        const edges: Edge[] = [];
        for (let j = 2; i + j <= vertexCount; ++j) {
            const label = i * 10 + i + j;
            const length = j;
            const score = j - Math.pow(0.2, j);
            // console.log(`label=${label}, length=${length}, score=${score} avg=${score/length}`);
            edges.push({ score, length, label });
        }
        edgeList.push(edges);
    }

    return edgeList;
}

function go() {
    // console.log('Newer code');
    
    // const graph = new DynamicGraph(edgeList);
    const edgeList1: Edge[][] = makeEdgeList(6);
    const graph1 = new StaticGraph(edgeList1);
    const walker1 = new GraphWalker(graph1);

    const edgeList2: Edge[][] = makeEdgeList(6);
    const graph2 = new DynamicGraph(edgeList2);
    const walker2 = new GraphWalker(graph2);

    const walk1 = walk(walker1);
    const walk2 = walk(walker2);

    while (true)
    {
        const step1 = walk1.next();
        const step2 = walk2.next();

        if (step1.done !== step2.done) {
            console.log('Sequences have different lengths.');
            break;
        }

        if (step1.done || step2.done) {
            break;
        }

        if (step1.value === step2.value) {
            console.log(`${step1.value} === ${step2.value}`);
        }
        else {
            console.log(`${step1.value} !== ${step2.value}`);
            break;
        }
    }


    // const paths = [...walk(walker1)];

    // console.log('======================');

    // console.log('xxx=================');
    // for (const [index, path] of paths.entries()) {
    //     console.log(`${index}: ${path}`);
    // }
    // console.log('yyy================');
}

go();
