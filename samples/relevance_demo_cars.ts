import * as Debug from 'debug';

import * as path from 'path';
import { runRelevanceTest } from './relevance_demo_helper';

function relevanceDemoCars(showPassedCases = false) {
    // relevanceDemoCars is intended to be a debugging tool invoked by a human
    // from the console. Therefore use human-readable console logging to stdout.
    Debug.enable('tf-interactive');

    const suite = runRelevanceTest(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        path.join(__dirname, './data/cars/tests.yaml'),
        showPassedCases);
    return suite;    
}

relevanceDemoCars(false);

