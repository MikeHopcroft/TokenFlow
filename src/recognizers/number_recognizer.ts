import { Recognizer2, Token2, TokenFactory2, WORD, WordToken } from '../tokenizer';
import { PeekableSequence } from '../utilities';
import wordsToNumbers from 'words-to-numbers';

export class NumberRecognizer implements Recognizer2 {
    static lexicon: Set<string> = new Set([
        'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
        'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
        'hundred', 'thousand', 'million', 'trillion'
    ]);

    tokenFactory: TokenFactory2;

    constructor(tokenFactory: TokenFactory2) {
        this.tokenFactory = tokenFactory;
    }

    private parseSequence(sequence: PeekableSequence<Token2>): Token2[] {
        const tokens: Token2[] = [];
        while (!sequence.atEOF()) {
            const token = sequence.peek() as WordToken;

            if (token.type !== WORD) {
                tokens.push(sequence.get());
            }
            else if (NumberRecognizer.isArabicNumberalSequence(token.text)) {
                tokens.push(this.parseArabicNumeralSequence(sequence));
            }
            else if (NumberRecognizer.lexicon.has(token.text)) {
                tokens.push(this.parseNumberTermSequence(sequence));
            }
            else {
                tokens.push(sequence.get());
            }
        }
        return tokens;
    }

    private parseNumberTermSequence(sequence: PeekableSequence<Token2>): Token2 {
        const tokens: WordToken[] = [];
        while (!sequence.atEOF()) {
            const token = sequence.peek() as WordToken;
            if (token.type === WORD && NumberRecognizer.lexicon.has(token.text)) {
                tokens.push(token);
                sequence.get();
            }
            else {
                break;
            }
        }

        if (tokens.length === 0) {
            throw TypeError('parseNumberSequence: expected a number.');
        }

        const text = tokens.map(token => token.text).join(' ');
        const value = wordsToNumbers(text);
        if (typeof (value) !== 'number') {
            // TODO: consider logging an error and then returning a WORD token.
            throw TypeError('parseNumberSequence: expected a number.');
        }
        return this.tokenFactory(value, tokens);
    }

    private parseArabicNumeralSequence(sequence: PeekableSequence<Token2>): Token2 {
        const token = sequence.get() as WordToken;
        const value = Number(token.text);
        return this.tokenFactory(value, [token]);
    }

    private static isNumberTerm(term: string) {
        return NumberRecognizer.lexicon.has(term)
            || NumberRecognizer.isArabicNumberalSequence(term);
    }

    private static isArabicNumberalSequence(term: string) {
        return /^\d+$/.test(term);
    }

    apply = (tokens: Token2[]) => {
        return this.parseSequence(new PeekableSequence(tokens[Symbol.iterator]()));

    }

    terms = () => {
        return NumberRecognizer.lexicon;
    }

    stemmer = (word: string): string => {
        // DESIGN NOTE: NumberRecognizer does not stem.
        return word;
    }
}
