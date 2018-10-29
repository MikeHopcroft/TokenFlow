import { Token, Token2 } from '.';

export interface Recognizer {
    apply: (tokens: Token[]) => Token[];
    stemmer: (term: string) => string;
    terms: () => Set<string>;
}

export interface Recognizer2 {
    apply: (tokens: Token2[]) => Token2[];
    stemmer: (term: string) => string;
    terms: () => Set<string>;
}
