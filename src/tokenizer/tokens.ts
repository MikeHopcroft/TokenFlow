import { PID } from './types';

export interface Token {
    type: symbol;
}

export const NUMBERTOKEN: unique symbol = Symbol('NUMBERTOKEN');
export type NUMBERTOKEN = typeof NUMBERTOKEN;

export interface NumberToken extends Token {
    type: NUMBERTOKEN;
    value: number;
}

export const UNKNOWNTOKEN: unique symbol = Symbol('UNKNOWNTOKEN');
export type UNKNOWNTOKEN = typeof UNKNOWNTOKEN;

export interface UnknownToken extends Token {
    type: UNKNOWNTOKEN;
}

// TODO: Should this return CompositeToken or would it sometime
// want the flexibility to return a new WORD or other Token2s?
export type TokenFactory = (pid: PID, children: Token[]) => Token;
