import { Token } from "../tokenizer";

export interface Edge {
    score: number;
    length: number;
    token: Token;
    // label: number;
    // isNumber: boolean;

    // TODO: consider whether to expose the discarded property to the caller.
    discarded?: boolean;
}

export interface Span {
    start: number;
    length: number;
}

export interface Graph {
    edgeLists: Edge[][];

    // Attempts to find the highest scoring path that passes through a `start`
    // vertex that lies at the end of a path `prefix`. The path will not
    // make use of discarded edges. Returns [] if no path exists.
    // NOTE that implementations may ignore either `prefix` or `start`. 
    // It is the caller's responsibility to ensure the two values are
    // consistent. In other words, `start` must be the index of the last vertex
    // in `prefix`.
    findPath(prefix: Edge[], start: number): Edge[];

    // Returns the index of the last vertex in the graph.
    lastVertex(): number;

    // Returns the score of the current best path through the graph.
    score(): number;

    // TODO: consider adding method to clear discarded property on all edges.
}