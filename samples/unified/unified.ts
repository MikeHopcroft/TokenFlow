import * as fs from 'fs';

import { generateAliases } from '../../src/alias-generator';
import { itemMapFromYamlString, Item, PID } from '../../src/items';
import { levenshtein } from '../../src/matchers';
import {
    Lexicon,
    NumberToken,
    NUMBERTOKEN,
    Token,
    Tokenizer,
    UnknownToken,
    UNKNOWNTOKEN
} from '../../src/tokenizer';

export const ATTRIBUTE2: unique symbol = Symbol('ATTRIBUTE2');
export type ATTRIBUTE2 = typeof ATTRIBUTE2;

export interface AttributeToken2 extends Token {
    type: ATTRIBUTE2;
    pid: PID;
    name: string;
}

export const ENTITY2: unique symbol = Symbol('ENTITY2');
export type ENTITY2 = typeof ENTITY2;

export interface EntityToken2 extends Token {
    type: ENTITY2;
    pid: PID;
    name: string;
}

export const INTENT2: unique symbol = Symbol('INTENT2');
export type INTENT2 = typeof INTENT2;

export interface IntentToken2 extends Token {
    type: INTENT2;
    id: PID;
    name: string;
}

export const QUANTIFIER2: unique symbol = Symbol('QUANTIFIER2');
export type QUANTIFIER2 = typeof QUANTIFIER2;

export interface QuantifierToken2 extends Token {
    type: QUANTIFIER2;
    value: number;
}

export const WORD: unique symbol = Symbol('WORD');
export type WORD = typeof WORD;

export interface WordToken extends Token {
    type: WORD;
    text: string;
}

type AnyToken =
    AttributeToken2 |
    EntityToken2 |
    IntentToken2 |
    NumberToken |
    QuantifierToken2 |
    UnknownToken |
    WordToken;

export function tokenToString(t: Token) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE2:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ATTRIBUTE:${attribute},${token.pid}]`;
            break;
        case ENTITY2:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ENTITY:${entity},${token.pid}]`;
            break;
        case INTENT2:
            // name = `[INTENT:${token.name}]`;
            name = `[${token.name}]`;
            break;
        case QUANTIFIER2:
            name = `[QUANTIFIER:${token.value}]`;
            break;
        case WORD:
            name = `[WORD:${token.text}]`;
            break;
        case NUMBERTOKEN:
            name = `[NUMBER:${token.value}]`; 
            break;
        case UNKNOWNTOKEN:
            name = `[UNKNOWN]`; 
            break;
        default:
            {
                const symbol = t.type.toString();
                name = `[${symbol.slice(7, symbol.length - 1)}]`;
            }
    }
    return name;
}

type TokenFactory2 = (item: Item) => Token;

function* aliasesFromYamlString(yamlText: string, factory: TokenFactory2) {
    const items = itemMapFromYamlString(yamlText);

    for (const [pid, item] of items) {
        for (const aliasPattern of item.aliases) {
            for (const alias of generateAliases(aliasPattern)) {
                yield {
                    token: factory(item),
                    text: alias,
                    matcher: levenshtein
                };
            }
        }
    }
}

export class Unified {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    constructor(
        entityFile: string,
        intentsFile: string,
        attributesFile: string,
        quantifiersFile: string,
        debugMode = false
    ) {
        this.lexicon = new Lexicon();
        this.tokenizer = new Tokenizer(this.lexicon.termModel, debugMode);

        // Attributes
        const attributes = aliasesFromYamlString(
            fs.readFileSync(attributesFile, 'utf8'),
            (item: Item) => ({
                type: ATTRIBUTE2,
                pid: item.pid,
                name: item.name
            }));
        this.lexicon.addDomain(attributes);

        // Entities
        const entities = aliasesFromYamlString(
            fs.readFileSync(entityFile, 'utf8'),
            (item: Item) => ({
                type: ENTITY2,
                pid: item.pid,
                name: item.name
            }));
        this.lexicon.addDomain(entities);

        // Quantifiers
        const quantifiers = aliasesFromYamlString(
            fs.readFileSync(quantifiersFile, 'utf8'),
            (item: Item) => ({
                type: QUANTIFIER2,
                value: item.pid
            }));
        this.lexicon.addDomain(quantifiers);

        // Intents
        const intents = aliasesFromYamlString(
            fs.readFileSync(intentsFile, 'utf8'),
            (item: Item) => ({
                type: INTENT2,
                pid: item.pid,
                name: item.name
            }));
        this.lexicon.addDomain(intents);
        
        this.lexicon.ingest(this.tokenizer);
    }

    processOneQuery(query: string): Token[] {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const path = graph.findPath([], 0);

        const tokens: Token[] = [];
        for (const [index, edge] of path.entries()) {
            let token = this.tokenizer.tokenFromEdge(edge);
            if (token.type === UNKNOWNTOKEN) {
                const end = index + 1;
                const start = end - edge.length;
                token = ({
                    type: WORD,
                    text: terms.slice(start, end).join('_').toUpperCase()
                } as WordToken);
            }
            tokens.push(token);
        }

        return tokens;
    }
}
