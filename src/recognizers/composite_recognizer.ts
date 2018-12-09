import * as Debug from 'debug';
const debug = Debug('tf:categoryRecognizer');
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
            debug('Input:\n%O\n', tokens);
        }

        this.recognizers.forEach((processor, index) => {
            result = processor.apply(result);

            if (this.debugMode) {
                debug(`=== PASS ${index} ===`);
                debug('%O\n', result);
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
