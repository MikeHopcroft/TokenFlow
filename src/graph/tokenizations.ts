import { Token } from '../tokenizer';

import { allPaths, maximalPaths } from './maximal_paths';
import { Edge, Span } from './types';

export function *allTokenizations(
    edgeLists: Edge[][]
): IterableIterator<Array<Token & Span>> {
    for (const path of allPaths(edgeLists)) {
        let start = 0;
        const tokens = new Array<Token & Span>();
        for (const edge of path) {
            tokens.push({
                ...edge.token,
                start,
                length: edge.length
            });
            start += edge.length;
        }
        yield tokens;
    }
}

export function *maximalTokenizations(
    edgeLists: Edge[][]
): IterableIterator<Array<Token & Span>> {
    for (const path of maximalPaths(edgeLists)) {
        let start = 0;
        const tokens = new Array<Token & Span>();
        for (const edge of path) {
            tokens.push({
                ...edge.token,
                start,
                length: edge.length
            });
            start += edge.length;
        }
        yield tokens;
    }
}
