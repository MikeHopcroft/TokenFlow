import { Token } from '.';

export interface Recognizer {
    apply: (tokens: Token[]) => Token[];
    stemmer: (term: string) => string;
    terms: () => Set<string>;
}
