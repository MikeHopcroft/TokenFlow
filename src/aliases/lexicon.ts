// import { Domain, DomainAlias } from './domain';

// interface StemAndHash2 {
//     // TODO: method to stem without hashing?
//     convertText: (text: string) => number;
//     convertNumber: (value: number) => number;
//     isNumberHash: (hash: number) => boolean;
// }

// // type StemAndHash = (text: string) => number;

// export class Lexicon {
//     private stemAndHash: StemAndHash2;
//     private domains: Domain[] = [];

//     constructor(stemAndHash: StemAndHash2) {
//         this.stemAndHash = stemAndHash;
//         // this.domains = domains;

//         // Set downstream terms.
//         for (const domain of domains) {
//             domain.addDownstreamTerms(domains);
//         }
//     }



//     *aliases(): IterableIterator<DomainAlias> {
//         for (const domain of this.domains) {
//             yield* domain.aliases();
//         }
//     }
// }