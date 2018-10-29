import {
    generateAliases,
    Item,
    PID,
    Recognizer2,
    StemmerFunction,
    Token2,
    TokenFactory2,
    Tokenizer,
    WORD,
    WordToken
} from '.';

export class PatternRecognizer2<ITEM extends Item> implements Recognizer2 {
    items: Map<PID, ITEM>;
    tokenizer: Tokenizer;
    tokenFactory: TokenFactory2;
    stemmer: (word: string) => string;

    constructor(
        items: Map<PID, ITEM>,
        tokenFactory: TokenFactory2,
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

    apply = (tokens: Token2[]) => {
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
        const path = this.tokenizer.processQuery2(terms);
        const matches = this.tokenizer.tokenizeMatches2(tokens, path, this.tokenFactory);
        return matches;
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