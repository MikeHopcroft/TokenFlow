import {
    generateAliases,
    Item,
    PID,
    Recognizer,
    StemmerFunction,
    Token,
    TokenFactory,
    Tokenizer,
    WORD,
    WordToken
} from '.';

export class PatternRecognizer<ITEM extends Item> implements Recognizer {
    items: Map<PID, ITEM>;
    tokenizer: Tokenizer;
    tokenFactory: TokenFactory;
    stemmer: (word: string) => string;
    ownTerms = new Set<string>();

    constructor(
        items: Map<PID, ITEM>,
        tokenFactory: TokenFactory,
        downstreamWords: Set<string>,
        stemmer: StemmerFunction = Tokenizer.defaultStemTerm,
        addTokensToDownstream: boolean,
        relaxedMatching: boolean,
        debugMode: boolean
    ) {
        this.items = items;
        this.tokenizer = new Tokenizer(downstreamWords, stemmer, relaxedMatching, debugMode);
        this.stemmer = this.tokenizer.stemTerm;
        this.tokenFactory = tokenFactory;

        // Ingest index.
        let aliasCount = 0;
        for (const [pid, item] of this.items) {
            for (const aliasPattern of item.aliases) {
                for (const alias of generateAliases(aliasPattern)) {
                    this.tokenizer.addItem(item.pid, alias, addTokensToDownstream);
                    this.ownTerms.add(alias);
                    aliasCount++;
                }
            }
        }

        // TODO: print name of tokenizer here?
        console.log(`${this.items.size} items contributed ${aliasCount} aliases.`);
    }

    apply = (tokens: Token[]) => {
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
        const path = this.tokenizer.processQuery(terms);
        const matches = this.tokenizer.tokenizeMatches(tokens, path, this.tokenFactory);
        return matches;
    }

    terms = () => {
        return this.ownTerms;
    }
}