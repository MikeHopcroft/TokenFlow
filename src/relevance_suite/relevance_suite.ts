import * as AJV from 'ajv';
import * as Debug from 'debug';
import * as yaml from 'js-yaml';
// import { GraphWalker } from '../graph';
import { Lexicon, Token, Tokenizer, UNKNOWNTOKEN } from '../tokenizer';

const debug = Debug('tf:itemMapFromYamlString');

export type TokenToString = (token: Token) => string;
export type UnknownTokenFactory = (terms: string[]) => Token;

export class Result {
    test: TestCase;
    observed: string;
    passed: boolean;

    constructor(test: TestCase, observed: string, passed: boolean) {
        this.test = test;
        this.observed = observed;
        this.passed = passed;
    }
}

export interface TestCounts {
    passCount: number;
    runCount: number;
}

export class AggregatedResults {
    priorities: { [priority: string]: TestCounts } = {};
    suites: { [suite: string]: TestCounts } = {};
    results: Result[] = [];
    passCount = 0;

    recordResult(result: Result): void {
        const test = result.test;
        const passed = result.passed;

        // Update pass/run counts for each suite associated with this test.
        test.suites.forEach((suite) => {
            if (!(suite in this.suites)) {
                this.suites[suite] = { passCount: 0, runCount: 0 };
            }
            const counts = this.suites[suite];
            counts.runCount++;
            if (passed) {
                counts.passCount++;
            }
        });

        // Update pass/run counts for this test's priority.
        if (!(test.priority in this.priorities)) {
            this.priorities[test.priority] = { passCount: 0, runCount: 0 };
        }
        const counts = this.priorities[test.priority];
        counts.runCount++;
        if (passed) {
            counts.passCount++;
        }

        this.results.push(result);

        if (passed) {
            this.passCount++;
        }
    }

    print(showPassedCases = false) {
        if (this.results.find(result => !result.passed)) {
            console.log('Failing tests:');
        }
        else {
            console.log('All tests passed.');
            console.log();
        }

        this.results.forEach((result => {
            if (!result.passed || showPassedCases) {
                const suites = result.test.suites.join(' ');
                const passFail = result.passed ? "PASSED" : "FAILED";
                console.log(`${result.test.id} ${suites} - ${passFail}`);
                console.log(`   input "${result.test.input}"`);
                console.log(`  output "${result.observed}"`);
                console.log(`expected "${result.test.expected}"`);
                console.log();
            }
        }));

        console.log('Suites:');
        for (const [suite, counts] of Object.entries(this.suites)) {
            console.log(`  ${suite}: ${counts.passCount}/${counts.runCount}`);
        }
        console.log();

        console.log('Priorities:');
        for (const [priority, counts] of Object.entries(this.priorities)) {
            console.log(`  ${priority}: ${counts.passCount}/${counts.runCount}`);
        }
        console.log();

        console.log(`Overall: ${this.passCount}/${this.results.length}`);
    }

    rebase() {
        const baseline = this.results.map(result => {
            return {
                'priority': result.test.priority,
                'suites': result.test.suites.join(' '),
                'input': result.test.input,
                'expected': result.observed
            };
        });
        return baseline;
    }
}

export class TestCase {
    id: number;
    priority: string;
    suites: string[];
    input: string;
    expected: string;
    expectedTokenText: string[];

    constructor(
        id: number,
        priority: string,
        suites: string[],
        input: string,
        expected: string
    ) {
        this.id = id;
        this.priority = priority;
        this.suites = suites;
        this.input = input;
        this.expected = expected;
        this.expectedTokenText = expected.split(/\s+/);
    }

