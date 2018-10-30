import { NumberRecognizer } from '../../src/recognizers';
import { QUANTITY, QuantityToken } from './quantity_recognizer';
import { Token } from '../../src/tokenizer';

export function CreateNumberRecognizer(): NumberRecognizer {
    const tokenFactory = (value: number, children: Token[]): QuantityToken => {
        return { type: QUANTITY, children, value };
    };

    return new NumberRecognizer(tokenFactory);
}

