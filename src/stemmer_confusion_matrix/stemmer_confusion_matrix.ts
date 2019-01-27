import { Logger } from '../utilities';

export const stemmerConfusionMatrix = "placeholder export during refactoring";

// import { Recognizer, StemmerFunction } from '../tokenizer';


// export function stemmerConfusionMatrix(recognizer: Recognizer, stemmer: StemmerFunction) {
//     const logger = new Logger('tf:stemmerConfusionMatrix');

//     const matrix: {[term:string]:Set<string>} = {};

//     recognizer.terms().forEach( term => {
//         const lower = term.toLowerCase();
//         const stemmed = stemmer(lower);
//         if (matrix[stemmed] === undefined) {
//             matrix[stemmed] = new Set<string>();
//         }
//         matrix[stemmed].add(lower);
//     });

//     Object.entries(matrix).forEach(([key, value]) => {
//         if (value.size > 1) {
//             const values = [...value].join(',');
//             logger.log(`"${key}": [${values}]`);
//         }
//     });
// }

