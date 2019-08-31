import { Matcher } from '../matchers';
import { EnglishNumberParser, NumberParser } from '../number-parser';

import { DefaultTermModel, Hash, ITermModel } from './term-model';
import { IIngestor, TokenizerAlias } from './tokenizer';
import { Token } from './tokens';

export interface Alias {
    token: Token;
    text: string;
    matcher: Matcher;
}

export class Lexicon {
    termModel: ITermModel;
    numberParser: NumberParser;
    private domains: Domain[];

    constructor(termModel?: ITermModel) {
        this.domains = [];

        if (termModel) {
            this.termModel = termModel;
        } else {
            this.termModel = new DefaultTermModel();
        }
        
        this.numberParser = new EnglishNumberParser(this.termModel.stemAndHash);
    }

    addDomain(aliases: IterableIterator<Alias>, forIngestion = true) {
        this.domains.push(new Domain(aliases, this.termModel, forIngestion));
    }

    ingest(index: IIngestor) {
        for (const domain of this.domains) {
            domain.addDownstreamTerms(this.numberParser.ownHashedTerms(), this.domains);
            domain.ingest(index);
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
    private termModel: ITermModel;

    private tokenizerAliases: TokenizerAlias[];
    private ownTerms: Set<Hash>;
    private downstreamTerms: Set<Hash>;
    private forIngestion: boolean;

    constructor(
        aliases: IterableIterator<Alias>,
        termModel: ITermModel,
        forIngestion = true
    ) {
        this.termModel = termModel;
        this.forIngestion = forIngestion;

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

    addDownstreamTerms(numberTerms: Set<Hash>, domains: Domain[]): void {
        if (this.forIngestion) {
            this.downstreamTerms = new Set<Hash>(numberTerms);
            for (const domain of domains) {
                if (domain !== this) {
                    for (const hash of domain.ownTerms) {
                        this.downstreamTerms.add(hash);
                    }
                }
            }
        }
    }

    ingest(index: IIngestor) {
        if (this.forIngestion) {
            for (const alias of this.tokenizerAliases) {
                index.addItem(alias);
            }
        }
    }

    isDownstreamTerm = (hash: Hash) => {
        // DESIGN NOTE: technically speaking, we don't need the check for
        // isNumberHash() because the text should not contain Arabic numerals.
        // Putting check in to be able to be more flexible with the input.
        return this.termModel.isTokenHash(hash) ||
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
