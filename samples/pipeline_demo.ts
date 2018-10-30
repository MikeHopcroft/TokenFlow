import * as path from 'path';
import { Pipeline, printTokens } from './pipeline';

function pipelineDemo(query: string, debugMode = false) {
    const pipeline = new Pipeline(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        undefined,
        debugMode);

    const tokens = pipeline.processOneQuery(query);

    console.log(`"${query}"`);
    console.log();
    printTokens(tokens);
}

// pipelineDemo("I'll take the school bus actually make that the dump truck", true);
// pipelineDemo("Can I have a silver four door sedan", true);
// pipelineDemo("with leather interior and a", true);
// pipelineDemo("Can I have a silver four door sedan with leather interior and a dump truck");
pipelineDemo("I'll have four tires one of them white wall", true);
// pipelineDemo('can I have a station wagon');
