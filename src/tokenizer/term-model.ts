import { v3 } from 'murmurhash';
import { newStemmer, Stemmer as SnowballStemmer } from 'snowball-stemmers';

export type Hash = number;

// NOTE: disabling tslint rule locally because TSLint only offers the choice of
// all interfaces start with 'I' or no interfaces start with 'I'. On this
// project, we use the 'I' prefix for interfaces that are like abstract base
// classes, but not interfaces that are POJO structs.
// tslint:disable-next-line:interface-name
export interface ITermModel {
    breakWords: (text: string) => string[];
    stem: (text: string) => string;
    stemAndHash: (test: string) => Hash;
    hashTerm: (text: string) => Hash;
    hashNumber: (value: number) => Hash;
    isNumberHash: (hash: Hash) => boolean;
    isTokenHash: (hash: Hash) => boolean;
}

export type WordBreakerFunction = (text: string) => string[];
export type StemmerFunction = (word: string) => string;

export class DefaultTermModel {
    private static snowballStemmer = newStemmer('english');

    // Murmurhash seed.
    private seed = 0;

    private static lower32 = Math.pow(2, 32);
    private static minNumberHash = 1 * DefaultTermModel.lower32;
    private static minTokenHash = 2 * DefaultTermModel.lower32;

    breakWords: WordBreakerFunction;
    private stemmer: StemmerFunction;

    constructor(
        extensions?: {
            breaker?: WordBreakerFunction,
            stemmer?: StemmerFunction
        }
    ) {
        this.breakWords = DefaultTermModel.defaultBreaker;
        this.stemmer = DefaultTermModel.snowballStemmer.stem;
        if (extensions) {
            this.breakWords = extensions.breaker || this.breakWords;
            this.stemmer = extensions.stemmer || this.stemmer;
        }
    }

    stem = (term: string): string => {
        if (term.startsWith('@')) {
            // This term is a token reference. Do not lowercase or stem.
            return term;
        }
        else {
            // This is a regular term. Lowercase then stem.
            return this.stemmer(term.toLowerCase());
        }
    }

    stemAndHash = (term: string): Hash => {
        return this.hashTerm(this.stem(term));
    }

    hashTerm = (term: string): Hash => {
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

    hashNumber = (value: number): Hash => {
        return value + DefaultTermModel.minNumberHash;
    }

    isNumberHash = (hash: Hash): boolean => {
        return hash >= DefaultTermModel.minNumberHash && hash < DefaultTermModel.minTokenHash;
    }

    isTokenHash = (hash: Hash): boolean => {
        return hash >= DefaultTermModel.minTokenHash;
    }

    static defaultBreaker(text: string): string[] {
        return text.split(/\s+/);
    }
}
