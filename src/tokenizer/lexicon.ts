import { Matcher } from '../matchers';
import { EnglishNumberParser, NumberParser } from '../number-parser';
import { DefaultTermModel, Hash, TermModel } from './term-model';
import { Token } from './tokens';
import { Tokenizer, TokenizerAlias } from './tokenizer';

export interface Alias {
    token: Token;
    text: string;
    matcher: Matcher;
}

export class Lexicon {
    termModel: TermModel;
    numberParser: NumberParser;
    private domains: Domain[];

    constructor() {
        this.domains = [];
        this.termModel = new DefaultTermModel();
        this.numberParser = new EnglishNumberParser(this.termModel.stemAndHash);
    }

    addDomain(aliases: IterableIterator<Alias>) {
        this.domains.push(new Domain(aliases, this.termModel));
    }

    ingest(tokenizer: Tokenizer) {
        for (const domain of this.domains) {
            domain.addDownstreamTerms(this.domains);
            domain.ingest(tokenizer);
        }
    }

    terms(): Set<string> {
        const terms = new Set<string>();
        this.numberParser.addTermsToSet(terms);
        for (const domain of this.domains) {
            domain.addTermsToSet(terms);
        }
        return terms;
    }
}

class Domain {
    private termModel: TermModel;

    private tokenizerAliases: TokenizerAlias[];
    private ownTerms: Set<Hash>;
    private downstreamTerms: Set<Hash>;

    constructor(aliases: IterableIterator<Alias>, termModel: TermModel) {
        this.termModel = termModel;

        this.tokenizerAliases = [];
        this.ownTerms = new Set<Hash>();
        this.downstreamTerms = new Set<Hash>();

        for (const alias of aliases) {
            const terms = alias.text.split(/\s+/);
            const stemmed = terms.map(termModel.stem);
            const hashes = stemmed.map(termModel.hashTerm);

            this.tokenizerAliases.push({
                ...alias,
                terms,
                stemmed,
                hashes,
                isDownstreamTerm: this.isDownstreamTerm
            });

            for (const hash of hashes) {
                this.ownTerms.add(hash);
            }
        }
    }

    addDownstreamTerms(domains: Domain[]): void {
        this.downstreamTerms = new Set<Hash>();
        for (const domain of domains) {
            if (domain !== this) {
                for (const hash of domain.ownTerms) {
                    this.downstreamTerms.add(hash);
                }
            }
        }
    }

    ingest(tokenizer: Tokenizer) {
        for (const alias of this.tokenizerAliases) {
            tokenizer.addItem(alias);
        }
    }

    isDownstreamTerm = (hash: Hash) => {
        return this.termModel.isTokenHash(hash) ||
            // TODO: REVIEW: don't think we want isNumberHash here.
            // Want hashes of NumberParser.terms().
            this.termModel.isNumberHash(hash) ||
            this.downstreamTerms.has(hash);
    }

    addTermsToSet(terms: Set<string>) {
        for (const alias of this.tokenizerAliases) {
            for (const term of alias.terms) {
                terms.add(term);
            }
        }
    }
}
