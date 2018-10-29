// import { PID, Recognizer2, Token2, TokenFactory2, UNKNOWN, WORD, WordToken } from '../../src/tokenizer';
// import { PeekableSequence } from '../../src/utilities';

// import { INTENT, IntentToken } from './intent_recognizer';
// import { QUANTITY } from './quantity_recognizer';

// ///////////////////////////////////////////////////////////////////////////////
// //
// // FixupRecognizer is an example of a recognizer that combines certain
// // sequences of tokens into a new token. This recognizer looks for a
// // QUANTITY token, followed by an UNKNOWN token whose text starts with
// // `of them`. When it finds this pattern, it generates an INTENT token
// // with pid 100010 and the text of the QUANTITY token, followed by
// // `of them`. An UNKNOWN token with the remaining UNKNOWN text may also
// // be generated.
// //
// // NOTE that the goal of this sample is to demonstrate token manipulation.
// // Real code would need to deal with stemming and reduce coupling with
// // IntentRecognizer.
// //
// ///////////////////////////////////////////////////////////////////////////////

// export class FixupRecognizer implements Recognizer2 {
//     factory = (id: PID, text: string): IntentToken => {
//         if (id !== 100010) {
//             throw TypeError('FixupRecognizer: internal error.');
//         }
//         return { type: INTENT, id: 100010, name: 'PREPOSITIONS', text };
//     };

//     apply = (tokens: Token2[]) => {
//         return [...convertQuantityOfThem(tokens, this.factory)];
//     }

//     terms = (): Set<string> => {
//         return new Set<string>(['of', 'them']);
//     }

//     stemmer = (word: string): string => {
//         // DESIGN NOTE: This example doesn't stem, but probably should.
//         return word;
//     }
// }

// function* convertQuantityOfThem(tokens: Token2[], factory: TokenFactory2) {
//     const sequence = new PeekableSequence<Token2>(tokens[Symbol.iterator]());
//     while (!sequence.atEOF()) {
//         const token1 = sequence.get();
//         if (sequence.atEOF() || token1.type !== WORD) {
//             yield token1;
//         }
//         else {
//             const token2 = sequence.get();
//             if (token2.type === WORD) {
//                 console.log((token2 as WordToken).text);
//                 console.log(token2.text);
//             }
//             if (token2.type !== WORD || !token2.text.startsWith('of them'))
//             {
//                 yield token1;
//                 yield token2;
//             }
//             else {
//                 // We've found a QUANTITY token followed by "of them".
//                 // Convert this to a single PREPOSITION intent token.
//                 const terms = token2.text.split(/\s+/);
//                 const text1 = [token1.text, ...terms.slice(0, 2)].join(' ');

//                 // Yield the PREPOSITION intent token.
//                 yield factory(100010, text1);

//                 // Yield a UNKNOWN token for the remaining text, if any.
//                 if (terms.length > 2) {
//                     const text2 = terms.slice(2).join(' ');                  
//                     yield { type: UNKNOWN, text: text2 };
//                 }
//             }
//         }
//     }
// }
