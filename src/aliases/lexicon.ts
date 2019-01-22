import { newStemmer, Stemmer as SnowballStemmer } from 'snowball-stemmers';
import { v3 } from 'murmurhash';

import { Matcher } from '../matchers';
import { Tokenizer, Token, TokenizerAlias } from '../tokenizer';

export type Hash = number;

export interface TermModel {
    stem: (text: string) => string;
    hashTerm: (text: string) => Hash;
    hashNumber: (value: number) => Hash;
    isNumberHash: (hash: Hash) => boolean;
    isTokenHash: (hash: Hash) => boolean;
}

export class DefaultTermModel {
    private static snowballStemmer = newStemmer('english');

    // Murmurhash seed.
    private seed = 0;

    private static lower32 = Math.pow(2, 32);
    private static minNumberHash = 1 * DefaultTermModel.lower32;
    private static minTokenHash = 2 * DefaultTermModel.lower32;


    stem = (term: string) => {
        if (term.startsWith('@')) {
            // This term is a token reference. Do not lowercase or stem.
            return term;
        }
        else {
            // This is a regular term. Lowercase then stem.
            return DefaultTermModel.snowballStemmer.stem(term.toLowerCase());
        }
    }

    hashTerm = (term: string) => {
        // DESIGN NOTE: murmurhash returns 32-bit hashes.
        // Encode natural numbers x as x + (1 * 2^32).
        // Encode tokens as hash(token) + (2 * 2^32)
        // This allows a simple test to determine whether a hash
        // is the hash of a number, the hash of a token, or the
        // hash of a term.
        if (term.startsWith('@')) {
            // This is a token reference. Hash, then set high order DWORD to 2.
            return v3(term, this.seed) + DefaultTermModel.minTokenHash;
        }
        else if (/^\d+$/.test(term)) {
            // This is a number. Hash is just number with high order DWORD = 1.
            return this.hashNumber(Number(term));
        }
        else {
            // This is a regular term. Just hash to produce a non-negative 32-bit value.
            const hash = v3(term, this.seed);
            if (hash >= DefaultTermModel.minNumberHash) {
                throw TypeError(`DefaultTermModel.hashTerm: murmurhash returned value greater than ${DefaultTermModel.minNumberHash - 1}`);
            }
            return hash;
        }
    }

    hashNumber = (value: number) => {
        return value + DefaultTermModel.minNumberHash;
    }

    isNumberHash = (hash: Hash) => {
        return hash >= DefaultTermModel.minNumberHash && hash < DefaultTermModel.minTokenHash;
    }

    isTokenHash = (hash: Hash) => {
        return hash >= DefaultTermModel.minTokenHash;
    }
}

export interface Alias {
    token: Token;
    text: string;
    matcher: Matcher;
}

export class Lexicon {
    private domains: Array<IterableIterator<Alias>>;
    private termModel: TermModel;

    constructor() {
        this.domains = [];
        this.termModel = new DefaultTermModel();
    }

    addDomain(aliases: IterableIterator<Alias>) {
        this.domains.push(aliases);
    }

    ingest(tokenizer: Tokenizer) {
        const domains: Domain[] = [];
        for (const aliases of this.domains) {
            domains.push(new Domain(aliases, this.termModel));
        }

        for (const domain of domains) {
            domain.addDownstreamTerms(domains);
            domain.ingest(tokenizer);
        }
    }
}

class Domain {
    private tokenizerAliases: TokenizerAlias[];
    private ownTerms: Set<number>;
    private downstreamTerms: Set<number>;

    // TODO: correct implementations
    // private stemTermInternal: (text: string) => string;
    // private hashTerm: (text: string) => number;

    constructor(aliases: IterableIterator<Alias>, termModel: TermModel) {
        this.tokenizerAliases = [];
        this.ownTerms = new Set<number>();
        this.downstreamTerms = new Set<number>();

        // TODO: correct implementations
        // this.stemTermInternal = (text: string) => text;
        // this.hashTerm = (text: string) => 0;

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
            tokenizer.addItem3(alias, true);
        }
    }

    isDownstreamTerm = (hash: number) => {
        return this.ownTerms.has(hash);
    }
}
