import { Logger } from '../utilities';

import {
    generateAliases,
    Item,
    PID,
    PIDToken,
    PIDTOKEN,
    Recognizer,
    StemmerFunction,
    Token,
    TokenFactory,
    Tokenizer,
    WORD,
    WordToken
} from '.';

import { Lexicon, Alias } from '../aliases';
import { levenshtein } from '../matchers';

export class PatternRecognizer<ITEM extends Item> implements Recognizer {
    logger: Logger;

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
        debugMode: boolean
    ) {
        this.logger = new Logger('tf:PatternRecognizer');

        this.tokenizer = new Tokenizer(downstreamWords, stemmer, debugMode);
        this.stemmer = this.tokenizer.stemTerm;
        this.tokenFactory = tokenFactory;

        // Ingest index.
        const aliases: Alias[] = [];
        let aliasCount = 0;
        for (const [pid, item] of items) {
            for (const aliasPattern of item.aliases) {
                for (const alias of generateAliases(aliasPattern)) {
                    aliases.push({
                        token: ({ type: PIDTOKEN, pid } as PIDToken),
                        text: alias,
                        matcher: levenshtein            
                    });
                    this.ownTerms.add(alias);
                    aliasCount++;
                }
            }
        }
        const lexicon = new Lexicon();
        lexicon.addDomain(aliases[Symbol.iterator]());
        lexicon.ingest(this.tokenizer);

        // TODO: print name of tokenizer here?
        this.logger.log(`${items.size} items contributed ${aliasCount} aliases.`);
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