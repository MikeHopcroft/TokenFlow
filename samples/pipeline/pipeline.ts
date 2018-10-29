import { CompositeRecognizer } from '../../src/recognizers';
import { Recognizer2, StemmerFunction, Token2, Tokenizer, WordToken, WORD, CompositeToken } from '../../src/tokenizer';

import { ATTRIBUTE, AttributeToken, CreateAttributeRecognizer } from '../recognizers';
import { ENTITY, CreateEntityRecognizer, EntityToken } from '../recognizers';
import { INTENT, CreateIntentRecognizer, IntentToken } from '../recognizers';
import { QUANTITY, CreateQuantityRecognizer, QuantityToken } from '../recognizers';
import { CreateNumberRecognizer } from '../recognizers';


type AnyToken =
    AttributeToken |
    EntityToken |
    IntentToken |
    QuantityToken |
    WordToken;

export function tokenToString(t: Token2) {
    const token = t as AnyToken;
    let name: string;
    switch (token.type) {
        case ATTRIBUTE:
            const attribute = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ATTRIBUTE:${attribute},${token.id}]`;
            break;
        case ENTITY:
            const entity = token.name.replace(/\s/g, '_').toUpperCase();
            name = `[ENTITY:${entity},${token.pid}]`;
            break;
        case INTENT:
            name = `[INTENT:${token.name}]`;
            break;
        case QUANTITY:
            name = `[QUANTITY:${token.value}]`;
            break;
        case WORD:
            name = `[WORD:${token.text}]`;
            break;
        default:
            name = `[UNKNOWN]:${t.type.toString()}`;
    }
    return name;
}

export function printToken(token: Token2, indent = 0) {
    const spaces = new Array(2* indent + 1).join(' ');
    if (token.type === WORD) {
        console.log(`${spaces}WORD: "${(token as WordToken).text}"`);
    }
    else {
        console.log(`${spaces}${tokenToString(token)}`);
        for (const child of (token as CompositeToken).children) {
            printToken(child, indent + 1);
        }
    }
}

export function printTokens(tokens: Token2[]) {
    for (const token of tokens) {
        printToken(token);
    }
    console.log();
}

export class Pipeline {
    attributeRecognizer: Recognizer2;
    entityRecognizer: Recognizer2;
    intentRecognizer: Recognizer2;
    numberRecognizer: Recognizer2;
    quantityRecognizer: Recognizer2;

    compositeRecognizer: CompositeRecognizer;

    constructor(
        entityFile: string,
        intentsFile: string,
        attributesFile: string,
        quantifierFile: string,
        stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
        debugMode = false
    ) {
        // DESIGN NOTE: The intents file includes patterns that reference the
        // @QUANTITY token. Treat this token as a downstream term so that we
        // won't get partial matching consisting solely of the @QUANTITY
        // token.
        const intentDownstreamWords = new Set(['@QUANTITY']);
        this.intentRecognizer = CreateIntentRecognizer(
            intentsFile,
            intentDownstreamWords,
            stemmer,
            debugMode);

        this.quantityRecognizer = CreateQuantityRecognizer(
            quantifierFile,
            new Set(),
            stemmer,
            debugMode);

        this.numberRecognizer = CreateNumberRecognizer();

        const attributeDownstreamWords = new Set([
            ...this.quantityRecognizer.terms(),
            ...this.numberRecognizer.terms()
        ]);

        this.attributeRecognizer = CreateAttributeRecognizer(
            attributesFile,
            attributeDownstreamWords,
            stemmer,
            debugMode);

        const entityDownstreamWords = new Set([
            ...this.intentRecognizer.terms(),
            ...this.quantityRecognizer.terms(),
            ...this.numberRecognizer.terms(),
            ...this.attributeRecognizer.terms()
        ]);

        this.entityRecognizer = CreateEntityRecognizer(
            entityFile,
            entityDownstreamWords,
            stemmer,
            debugMode);

        this.compositeRecognizer = new CompositeRecognizer(
            [
                this.entityRecognizer,
                this.attributeRecognizer,
                this.numberRecognizer,
                this.quantityRecognizer,
                this.intentRecognizer
            ],
            debugMode
        );
    }

    processOneQuery(query: string, debugMode = true) {
        const input = query.split(/\s+/).map( term => ({ type: WORD, text: term }));
        const tokens = this.compositeRecognizer.apply(input);
        return tokens;
    }
}
