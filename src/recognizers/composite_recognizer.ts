import { Recognizer, Token } from '../tokenizer';

export class CompositeRecognizer implements Recognizer {
    recognizers: Recognizer[] = [];
    debugMode: boolean;

    constructor(recognizers: Recognizer[], debugMode = false) {
        this.recognizers = recognizers;
        this.debugMode = debugMode;
    }

    apply = (tokens: Token[]) => {
        let result = tokens;

        if (this.debugMode) {
            console.log('Input:');
            console.log(tokens);
            console.log();
        }

        this.recognizers.forEach((processor, index) => {
            result = processor.apply(result);

            if (this.debugMode) {
                console.log(`=== PASS ${index} ===`);
                console.log(result);
                console.log();
            }
        });

        return result;
    }

    terms = () => {
        const terms = new Set<string>();
        this.recognizers.forEach(recognizer => {
            recognizer.terms().forEach(term => {
                terms.add(term);
            });
        });
        return terms;
    }

    stemmer = (word:string):string => {
        throw TypeError('CompositeRecognizer: stemmer not implemented.');
    }
}
