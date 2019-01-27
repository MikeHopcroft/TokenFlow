import * as Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';

import { tokenToString, Unified } from './unified';
import { RelevanceSuite } from '../src/relevance_suite';

function go() {
    const showPassedCases = false;
    const testFile = path.join(__dirname, './data/cars/tests2.yaml');

    Debug.enable('tf-interactive,tf:*');

    const unified = new Unified(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        false);

    // Blank line to separate console spew from unified constructor.
    console.log();

    const suite = RelevanceSuite.fromYamlString(fs.readFileSync(testFile, 'utf8'));
    return suite.run2(unified.lexicon, unified.tokenizer, tokenToString, true);
}

go();
