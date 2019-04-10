import * as Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';

import { tokenToString, Unified, WORD, WordToken } from './unified';
import { RelevanceSuite } from '../src/relevance_suite';

function unkownTokenFactory(terms: string[]) {
    return ({
        type: WORD,
        text: terms.join('_').toUpperCase()
    } as WordToken);
}


function go() {
    const testFile = path.join(__dirname, './data/cars/tests.yaml');

    Debug.enable('tf-interactive,tf:*');

    const unified = new Unified(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        path.join(__dirname, './data/stopwords.txt'),
        false);

    // Blank line to separate console spew from unified constructor.
    console.log();

    const suite = RelevanceSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    return suite.run(unified.lexicon, unified.tokenizer, tokenToString, unkownTokenFactory, true);
}

go();
