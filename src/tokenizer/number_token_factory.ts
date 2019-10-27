import { NumberToken, NUMBERTOKEN } from './tokens';

export class NumberTokenFactory {
    tokens = new Map<number, NumberToken>();

    get(value: number) {
        const token = this.tokens.get(value);
        if (token) {
            return token;
        } else {
            const t: NumberToken = {
                type: NUMBERTOKEN,
                value
            };
            this.tokens.set(value, t);
            return t;
        }
    }
}