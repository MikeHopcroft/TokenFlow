import * as fs from 'fs';
import { itemMapFromYamlString, Item, PatternRecognizer2 } from '../../src/tokenizer';
import { CompositeToken, PID, StemmerFunction, Token2, Tokenizer } from '../../src/tokenizer';

export const INTENT: unique symbol = Symbol('INTENT');
export type INTENT = typeof INTENT;

export interface IntentToken extends CompositeToken {
    type: INTENT;
    children: Token2[];
    id: PID;
    name: string;
}

export type IntentRecognizer = PatternRecognizer2<Item>;

export function CreateIntentRecognizer(
    intentFile: string,
    downstreamWords: Set<string>,
    stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
    debugMode = false
): IntentRecognizer {
    const items = itemMapFromYamlString(fs.readFileSync(intentFile, 'utf8'));

    const tokenFactory = (id: PID, children: Token2[]): IntentToken => {
        const item = items.get(id);

        let name = "UNKNOWN";
        if (item) {
            name = item.name;
        }
        return { type: INTENT, id, name, children };
    };

    return new PatternRecognizer2(items, tokenFactory, downstreamWords, stemmer, debugMode);
}
