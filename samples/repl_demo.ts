import * as Debug from 'debug';
import * as path from 'path';
import { Pipeline, printTokens } from './pipeline';
import * as readlineSync from 'readline-sync';
import {speechToTextFilter} from './speech_to_text_filter';

export function repl(
    catlogFile: string,
    intentFile: string,
    attributesFile: string,
    quantifierFile: string
) {
    // This is an interactive session, so use human-readable
    // console logging to stdout.
    Debug.enable('tf-interactive');

    console.log('Welcome to the token-flow REPL.');
    console.log('Type your order below.');
    console.log('A blank line exits.');
    console.log();

    const pipeline = new Pipeline(catlogFile, intentFile, attributesFile, quantifierFile);
    console.log();

    while (true) {
        const line = readlineSync.question('% ');
        if (line.length === 0) {
            console.log('bye');
            break;
        }

        console.log();

        const text = speechToTextFilter(line);
        if (text !== line) {
            console.log('********************************************************');
            console.log('PLEASE NOTE: your input has been modified to be more');
            console.log('like the output of a speech-to-text system.');
            console.log(`your input: "${line}"`);
            console.log(`modified:   "${text}"`);
            console.log('********************************************************');
        }

        const tokens = pipeline.processOneQuery(text);
        printTokens(tokens);

        console.log();
    }
}

export function replDemo() {
    repl(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'));
}

replDemo();

