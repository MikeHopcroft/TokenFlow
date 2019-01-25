import * as Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';

import { levenshtein } from '../src/matchers';
import { generateAliases, itemMapFromYamlString, Item, NumberToken, NUMBERTOKEN, PID, Token, Tokenizer } from '../src/tokenizer';
import { Lexicon } from '../src';

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


type AnyToken =
    AttributeToken2 |
    EntityToken2 |
    IntentToken2 |
    // MultipleAttributeToken |
    NumberToken |
    QuantifierToken2
    // WordToken;
    ;

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
            name = `[INTENT:${token.name}]`;
            break;
        case QUANTIFIER2:
            name = `[QUANTIFIER:${token.value}]`;
            break;
        // case WORD:
        //     name = `[WORD:${token.text}]`;
        //     break;
        case NUMBERTOKEN:
            name = `[NUMBER: ${token.value}]`; 
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
    tokenizer: Tokenizer;

    constructor(
        entityFile: string,
        intentsFile: string,
        attributesFile: string,
        quantifiersFile: string,
        debugMode = false
    ) {
        this.tokenizer = new Tokenizer(new Set<string>(), undefined, debugMode);
        const lexicon = new Lexicon();

        // Attributes
        const attributes = aliasesFromYamlString(
            fs.readFileSync(attributesFile, 'utf8'),
            (item: Item) => ({
                type: ATTRIBUTE2,
                pid: item.pid,
                name: item.name
            }));
        lexicon.addDomain(attributes);

        // Entities
        const entities = aliasesFromYamlString(
            fs.readFileSync(entityFile, 'utf8'),
            (item: Item) => ({
                type: ENTITY2,
                pid: item.pid,
                name: item.name
            }));
        lexicon.addDomain(entities);

        // Quantifiers
        const quantifiers = aliasesFromYamlString(
            fs.readFileSync(quantifiersFile, 'utf8'),
            (item: Item) => ({
                type: QUANTIFIER2,
                value: item.pid
            }));
        lexicon.addDomain(quantifiers);

        // Intents
        const intents = aliasesFromYamlString(
            fs.readFileSync(intentsFile, 'utf8'),
            (item: Item) => ({
                type: INTENT2,
                pid: item.pid,
                name: item.name
            }));
        lexicon.addDomain(intents);
        
        lexicon.ingest(this.tokenizer);
    }

    processOneQuery(query: string) {
        const terms = query.split(/\s+/);
        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(terms);
        const path = graph.findPath([], 0);

        for (const edge of path) {
            const token = this.tokenizer.tokenFromEdge(edge);
            if (token) {
                console.log(`    ${tokenToString(token)}`);
            }
            else {
                console.log('    UNKNOWN');
            }
        }
    }
}

function go() {
    // unified_demo is intended to be a debugging tool invoked by a human
    // from the console. Therefore use human-readable console logging to stdout.
    // Also enable tf:* to see all alerts.
    Debug.enable('tf-interactive,tf:*');

    const unified = new Unified(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        true);

        unified.processOneQuery('I would like twenty silver two door convertibles with no tinted windows and extra fuzzy dice and four studded tires');

        // Example of "(twenty two) door" vs "twenty (two door)"
        // unified.processOneQuery('I would like twenty two door convertibles with tinted windows and fuzzy dice');

        // unified.processOneQuery('I would like twenty three convertible with tinted windows and fuzzy dice');
        // unified.processOneQuery('twenty three');
}

go();