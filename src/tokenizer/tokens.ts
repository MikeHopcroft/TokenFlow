import { PID } from './types';

export interface Token2 {
    type: symbol;
}

export interface CompositeToken extends Token2 {
    type: symbol;
    children: Token2[];
}

export const WORD: unique symbol = Symbol('WORD');
export type WORD = typeof WORD;

export interface WordToken extends Token2 {
    type: WORD;
    text: string;
}

// TODO: Should this return CompositeToken or would it sometime
// want the flexibility to return a new WORD or other Token2s?
export type TokenFactory2 = (pid: PID, children: Token2[]) => Token2;
