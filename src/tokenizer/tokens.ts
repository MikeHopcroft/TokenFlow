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

export const theUnknownToken: UnknownToken = {
    type: UNKNOWNTOKEN
};