    run(
        lexicon: Lexicon,
        tokenizer: Tokenizer,
        tokenToString: TokenToString,
        unknownFactory: UnknownTokenFactory
    ): Result {
        console.log('=========================');
        // const terms = this.input.split(/\s+/);
        // const stemmed = terms.map(lexicon.termModel.stem);
        // const hashed = stemmed.map(lexicon.termModel.hashTerm);
        // const graph = tokenizer.generateGraph(hashed, stemmed);
        // // const walker = new GraphWalker(graph);

        // let end = 0;
        const observed: string[] = [];
        const succeeded = false;
        // for (const term of this.expectedTokenText) {
        //     console.log(`Check ${term}`);
        //     succeeded = false;
        //     while (walker.advance()) {
        //         const edge = walker.left[walker.left.length - 1];
        //         end += edge.length;

        //         // TODO: Really need an 'undefined'/'word' token.
        //         // let token = tokenizer.tokenFromEdge(edge);
        //         let token = edge.token;
        //         if (token.type === UNKNOWNTOKEN) {
        //             const start = end - edge.length;
        //             token = unknownFactory(terms.slice(start, end));
        //         }
        //         const text = tokenToString(token);

        //         if (text === term) {
        //             console.log(`  ${text} - score: ${walker.currentEdgeScore()} ok`);
        //             succeeded = true;
        //             // TODO: NOTE: everything in observed will always match the prefix of terms.
        //             // Do we still need observed?
        //             observed.push(text);
        //             break;
        //         }

        //         console.log(`  ${text} - score: ${walker.currentEdgeScore()} no match <<<<<<<<<<<<<<<<<<<<`);
        //         walker.retreat(false);
        //         // TODO: should we be looking at the return value of discard()?
        //         walker.discard();
        //         end -= edge.length;

        //         // TODO: Need to either have a list of expected tokens,
        //         // or need some way of formatting token before comparing
        //         // with expected text. Formatting routine would have to
        //         // be passed in.
        //         // const text = 
        //     }
        //     if (!succeeded) {
        //         break;
        //     }
        // }
        console.log(`${succeeded ? "SUCCEEDED" : "FAILED"}`);
        return new Result(this, observed.join(' '), succeeded);
    }
}

interface YamlTestCase {
    priority: string;
    suites: string;
    input: string;
    expected: string;
    expectedTokenText: string[];
}

export class RelevanceSuite {
    private tests: TestCase[] = [];
    
    static fromYamlString(yamlText: string) {
        const schemaForTestCases = {
            "definitions": {},
            "$schema": "http://json-schema.org/draft-07/schema#",
            "$id": "http://example.com/root.json",
            "type": "array",
            "title": "The Root Schema",
            "items": {
                "$id": "#/items",
                "type": "object",
                "title": "The Items Schema",
                "required": [
                    "priority",
                    "suites",
                    "input",
                    "expected"
                ],
                "properties": {
                    "priority": {
                        "$id": "#/items/properties/priority",
                        "type": "integer",
                        "title": "The Priority Schema",
                        "default": 0,
                        "examples": [
                            1
                        ]
                    },
                    "suites": {
                        "$id": "#/items/properties/suites",
                        "type": "string",
                        "title": "The Suites Schema",
                        "default": "",
                        "examples": [
                            "general"
                        ],
                        "pattern": "^(.*)$"
                    },
                    "input": {
                        "$id": "#/items/properties/input",
                        "type": "string",
                        "title": "The Input Schema",
                        "default": "",
                        "examples": [
                            "I'd like a black sedan with alloy wheels skip the extended warranty and a red convertible jacked with open headers"
                        ],
                        "pattern": "^(.*)$"
                    },
                    "expected": {
                        "$id": "#/items/properties/expected",
                        "type": "string",
                        "title": "The Expected Schema",
                        "default": "",
                        "examples": [
                            "[ADD_TO_ORDER] [NUMBER:1] [ENTITY:BLACK_FOUR_DOOR_SEDAN,20] [CONJUNCTION] [ENTITY:ALLOY_RIMS,1000] [QUANTIFIER:0] [ENTITY:EXTENDED_WARRANTY,1800] [CONJUNCTION] [NUMBER:1] [ENTITY:RED_TWO_DOOR_CONVERTIBLE_SEDAN,1] [ENTITY:LIFT_KIT,1200] [CONJUNCTION] [ENTITY:OPEN_HEADERS,1203]"
                        ],
                        "pattern": "^(.*)$"
                    }
                }
            }
        };
        
        const ajv = new AJV();
        const validator = ajv.compile(schemaForTestCases);
                const yamlRoot = yaml.safeLoad(yamlText) as YamlTestCase[];

        if (!validator(yamlRoot)) {
            const message = 'itemMapFromYamlString: yaml data does not conform to schema.';
            debug(message);
            debug(validator.errors);
            throw TypeError(message);    
        }

        const tests = yamlRoot.map((test, index) => {
            return new TestCase(
                index,
                test.priority.toString(),
                test.suites.split(/\s+/),
                test.input,
                test.expected);
        });

        return new RelevanceSuite(tests);
    }

    constructor(tests: TestCase[]) {
        this.tests = tests;
    }

    run(
        lexicon: Lexicon,
        tokenizer: Tokenizer,
        tokenToString: TokenToString,
        unknownFactory: UnknownTokenFactory,
        showPassedCases = false
    ): AggregatedResults {
        const aggregator = new AggregatedResults();

        for (const test of this.tests) {
            aggregator.recordResult(test.run(lexicon, tokenizer, tokenToString, unknownFactory));
        }

        aggregator.print(showPassedCases);

        return aggregator;
    }
}

