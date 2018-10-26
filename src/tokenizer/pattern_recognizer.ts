import * as yaml from 'js-yaml';
import * as AJV from 'ajv';
import { generateAliases, PID, Recognizer, StemmerFunction, Token, TokenFactory, Tokenizer, UNKNOWN } from '.';

export interface Item {
    pid: PID;
    name: string;
    aliases: string[];
}

export interface ItemCollection {
    items: Item[];
}

// Schema from https://www.npmjs.com/package/typescript-json-schema
const schemaForItemCollection = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "Item": {
            "properties": {
                "aliases": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                },
                "name": {
                    "type": "string"
                },
                "pid": {
                    "type": "number"
                }
            },
            "required": [
                "aliases",
                "name",
                "pid"
            ],
            "type": "object"
        }
    },
    "properties": {
        "items": {
            "items": {
                "$ref": "#/definitions/Item"
            },
            "type": "array"
        }
    },
    "required": [
        "items"
    ],
    "type": "object"
};

const ajv = new AJV();
const validator = ajv.compile(schemaForItemCollection);

export function itemMapFromYamlString(yamlText: string): Map<PID, Item> {
    const yamlRoot = yaml.safeLoad(yamlText) as ItemCollection;

    if (!validator(yamlRoot)) {
        const message = 'itemMapFromYamlString: yaml data does not conform to schema.';
        console.log(message);
        console.log(validator.errors);
        throw TypeError(message);
    }
    
    const map = new Map<PID, Item>();
    for (const item of yamlRoot.items) {
        map.set(item.pid, item);
    }

    return map;
}

export class PatternRecognizer<T extends Item> implements Recognizer {
    items: Map<PID, T>;
    tokenizer: Tokenizer;
    tokenFactory: TokenFactory<Token>;
    stemmer: (word: string) => string;

    constructor(
        items: Map<PID, T>,
        tokenFactory: TokenFactory<Token>,
        downstreamWords: Set<string>,
        stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
        debugMode = false
    ) {
        this.items = items;
        this.tokenizer = new Tokenizer(downstreamWords, stemmer, debugMode);
        this.stemmer = this.tokenizer.stemTerm;
        this.tokenFactory = tokenFactory;

        // Ingest index.
        let aliasCount = 0;
        for (const [pid, item] of this.items) {
            for (const aliasPattern of item.aliases) {
                for (const alias of generateAliases(aliasPattern)) {
                    this.tokenizer.addItem(item.pid, alias);
                    aliasCount++;
                }
            }
        }

        // TODO: print name of tokenizer here?
        console.log(`${this.items.size} items contributed ${aliasCount} aliases.`);
    }

    apply = (tokens: Token[]) => {
        const result: Token[] = [];
        for (const token of tokens) {
            if (token.type === UNKNOWN) {
                const path = this.tokenizer.processQuery(token.text);
                const terms = token.text.split(/\s+/);
        
                const matches = this.tokenizer.tokenizeMatches(terms, path, this.tokenFactory);
                result.push(...matches);
            }
            else {
                result.push(token);
            }
        }
        return result;
    }

    terms = () => {
        const terms = new Set<string>();
        for (const [pid, item] of this.items) {
            for (const alias of item.aliases) {
                const words = alias.split(/\s+/);
                for (const word of words) {
                    terms.add(word);
                }
            }
        }
        return terms;
    }
}