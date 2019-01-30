import { Hash } from '../tokenizer';
import { PeekableSequence } from '../utilities';

export interface NumberMatch {
    value: number;
    length: number;
}

export interface NumberParser {
    parse(input: PeekableSequence<number>, output: NumberMatch[]): void;
    addTermsToSet(terms: Set<string>): void;
}
