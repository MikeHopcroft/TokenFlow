import * as Debug from 'debug';
const debug = Debug('tf:itemMapFromYamlString');
import * as yaml from 'js-yaml';
import * as AJV from 'ajv';
import { PID } from '.';

export interface Item {
    pid: PID;
    name: string;
    aliases: string[];
}

export interface ItemCollection {
    items: Item[];
}

// Schema from https://www.npmjs.com/package/typescript-json-schema
const schemaForItemCollection = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "Item": {
            "properties": {
                "aliases": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                },
                "name": {
                    "type": "string"
                },
                "pid": {
                    "type": "number"
                }
            },
            "required": [
                "aliases",
                "name",
                "pid"
            ],
            "type": "object"
        }
    },
    "properties": {
        "items": {
            "items": {
                "$ref": "#/definitions/Item"
            },
            "type": "array"
        }
    },
    "required": [
        "items"
    ],
    "type": "object"
};

const ajv = new AJV();
const validator = ajv.compile(schemaForItemCollection);

export function itemMapFromYamlString(yamlText: string): Map<PID, Item> {
    const yamlRoot = yaml.safeLoad(yamlText) as ItemCollection;

    if (!validator(yamlRoot)) {
        const message = 'itemMapFromYamlString: yaml data does not conform to schema.';
        debug(message);
        debug(validator.errors);
        throw TypeError(message);
    }
    
    const map = new Map<PID, Item>();
    for (const item of yamlRoot.items) {
        map.set(item.pid, item);
    }

    return map;
}
