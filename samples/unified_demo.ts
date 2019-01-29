import * as Debug from 'debug';
import * as path from 'path';

import { tokenToString, Unified } from './unified';


function go(query: string) {
    // unified_demo is intended to be a debugging tool invoked by a human
    // from the console. Therefore use human-readable console logging to stdout.
    // Also enable tf:* to see all alerts.
    Debug.enable('tf-interactive,tf:*');

    console.log(`QUERY: "${query}"`);
    console.log();

    const unified = new Unified(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        true);

    const tokens = unified.processOneQuery(query);
    console.log(tokens.map(tokenToString).join(' '));
}

go('convertible');
// go('I would like twenty silver two door convertibles with no tinted windows and extra fuzzy dice and four studded tires');

// Example of "(twenty two) door" vs "twenty (two door)"
// go('I would like twenty two door convertibles with tinted windows and fuzzy dice');

// go('I would like twenty three convertible with tinted windows and fuzzy dice');
// go('twenty three');
