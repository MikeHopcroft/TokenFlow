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

pipelineDemo('convertible with tinted windows and fuzzy dice', true);
// pipelineDemo('can I get four four cars');
// pipelineDemo("Hi Can I get a school bus just a sec and a station wagon that's all", true);
// pipelineDemo("i'd like a red convertable jacked with slicks");
// "i'd like a red convertable jacked with slicks actually make that a blue one" - "one" at end
// pipelineDemo("red convertable jacked with slicks");
// pipelineDemo("I'll take the school bus actually make that the dump truck", true);
// pipelineDemo("Can I have a silver four door sedan", true);
// pipelineDemo("with leather interior and a", true);
// pipelineDemo("Can I have a silver four door sedan with leather interior and a dump truck");
// pipelineDemo("I'll have four tires one of them white wall", true);
// pipelineDemo('can I have a station wagon');
