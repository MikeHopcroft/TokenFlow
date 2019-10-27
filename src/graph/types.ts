import { Token } from "../tokenizer";

export interface Edge {
    score: number;
    length: number;
    token: Token;
}

export interface Span {
    start: number;
    length: number;
}

export interface Graph {
    edgeLists: Edge[][];
}