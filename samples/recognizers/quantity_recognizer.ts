import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer2 } from '../../src/tokenizer';
import { CompositeToken, PID, StemmerFunction, Tokenizer, Token2 } from '../../src/tokenizer';

export const QUANTITY: unique symbol = Symbol('QUANTITY');
export type QUANTITY = typeof QUANTITY;

export interface QuantityToken extends CompositeToken {
    type: QUANTITY;
    children: Token2[];
    value: number;
}

export type QuantityRecognizer = PatternRecognizer2<Item>;

export function CreateQuantityRecognizer(
    quantityFile: string,
    downstreamWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): QuantityRecognizer {
    const items = itemMapFromYamlString(fs.readFileSync(quantityFile, 'utf8'));

    const tokenFactory = (id: PID, children: Token2[]): QuantityToken => {
        const item = items.get(id);

        let value = "UNKNOWN";
        if (item) {
            value = item.name;
        }
        return { type: QUANTITY, children, value: Number(value) };
    };

    return new PatternRecognizer2(items, tokenFactory, downstreamWords, stemmer, false, debugMode);
}
