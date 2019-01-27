import * as yaml from 'js-yaml';
import { Lexicon } from '../aliases';
import { GraphWalker } from '../graph';
import { Recognizer, Token, WORD, Tokenizer, UNKNOWNTOKEN, WordToken } from '../tokenizer';
import { copyScalar } from '../utilities';

export type TokenToString = (token: Token) => string;

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
        if (this.results.find( result => !result.passed)) {
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

    run(recognizer: Recognizer, tokenToString: TokenToString): Result {
        const input = this.input.split(/\s+/).map( term => ({ type: WORD, text: term }));
        const tokens = recognizer.apply(input);
        const observed = tokens.map(tokenToString).join(' ');
        const passed = (this.expected === observed);

        return new Result(this, observed, passed);
    }

    run2(lexicon: Lexicon, tokenizer: Tokenizer, tokenToString: TokenToString): Result {
        console.log('=========================');
        const terms = this.input.split(/\s+/);
        const stemmed = terms.map(lexicon.termModel.stem);
        const hashed = stemmed.map(lexicon.termModel.hashTerm);
        const graph = tokenizer.generateGraph(hashed, stemmed);
        const walker = new GraphWalker(graph);

        let end = 0;
        const observed: string[] = [];
        let succeeded = false;
        for (const term of this.expectedTokenText) {
            console.log(`Check ${term}`);
            succeeded = false;
            while (walker.advance()) {
                const edge = walker.left[walker.left.length - 1];
                end += edge.length;

                // TODO: Really need an 'undefined'/'word' token.
                let token = tokenizer.tokenFromEdge(edge);
                if (token.type === UNKNOWNTOKEN) {
                    const start = end - edge.length;
                    token = ({
                        type: WORD,
                        text: terms.slice(start, end).join('_').toUpperCase()
                    } as WordToken);
                }
                const text = tokenToString(token);

                if (text === term) {
                    console.log(`  ${text} - score: ${walker.currentEdgeScore()} ok`);
                    succeeded = true;
                    // TODO: NOTE: everything in observed will always match the prefix of terms.
                    // Do we still need observed?
                    observed.push(text);
                    break;
                }

                console.log(`  ${text} - score: ${walker.currentEdgeScore()} no match <<<<<<<<<<<<<<<<<<<<`);
                walker.retreat(false);
                // TODO: should we be looking at the return value of discard()?
                walker.discard();
                end -= edge.length;

                // TODO: Need to either have a list of expected tokens,
                // or need some way of formatting token before comparing
                // with expected text. Formatting routine would have to
                // be passed in.
                // const text = 
            }
            if (!succeeded) {
                break;
            }
        }
        console.log(`${succeeded?"SUCCEEDED":"FAILED"}`);
        return new Result(this, observed.join(' '), succeeded);
    }
}

export class RelevanceSuite {
    private tests: TestCase[] = [];

    static fromYamlString(yamlText: string) {
        // tslint:disable-next-line:no-any
        const yamlTests = yaml.safeLoad(yamlText);

        if (!Array.isArray(yamlTests)) {
            throw TypeError('RelevanceTest: expected an array of tests.');
        }

        const tests = yamlTests.map((test, index) => {
            return new TestCase(
                index,
                copyScalar<number>(test, 'priority', 'number').toString(),
                copyScalar<string>(test, 'suites', 'string').split(/\s+/),
                copyScalar<string>(test, 'input', 'string'),
                copyScalar<string>(test, 'expected', 'string')
            );
        });

        return new RelevanceSuite(tests);
    }

    constructor(tests: TestCase[]) {
        this.tests = tests;
    }

    run(recognizer: Recognizer, tokenToString: TokenToString, showPassedCases = false) {
        const aggregator = new AggregatedResults();

        this.tests.forEach((test) => {
            aggregator.recordResult(test.run(recognizer, tokenToString));
        });

        aggregator.print(showPassedCases);

        return aggregator;
    }

    run2(lexicon: Lexicon, tokenizer: Tokenizer, tokenToString: TokenToString, showPassedCases = false): AggregatedResults {
        const aggregator = new AggregatedResults();

        this.tests.forEach((test) => {
            aggregator.recordResult(test.run2(lexicon, tokenizer, tokenToString));
        });

        aggregator.print(showPassedCases);

        return aggregator;
    }
}

