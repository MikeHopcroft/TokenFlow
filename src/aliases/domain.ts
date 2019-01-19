// import { DownstreamTermPredicate, Matcher } from '../matchers';
// import { PID, StemAndHash, Token, Tokenizer, TokenFactory } from '../tokenizer';

// export interface Alias {
//     // pid: PID;
//     text: string;
//     token: Token;
//     matcher: Matcher;
// }

// export interface DomainAlias extends Alias {
//     // matcher: Matcher;
//     isDownstreamTerm: DownstreamTermPredicate<number>;
//     // factory: TokenFactory;
// }

// export class Domain {
//     descriptors: Alias[];
//     ownTerms: Set<number>;

//     private downstreamTerms: Set<number>;
//     // private factory: TokenFactory;

//     // TODO: REVIEW: user can't provide any old stemAndHash.
//     //   1. Must be the same across all domains - so perhaps it comes from the lexicon.
//     //   2. Must be able to generate special hashes for numbers. One rationale is that
//     //      the system must be able to recognize numbers as downstream terms.
//     //      this.isDownstreamTerm(), DomainAlias.isDownstreamTerm().
//     constructor(aliases: Alias[], factory: TokenFactory, stemAndHash: StemAndHash) {
//         this.ownTerms = new Set<number>();
//         this.downstreamTerms = new Set<number>();
//         // this.factory = factory;
//         this.descriptors = aliases;

//         for (const alias of aliases) {
//             this.ownTerms.add(stemAndHash(alias.text));
//         }
//     }

//     addDownstreamTerms(domains: Domain[]): void {
//         const downstream = new Set<number>();
//         for (const domain of domains) {
//             if (domain !== this) {
//                 for (const hash of domain.ownTerms) {
//                     downstream.add(hash);
//                 }
//             }
//         }
//     }

//     *aliases(): IterableIterator<DomainAlias> {
//         for (const descriptor of this.descriptors) {
//             yield {
//                 ...descriptor,
//                 isDownstreamTerm: this.isDownstreamTerm
//                 // factory: this.factory
//             };
//         }
//     }

//     private isDownstreamTerm(hash: number): boolean {
//         // TODO: what about numbers as downstream terms?
//         return this.downstreamTerms.has(hash);
//     }
// }
