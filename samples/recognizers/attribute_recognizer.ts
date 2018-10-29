import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer2 } from '../../src/tokenizer';
import { CompositeToken, PID, StemmerFunction, Token2, Tokenizer } from '../../src/tokenizer';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends CompositeToken {
    type: ATTRIBUTE;
    children: Token2[];
    id: PID;
    name: string;
}

export type AttributeRecognizer = PatternRecognizer2<Item>;

export function CreateAttributeRecognizer(
    attributeFile: string,
    downstreamWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): AttributeRecognizer {
    const items = itemMapFromYamlString(fs.readFileSync(attributeFile, 'utf8'));

    const tokenFactory = (id: PID, children: Token2[]): AttributeToken => {
        const item = items.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: ATTRIBUTE, id, name, children };
    };

    return new PatternRecognizer2(items, tokenFactory, downstreamWords, stemmer, false, debugMode);
}
