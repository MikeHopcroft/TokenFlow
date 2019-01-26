import * as Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';

import { Edge } from '../src/graph';
import { levenshtein } from '../src/matchers';
import { generateAliases, itemMapFromYamlString, Item, NumberToken, NUMBERTOKEN, PID, Recognizer, Token, Tokenizer, WordToken, WORD, UnknownToken } from '../src/tokenizer';
import { Lexicon } from '../src';
import { RelevanceSuite } from '../src/relevance_suite';

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
    QuantifierToken2 |
    UnknownToken
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
            // name = `[INTENT:${token.name}]`;
            name = `[${token.name}]`;
            break;
        case QUANTIFIER2:
            name = `[QUANTIFIER:${token.value}]`;
            break;
        // case WORD:
        //     name = `[WORD:${token.text}]`;
        //     break;
        case NUMBERTOKEN:
            name = `[NUMBER:${token.value}]`; 
            break;
        case NUMBERTOKEN:
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

export class Unified implements Recognizer {
    lexicon: Lexicon;
    tokenizer: Tokenizer;

    constructor(
        entityFile: string,
        intentsFile: string,
        attributesFile: string,
        quantifiersFile: string,
        debugMode = false
    ) {
        this.tokenizer = new Tokenizer(new Set<string>(), undefined, debugMode);
        this.lexicon = new Lexicon();

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

    processOneQuery(query: string) {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const path = graph.findPath([], 0);

        for (const edge of path) {
            const token = this.tokenizer.tokenFromEdge(edge);
            console.log(`    ${tokenToString(token)}`);
            // if (token) {
            //     console.log(`    ${tokenToString(token)}`);
            // }
            // else {
            //     console.log('    UNKNOWN');
            // }
        }
    }

    //
    // Recognizer methods
    //
    apply(tokens: Token[]): Token[]
    {
        const terms = tokens.map( token => {
            if (token.type === WORD) {
                // TODO: Would be nice not to type assert WordToken here.
                // Need to do it because there could be multiple Token2 with
                // type equal to WORD.
                return (token as WordToken).text;
            }
            else {
                // Generate name for token from its symbol.
                // TODO: document that names cannot contain spaces, special chars, etc.
                // Parens, square brackets, commas.
                const symbol = token.type.toString();
                return `@${symbol.slice(7, symbol.length - 1)}`;
            }
        });
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const path = graph.findPath([], 0);

        return this.tokenizeMatches(tokens, path);
    }

    tokenizeMatches = (tokens: Token[], path: Edge[]) => {
        let termIndex = 0;
        const output: Token[] = [];
        for (const edge of path) {
            const token = this.tokenizer.tokenFromEdge(edge);
            if (token) {
                output.push(token);
                termIndex += edge.length;
            }
            else {
                output.push(tokens[termIndex++]);
            }
        }
        return output;
    }

    stemmer(term: string): string
    {
        throw TypeError('No implemented.');
    }

    terms(): Set<string> {
        throw TypeError('No implemented.');
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
        false);

        unified.processOneQuery('I would like twenty silver two door convertibles with no tinted windows and extra fuzzy dice and four studded tires');

        // Example of "(twenty two) door" vs "twenty (two door)"
        // unified.processOneQuery('I would like twenty two door convertibles with tinted windows and fuzzy dice');

        // unified.processOneQuery('I would like twenty three convertible with tinted windows and fuzzy dice');
        // unified.processOneQuery('twenty three');
}

function go2() {
    const showPassedCases = false;
    const testFile = path.join(__dirname, './data/cars/tests2.yaml');

    Debug.enable('tf-interactive,tf:*');

    const unified = new Unified(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        false);

    // Blank line to separate console spew from pipeline constructor.
    console.log();

    const suite = RelevanceSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    // return suite.run(unified, tokenToString, showPassedCases);
    return suite.run2(unified.lexicon, unified.tokenizer, tokenToString, true);
}

go2();
