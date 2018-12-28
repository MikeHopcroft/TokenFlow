export interface Edge {
    score: number;
    length: number;
    label: number;

    // TODO: do we really want to expose the discarded property to the caller?
    discarded?: boolean;
}

export interface Graph {
    edgeLists: Edge[][];

    findPath(prefix: Edge[], start: number): Edge[];
    lastVertex(): number;
}