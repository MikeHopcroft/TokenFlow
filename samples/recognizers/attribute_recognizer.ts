import * as fs from 'fs';
import {
    categoryBuilder,
    CompositeToken,
    itemMapFromYamlString,
    Item,
    PatternRecognizer,
    PID,
    StemmerFunction,
    Token,
    Tokenizer
} from '../../src';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends CompositeToken {
    type: ATTRIBUTE;
    children: Token[];
    id: PID;
    name: string;
}

export const MULTIPLE_ATTRIBUTE: unique symbol = Symbol('MULTIPLE_ATTRIBUTE');
export type MULTIPLE_ATTRIBUTE = typeof MULTIPLE_ATTRIBUTE;

export interface MultipleAttributeToken extends CompositeToken {
    type: MULTIPLE_ATTRIBUTE;
    children: Token[];
    pids: PID[];
    name: string;
}

export type AttributeRecognizer = PatternRecognizer<Item>;

let currentPID = 900000000;
function pidAllocator() {
    return currentPID++;
}

export function CreateAttributeRecognizer(
    attributeFile: string,
    downstreamWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): AttributeRecognizer {
    const input = itemMapFromYamlString(fs.readFileSync(attributeFile, 'utf8'));

    const {items, categories} = categoryBuilder(input, pidAllocator);

    const tokenFactory = (id: PID, children: Token[]): AttributeToken | MultipleAttributeToken => {
        const item = items.get(id);

        const pids = categories.get(id);
        if (pids !== undefined) {
            return { type: MULTIPLE_ATTRIBUTE, pids, name: "MULTIPLE", children };
        }
        else {
            let name = "UNKNOWN";
            if (item) {
                name = item.name;
            }
            return { type: ATTRIBUTE, id, name, children };   
        }
    };

    return new PatternRecognizer(items, tokenFactory, downstreamWords, stemmer, false, true, debugMode);
}
