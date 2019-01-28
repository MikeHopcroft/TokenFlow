import { Edge, DynamicGraph, Graph } from '../graph';
import { DiffResults, DownstreamTermPredicate, Matcher } from '../matchers';
import { NumberParser, NumberMatch } from '../numbers';
import { Token, NUMBERTOKEN, NumberToken, UNKNOWNTOKEN} from './tokens';
import { TermModel } from './term-model';
import { HASH, ID } from './types';
import { Logger, PeekableSequence } from '../utilities';

export interface TokenizerAlias {
    token: Token;
    text: string;
    terms: string[];
    stemmed: string[];
    hashes: number[];
    matcher: Matcher;
    isDownstreamTerm: DownstreamTermPredicate<number>;
}

export class Tokenizer {
    debugMode = true;
    logger: Logger;

    termModel: TermModel;
    numberParser: NumberParser | null = null;

    // NOTE: aliases is public for access by unit tests.
    // TODO: perhaps this should be protected instead? Then unit test
    // could derive subclass which can provide access.
    aliases: TokenizerAlias[] = [];

    private hashToText: { [hash: number]: string } = {};

    // NOTE: hashToFrequency is public for access by unit tests.
    hashToFrequency: { [hash: number]: number } = {};

    // NOTE: postings is public for access by unit tests.
    postings: { [hash: number]: ID[] } = {};


