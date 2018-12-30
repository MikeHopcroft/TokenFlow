import { DynamicGraph, Edge, GraphWalker, StaticGraph } from '../src/graph';

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

function* walk(g: GraphWalker): IterableIterator<string> {
    while (true) {
        g.advance();

        if (g.complete()) {
            yield(getPath(g));
        }
        else {
            yield* walk(g);
        }

        g.retreat(true);
    
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
}

// Tests
//  *1. Both walks produce same results.
//   2. Right number of paths.
//   3. All paths different.
//   4. Paths in correct order.
//   5. Correct number of paths.
//  *6. Exact sequence of paths.
//
// Checkpoint
// Restore


go();
