import { Matcher } from '../matchers';
import { DefaultTermModel, TermModel, Tokenizer, Token, TokenizerAlias } from '.';

export interface Alias {
    token: Token;
    text: string;
    matcher: Matcher;
}

export class Lexicon {
    private domains: Domain[];
    termModel: TermModel;

    constructor() {
        this.domains = [];
        this.termModel = new DefaultTermModel();
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
}

class Domain {
    private termModel: TermModel;

    private tokenizerAliases: TokenizerAlias[];
    private ownTerms: Set<number>;
    private downstreamTerms: Set<number>;

    constructor(aliases: IterableIterator<Alias>, termModel: TermModel) {
        this.termModel = termModel;

        this.tokenizerAliases = [];
        this.ownTerms = new Set<number>();
        this.downstreamTerms = new Set<number>();

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
        this.downstreamTerms = new Set<number>();
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

    isDownstreamTerm = (hash: number) => {
        return this.termModel.isTokenHash(hash) ||
            this.termModel.isNumberHash(hash) ||
            this.downstreamTerms.has(hash);
    }
}
