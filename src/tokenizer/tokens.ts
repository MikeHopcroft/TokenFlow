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

// PIDTOKEN is a temporary class added as a refactoring work around
// to keep the old pipeline running while we transition to the unified
// model.
export const PIDTOKEN: unique symbol = Symbol('PIDTOKEN');
export type PIDTOKEN = typeof PIDTOKEN;

export interface PIDToken extends Token {
    type: PIDTOKEN;
    pid: PID;
}

// TODO: Should this return CompositeToken or would it sometime
// want the flexibility to return a new WORD or other Token2s?
export type TokenFactory = (pid: PID, children: Token[]) => Token;
