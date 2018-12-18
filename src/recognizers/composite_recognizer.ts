import * as util from 'util';

import { Recognizer, Token } from '../tokenizer';
import { Logger } from '../utilities';

export class CompositeRecognizer implements Recognizer {
    logger: Logger;
    recognizers: Recognizer[] = [];
    debugMode: boolean;

    constructor(recognizers: Recognizer[], debugMode = false) {
        this.logger = new Logger('tf:CompositeRecognizer');
        this.recognizers = recognizers;
        this.debugMode = debugMode;
    }

    apply = (tokens: Token[]) => {
        let result = tokens;

        if (this.debugMode) {
            this.logger.log(`Input:\n${util.inspect(tokens, { depth: null })}\n`);
        }

        this.recognizers.forEach((processor, index) => {
            result = processor.apply(result);

            if (this.debugMode) {
                this.logger.log(`=== PASS ${index} ===`);
                this.logger.log(`${util.inspect(result, { depth: null })}\n`);
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