    constructor(
        termModel: TermModel,
        debugMode: boolean
    ) {
        this.logger = new Logger('tf:tokenizer');
        this.termModel = termModel;
        this.debugMode = debugMode;

        this.numberParser = new NumberParser(this.termModel.stemAndHash);
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Utility functions
    //
    ///////////////////////////////////////////////////////////////////////////
    private static isNeverDownstreamTerm(hash: number) {
        return false;
    }

    // Arrow function to allow use in map.
    decodeTerm = (hash: number): string => {
        if (hash in this.hashToText) {
            return this.hashToText[hash];
        }
        else {
            return `###HASH${hash}###`;
        }
    }

    tokenFromEdge = (edge: Edge): Token => {
        if (edge.isNumber) {
            return ({
                type: NUMBERTOKEN,
                value: edge.label
            } as NumberToken);
        }
        else if (edge.label === -1) {
            return {
                type: UNKNOWNTOKEN
            };
        }
        else {
            return this.aliases[edge.label].token;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Indexing a phrase
    //
    ///////////////////////////////////////////////////////////////////////////
    
    addItem(alias: TokenizerAlias) {
        // Internal id for this item. NOTE that the internal id is different
        // from the pid. The items "manual transmission" and "four on the floor"
        // share a pid, but have different ids.
        const id = this.aliases.length;

        this.aliases.push(alias);

        for (const [index, hash] of alias.hashes.entries()) {
            // Add this term to hash_to_text so that we can decode hashes later.
            if (!(hash in this.hashToText)) {
                this.hashToText[hash] = alias.stemmed[index];
            }

            // TODO: Consider removing code to compute frequencies.
            // Currently this code is unused. Would it be a good signal?
            // Update term frequency
            // DESIGN ALTERNATIVE: could use lengths of posting lists instead.
            if (hash in this.hashToFrequency) {
                this.hashToFrequency[hash]++;
            }
            else {
                this.hashToFrequency[hash] = 1;
            }

            // Add current item to posting list for this term.
            // This is the inverted index.
            if (hash in this.postings) {
                this.postings[hash].push(id);
            }
            else {
                this.postings[hash] = [id];
            }
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    //
    // Full-text matching and scoring algorithm follows.
    //
    ///////////////////////////////////////////////////////////////////////////

    // Arrow function to allow use in map.
    matchAndScore = (query: number[], alias: TokenizerAlias): { score: number, length: number } => {
        const prefix = alias.hashes;
        const match = alias.matcher(query, prefix, alias.isDownstreamTerm, this.termModel.isTokenHash);

        return this.score(query, prefix, alias.isDownstreamTerm, match);
    }

    score(query: number[], prefix: number[], isDownstreamTerm: DownstreamTermPredicate<number>, diff: DiffResults<number>) {
        const { match, cost, leftmostA, rightmostA, alignments, commonTerms } = diff;

        // Ratio of match length to match length + edit distance.
        // const matchFactor = match.length / (match.length + cost);
        // EXPERIMENTAL ALTERNATIVE to above.

        // let matchFactor = Math.max(0, match.length - cost) / match.length;
        // if (match.length === 1 && cost === 1 && common === 1) {
        //     matchFactor = 0.5;
        // }
        let matchFactor: number;
        const l = rightmostA + 1;
        if (l > cost) {
            matchFactor = (l - cost) / l;
        }
        else {
            matchFactor = 1 / (l + cost);
        }

        // if (match.length > cost) {
        //     matchFactor = (match.length - cost) / match.length;
        // }
        // else {
        //     matchFactor = match.length / (match.length + cost);
        // }

        // Ratio of match words common to query and prefix and length of match.
        // ISSUE: commonFactor will be less than 1.0 when words are repeated.
        const commonFactor = commonTerms.size / match.length;
        // EXPERIMENT: replace above line with one of the two following:
        // const commonFactor = common / (rightmostA + 1);
        // const commonFactor = common / rightmostA;

        const positionFactor = Math.max(match.length - leftmostA, 0) / match.length;

        // RATIONALE: don't want to boost the score for large values
        // of rightmostA that represent skipping over the middle of 
        // the query:
        //    query = 'a b c d e f g h i j k'
        //    prefix = 'a k'
        //    match = 'a k'
        // Similarly, don't want to reward skipping over the middle of the
        // prefix:
        //    query = 'a k'
        //    prefix = 'a b c d e f g h i j k'
        //    match = 'a k'
        // const lengthFactor = rightmostA + 1;
        // const lengthFactor = prefix.length;
        const lengthFactor = match.length;

        // This approach doesn't work because the match can contain trailing garbage.
        // Really need to count common terms that are not downstream words.
        // TODO: fix matcher to not return trailing garbage. Example:
        //   query: 'give me eight and add fog lights'
        //   prefix: 'eight track;
        //   match: 'eight and' instead of 'eight'
        // 
        // const nonDownstreamWordCount = match.reduce((count, term) => {
        //     if (this.hashedDownstreamWordsSet.has(term)) {
        //         return count;
        //     }
        //     else {
        //         return count + 1;
        //     }
        // }, 0);
        // const downstreamWordFactor = nonDownstreamWordCount / match.length;
        // TODO: Should this be terms common with match, instead of prefix?
        // const commonTerms = this.commonTerms(query, prefix);
        // const commonTerms = this.commonTerms(query.slice(0, rightmostA + 1), match);
        // const commonTerms = this.commonTerms(query.slice(0, rightmostA + 1), prefix.slice(0, match.length));
        const commonDownstreamWords = // this.commonDownstreamWords(commonTerms);
            new Set([...commonTerms].filter(isDownstreamTerm));

        let score = matchFactor * commonFactor * positionFactor * lengthFactor;
        // if (nonDownstreamWordCount === 0) {
        //     score = -1;
        // }

        // Exclude matches that are all downstream words, except those that
        // match every word in the prefix. This exception is important because
        // the stemming process cause an attribute word to collide with a
        // different entity word. In this cases, the entity should still be
        // allowed to match, if the match is perfect. Note that using a
        // lemmatizer instead of a stemmer could also help here.
        // const downstreamWordFactor = 
        //     (commonTerms.size - commonDownstreamWords.size) / commonTerms.size;
        // if (commonTerms.size === commonDownstreamWords.size &&
        //     commonTerms.size !== prefix.length) {
        //     score = -1;
        // }
        const downstreamWordFactor = 
            (commonTerms.size - commonDownstreamWords.size) / commonTerms.size;

        // NOTE: BUG BUG: The test, (common !== prefix.length), assumes that
        // the prefix does not have duplicated terms. Example: query = "a b",
        // and prefix = "a b b". Then commonTerms={a,b}, so common === 2,
        // even though prefix.length === 3. ACTUALLY: in diff.ts, common
        // is the number of exact matches, while commonTerms is the set of
        // exact matches (removing duplicates).
        if (commonTerms.size > 0 &&
            commonTerms.size === commonDownstreamWords.size &&
            commonTerms.size !== prefix.length) {
            score = -1;
        }

        // if (score <= 0.25) {
        //     score = -1;
        // }
        if (score <= 0.01) {
            score = -1;
        }

        if (this.debugMode) {
            const queryText = query.map(this.decodeTerm).join(' ');
            const prefixText = prefix.map(this.decodeTerm).join(' ');
            const matchText = match.map(this.decodeTerm).join(' ');
            this.logger.log(`      score=${score} mf=${matchFactor}, cf=${commonFactor}, pf=${positionFactor}, lf=${lengthFactor}, df=${downstreamWordFactor}`);
            this.logger.log(`      length=${match.length}, cost=${cost}, left=${leftmostA}, right=${rightmostA}, common=${commonTerms.size}`);
            this.logger.log(`      query="${queryText}"`);
            this.logger.log(`      prefix="${prefixText}"`);
            this.logger.log(`      match="${matchText}"`);
            this.logger.log(`      query="${query}"`);
            this.logger.log(`      prefix="${prefix}"`);
            this.logger.log(`      match="${match}"\n`);

            if (prefixText === "four on the floor") {
                console.log("four on the floor");
                isDownstreamTerm(3162218338);
                isDownstreamTerm(3162218338);
            }
        }
        return { score, length: rightmostA + 1 };
    }

    generateGraph(hashed: HASH[], stemmed: string[]): Graph {
        const edgeLists: Edge[][] = [];

        for (const [index, hash] of hashed.entries()) {
            // TODO: exclude starting at hashes that are conjunctions.

            let edges: Edge[] = [];
            const tail = hashed.slice(index);

            if (hash in this.postings) {
                // This query term is in at least one product term.
                if (this.debugMode) {
                    const stemmedText = stemmed.slice(index).join(' ');
                    this.logger.log(`  "${stemmedText}" SCORING:`);
                }

                // Get all of the items containing this query term.
                // Items not containing this term will match better
                // at other starting positions.
                const items = this.postings[hash];

                // Generate score for all of the items, matched against
                // the tail of the query.
                // const tail = hashed.slice(index);
                const scored = items.map((item) =>
                    ({ ...this.matchAndScore(tail, this.aliases[item]), label: item, isNumber: false }));

                edges = edges.concat(scored);
            }

            if (this.numberParser) {
                const input = new PeekableSequence<number>(tail[Symbol.iterator]());
                const output: NumberMatch[] = [];
                this.numberParser.parse(input, output);
                for (const value of output) {
                    const match = hashed.slice(index, index + value.length);
                    const commonTerms = new Set<number>(match);
    
                    const diff: DiffResults<number> = {
                        match,
                        cost: 0,
                        leftmostA: 0,
                        rightmostA: value.length - 1,
                        alignments: value.length,
                        commonTerms
                    };
    
                    const { score, length } = this.score(hashed, match, Tokenizer.isNeverDownstreamTerm, diff);
                    edges.push({ score, length, label: value.value, isNumber: true });
                    // console.log(`NUMBER: value: ${value.value}, length: ${length}, score: ${score}`);
                }
            }

            if (edges.length === 0) {
                if (this.debugMode) {
                    this.logger.log(`  "${stemmed[index]}" UNKNOWN`);
                }
            }

            const sorted = edges.sort((a, b) => b.score - a.score);
            edgeLists.push(sorted);
        }

        const graph = new DynamicGraph(edgeLists);
        return graph;
    }
}
