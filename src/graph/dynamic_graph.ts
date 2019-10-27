import { theUnknownToken } from '../tokenizer';
import { Edge, Graph } from './types';

export class DynamicGraph implements Graph {
    edgeLists: Edge[][];

    constructor(edgeLists: Edge[][]) {
        // Add "unknown" edges from each vertex to the next.
        this.edgeLists = edgeLists.map((edges: Edge[]) => [
            {
                score: 0,
                length: 1,
                token: theUnknownToken,
            }, ...edges
        ]);

        // TODO: is the following really necessary?
        // Add outgoing edges for final vertex.
        // this.edgeLists.push([]);
    }
}
