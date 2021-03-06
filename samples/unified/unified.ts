import * as fs from 'fs';

import { generateAliases } from '../../src/alias-generator';
import { itemMapFromYamlString, Item, PID } from '../../src/items';
import {
    DownstreamTermPredicate,
    EqualityPredicate,
    exactPrefix,
    GenericEquality,
    levenshtein,
    Matcher,
    TokenPredicate
} from '../../src/matchers';

import {
    Hash,
    Lexicon,
    NumberToken,
    NUMBERTOKEN,
    Token,
    Tokenizer,
    UnknownToken,
    UNKNOWNTOKEN
} from '../../src/tokenizer';
import { maximalPaths } from '../../src';

export const ATTRIBUTE: unique symbol = Symbol('ATTRIBUTE');
export type ATTRIBUTE = typeof ATTRIBUTE;

export interface AttributeToken extends Token {
    type: ATTRIBUTE;
    pid: PID;
    name: string;
}

export const ENTITY: unique symbol = Symbol('ENTITY');
export type ENTITY = typeof ENTITY;

export interface EntityToken extends Token {
    type: ENTITY;
    pid: PID;
    name: string;
}

export const INTENT: unique symbol = Symbol('INTENT');
export type INTENT = typeof INTENT;

export interface IntentToken extends Token {
    type: INTENT;
    id: PID;
    name: string;
}

export const QUANTIFIER: unique symbol = Symbol('QUANTIFIER');
export type QUANTIFIER = typeof QUANTIFIER;

export interface QuantifierToken extends Token {
    type: QUANTIFIER;
    value: number;
}

export const WORD: unique symbol = Symbol('WORD');
export type WORD = typeof WORD;

export interface WordToken extends Token {
    type: WORD;
    text: string;
}

type AnyToken =
    AttributeToken |
    EntityToken |
    IntentToken |
    NumberToken |
    QuantifierToken |
    UnknownToken |
    WordToken;

export function tokenToString(t: Token) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ATTRIBUTE:${attribute},${token.pid}]`;
            break;
        case ENTITY:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ENTITY:${entity},${token.pid}]`;
            break;
        case INTENT:
            // name = `[INTENT:${token.name}]`;
            name = `[${token.name}]`;
            break;
        case QUANTIFIER:
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

type TokenFactory = (item: Item) => Token;

// An exact Matcher.
function exact(
    query: Hash[],
    prefix: Hash[],
    isDownstreamTerm: DownstreamTermPredicate<Hash>,
    isToken: TokenPredicate<Hash>,
    predicate: EqualityPredicate<Hash> = GenericEquality
) {
    return exactPrefix(query, prefix, false, isDownstreamTerm, isToken, predicate);
}

// A prefix matcher.
function prefix(
    query: Hash[],
    prefix: Hash[],
    isDownstreamTerm: DownstreamTermPredicate<Hash>,
    isToken: TokenPredicate<Hash>,
    predicate: EqualityPredicate<Hash> = GenericEquality
) {
    return exactPrefix(query, prefix, true, isDownstreamTerm, isToken, predicate);
}

// Returns the matching function specified by an expression of the form
//   ['exact' | 'prefix' | 'levenshtein' ':'] patten
// If no function is specified, defaults to levenshtein.
function matcherFromExpression(alias: string): Matcher {
    const index = alias.indexOf(':');
    if (index !== -1) {
        const left = alias.slice(0, index).trim();

        if (left === 'exact') {
            return exact;
        }
        else if (left === 'prefix') {
            return prefix;
        }
        else if (left === 'relaxed') {
            return levenshtein;
        }
        else {
            throw TypeError(`matcherFromAlias: Unknown matcher "${left}"`);
        }
    }

    return levenshtein;
}

// Returns the pattern portion of an expression of the form
//   ['exact' | 'prefix' | 'levenshtein' ':'] patten
function patternFromExpression(alias: string) {
    const index = alias.indexOf(':');
    if (index !== -1) {
        return alias.slice(index + 1);
    }
    return alias;
}

function* aliasesFromYamlString(yamlText: string, factory: TokenFactory) {
    const items = itemMapFromYamlString(yamlText);

    for (const item of items.values()) {
        for (const expression of item.aliases) {
            const matcher = matcherFromExpression(expression);
            const pattern = patternFromExpression(expression);
            for (const text of generateAliases(pattern)) {
                yield {
                    token: factory(item),
                    text,
                    matcher
                };
            }
        }
    }
}

function* aliasesFromStopwordString(stopwordsFileText: string) {
    const lines = stopwordsFileText.split(/\r?\n/);
    for (const line of lines) {
        const text = line.trim();
        yield {
            token: { type: UNKNOWNTOKEN },
            text,
            matcher: exact
        };
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
        stopwordsFile: string,
        debugMode = false
    ) {
        this.lexicon = new Lexicon();
        this.tokenizer = new Tokenizer(
            this.lexicon.termModel,
            this.lexicon.numberParser,
            debugMode
        );

        // Attributes
        const attributes = aliasesFromYamlString(
            fs.readFileSync(attributesFile, 'utf8'),
            (item: Item) => ({
                type: ATTRIBUTE,
                pid: item.pid,
                name: item.name
            }));
        this.lexicon.addDomain(attributes);

        // Entities
        const entities = aliasesFromYamlString(
            fs.readFileSync(entityFile, 'utf8'),
            (item: Item) => ({
                type: ENTITY,
                pid: item.pid,
                name: item.name
            }));
        this.lexicon.addDomain(entities);

        // Quantifiers
        const quantifiers = aliasesFromYamlString(
            fs.readFileSync(quantifiersFile, 'utf8'),
            (item: Item) => ({
                type: QUANTIFIER,
                value: item.pid
            }));
        this.lexicon.addDomain(quantifiers);

        // Intents
        const intents = aliasesFromYamlString(
            fs.readFileSync(intentsFile, 'utf8'),
            (item: Item) => ({
                type: INTENT,
                pid: item.pid,
                name: item.name
            }));
        this.lexicon.addDomain(intents);

        // Stopwords
        const stopwords = aliasesFromStopwordString(
            fs.readFileSync(stopwordsFile, 'utf8'));
        this.lexicon.addDomain(stopwords, false);

        
        this.lexicon.ingest(this.tokenizer);
    }

    processOneQuery(query: string): Token[] {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);

        const pathItem = maximalPaths(graph.edgeLists).next();
        if (pathItem.done) {
            const message = "No paths";
            throw TypeError(message);
        }

        const path = pathItem.value!;
        const tokens: Token[] = [];
        for (const [index, edge] of path.entries()) {
            let token = edge.token;
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
