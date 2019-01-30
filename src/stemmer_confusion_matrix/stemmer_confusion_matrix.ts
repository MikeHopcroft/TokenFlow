import { Lexicon } from '../tokenizer';

export function stemmerConfusionMatrix(lexicon: Lexicon): {[term:string]:Set<string>} {
    const matrix: {[term:string]:Set<string>} = {};

    const terms = lexicon.terms();
    for (const term of terms) {
        const stemmed = lexicon.termModel.stem(term);
        if (matrix[stemmed] === undefined) {
            matrix[stemmed] = new Set<string>();
        }
        matrix[stemmed].add(term);
    }

    return matrix;
}

