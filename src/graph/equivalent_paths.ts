import { Edge } from './types';

// Given a path of Edges through a graph, represented by the list of Edges
// originating at each vertex, enumerate all equivalent paths.
//
// Two paths are said to be equivalent if they differ only in Edges that have
// the same length and score as the Edges in the original path.
//
// This function is intended to help enumerate different interpretations
// of homonyms.
export function *equivalentPaths(edgeLists: Edge[][], path: Edge[]): IterableIterator<Edge[]> {
    yield* equivalentPathsRecursion(edgeLists, 0, 0, path, []);
}

function *equivalentPathsRecursion(
    edgeLists: Edge[][],
    e: number,
    v: number,
    path: Edge[],
    prefix: Edge[]
): IterableIterator<Edge[]> {
    if (prefix.length === path.length) {
        // Recursive base case. Return the list of edges.
        yield [...prefix];
    }
    else {
        // Recursive case. Enumerate all equivalent edges from this vertex.
        const currentEdge = path[e];
        const vertex = edgeLists[v];
        for (const edge of vertex) {
            if (edge.score === currentEdge.score &&
                edge.length === currentEdge.length)
            {
                prefix.push(edge);
                yield* equivalentPathsRecursion(
                    edgeLists,
                    e + 1,
                    v + currentEdge.length,
                    path,
                    prefix
                );
                prefix.pop();
            }
        }
    }
}
