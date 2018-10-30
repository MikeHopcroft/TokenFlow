import { PID } from './types';

export interface Token {
    type: symbol;
}

export interface CompositeToken extends Token {
    type: symbol;
    children: Token[];
}

export const WORD: unique symbol = Symbol('WORD');
export type WORD = typeof WORD;

export interface WordToken extends Token {
    type: WORD;
    text: string;
}

// TODO: Should this return CompositeToken or would it sometime
// want the flexibility to return a new WORD or other Token2s?
export type TokenFactory = (pid: PID, children: Token[]) => Token;
