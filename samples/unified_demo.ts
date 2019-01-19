
// // Create Domains from yaml files
// // Create Lexicon
// // Create Tokenizer
// // Some sort of GraphWalker demo.
// // Token factory for GraphWalker

// import * as fs from 'fs';

// import { Alias, Domain, Lexicon } from '../src';
// import { itemMapFromYamlString, Item, Matcher, Token, Tokenizer, TokenFactory } from '../src';

// type TokenFactory2 = (item: Item) => Token;


// function* flatten(items: Map<number, Item>, factory: TokenFactory2, matcher: Matcher): IterableIterator<Alias> {
//     for (const [index, item] of items.entries()) {
//         const token = factory(item);
//         for (const alias of item.aliases) {
//             yield {
//                 token,
//                 text: alias,
//                 matcher
//             };
//         }
//     }
// }

// function domainFromYamlFile(yamlFilePath: string, matcher: Matcher, factory: TokenFactory2, tokenizer: Tokenizer) {
//     const yamlText = fs.readFileSync(yamlFilePath, 'utf8');
//     const items = itemMapFromYamlString(yamlText);
//     return domainFromItems(items, matcher, factory, tokenizer);
// }

// function domainFromYamlText(yamlText: string, matcher: Matcher, factory: TokenFactory2, tokenizer: Tokenizer) {
//     const items = itemMapFromYamlString(yamlText);
//     return domainFromItems(items, matcher, factory, tokenizer);
// }


// function domainFromItems(items: Map<number, Item>, matcher: Matcher, factory: TokenFactory2, tokenizer: Tokenizer) {
//     // TODO: Could Domain.constructor() take an iterator or an iterable,
//     // instead of materializing into an array.
//     const aliases = [...flatten(items, factory, matcher)];
//     const domain = new Domain(aliases, factory, tokenizer);
//     return domain;
// }

// function go(yamlTexts: string[], matcher: Matcher) {
//     const dummyDownstreamWords = new Set<string>();
//     const dummyStemmer = Tokenizer.defaultStemTerm;
//     const dummyRelaxedMatching = true;
//     const debugMode = false;
//     const tokenizer = new Tokenizer(dummyDownstreamWords, dummyStemmer, dummyRelaxedMatching, debugMode);

//     const entitiesFile = 'entities.yaml';
//     const entities = domainFromYamlFile(entitiesFile, matcher, factory, tokenizer);

//     for (const yamlText of yamlTexts) {
//         // TODO: Do we still need a map or will an array suffice?
//         const items = itemMapFromYamlString(yamlText);

//         // TODO: Could Domain.constructor() take an iterator or an iterable,
//         // instead of materializing into an array.
//         const aliases = [...flatten(items, matcher)];
//         const domain = new Domain(aliases, factory, tokenizer);

//         for (const [index, item] of items.entries()) {
//             for (const alias of item.aliases) {

//             }
//         }
//     }
// }