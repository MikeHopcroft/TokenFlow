import { Token2 } from '.';

export interface Recognizer2 {
    apply: (tokens: Token2[]) => Token2[];
    stemmer: (term: string) => string;
    terms: () => Set<string>;
}
