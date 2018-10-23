# token-flow [![Build Status](https://travis-ci.com/MikeHopcroft/TokenFlow.svg?branch=master)](https://travis-ci.com/MikeHopcroft/TokenFlow)

**token-flow** is an exerimental natural language tokenizer intended for domains with a fixed vocabulary of entities and a small number of intents.
Uses might include purchasing items from a catalog, ordering food from a restaurant or organizing your song collection.

The first stage of development is a set of tokenizers that detect entities, intents, and quantities.
As an example, consider the following utterance, which would typically come from a speech-to-text system:

~~~
I'd like a black sedan with alloy wheels skip the extended warantty and a red convertable jacked with open headers
~~~

In this example, the utterance has no commas, since they were not provided by the speech-to-text process.

Using token-flow, this text might be tokenized as

~~~
[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:BLACK_FOUR_DOOR_SEDAN,20]
[QUANTITY:1] [ENTITY:ALLOY_RIMS,1000] [QUANTITY:0] [ENTITY:EXTENDED_WARRANTY,1800]
[INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:RED_TWO_DOOR_CONVERTIBLE_SEDAN,1]
[ENTITY:LIFT_KIT,1200] [QUANTITY:1] [ENTITY:OPEN_HEADERS,1203]
~~~

After tokenization, a parser might be able to group the tokens into a tree that reflects the speaker's intent:
~~~
[INTENT:ADD_TO_ORDER]
    [QUANTITY:1] [ENTITY:BLACK_FOUR_DOOR_SEDAN,20]          // Black sedan
        [QUANTITY:1] [ENTITY:ALLOY_RIMS,1000]               //   Add alloy rims
        [QUANTITY:0] [ENTITY:EXTENDED_WARRANTY,1800]        //   Remove warranty
    [QUANTITY:1] [ENTITY:RED_TWO_DOOR_CONVERTIBLE_SEDAN,1]  // Red convertable
        [ENTITY:LIFT_KIT,1200]                              //   Add lift kit
        [QUANTITY:1] [ENTITY:OPEN_HEADERS,1203]             //   Make it loud
~~~

## Try It Out

token-flow is currently in the earliest stages of development, so documentation is
sparse or nonexistant, and the code stability is uneven.

If you are interested in taking a look, you can clone
[the repo](https://github.com/MikeHopcroft/TokenFlow) on GitHub or install
[token-flow](https://www.npmjs.com/package/token-flow) with npm.

~~~
npm install token-flow
~~~

As of [commit XXXXXXXX](), there are a number of working samples, based on a ficticious auto dealership.

Note that the samples are not included in the [token-flow npm package](https://www.npmjs.com/package/token-flow). To use them, you must
clone the [repo from GitHub](https://github.com/MikeHopcroft/TokenFlow).

You can find the definition files for the catalog, intents, attributes, and quantifiers at
* `samples/data/cars/catalog.yaml`
* `samples/data/intents.yaml`
* `samples/data/attributes.yaml`
* `samples/data/quantifiers.yaml`

### Relevance Test Sample

This sample runs a suite of test utterances through the tokenization pipeline.
The test utterances can be found at `samples/data/cars/tests.yaml`.

If you've cloned the repo, you can build and run the sample as follows:

~~~
npm install
npm run compile
node build/samples/relevance_demo_cars.js
~~~

The output is the sequence of tokens extracted for each test utterance:

~~~
% node build/samples/relevance_demo_cars.js

14 items contributed 145 aliases.
5 items contributed 29 aliases.
21 items contributed 30 aliases.
78 items contributed 212 aliases.

All tests passed.

0 general - PASSED
   input "I'd like a black sedan with alloy wheels skip the extended warantty and a red convertable jacked with open headers"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:BLACK_FOUR_DOOR_SEDAN,20] [QUANTITY:1] [ENTITY:ALLOY_RIMS,1000] [QUANTITY:0] [ENTITY:EXTENDED_WARRANTY,1800] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:RED_TWO_DOOR_CONVERTIBLE_SEDAN,1] [ENTITY:LIFT_KIT,1200] [QUANTITY:1] [ENTITY:OPEN_HEADERS,1203]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:BLACK_FOUR_DOOR_SEDAN,20] [QUANTITY:1] [ENTITY:ALLOY_RIMS,1000] [QUANTITY:0] [ENTITY:EXTENDED_WARRANTY,1800] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:RED_TWO_DOOR_CONVERTIBLE_SEDAN,1] [ENTITY:LIFT_KIT,1200] [QUANTITY:1] [ENTITY:OPEN_HEADERS,1203]"

1 general - PASSED
   input "convertible with tinted windows and fuzzy dice"
  output "[ENTITY:RED_TWO_DOOR_CONVERTIBLE_SEDAN,1] [QUANTITY:1] [ENTITY:TINTED_WINDOWS,1205] [INTENT:CONJUNCTION] [ENTITY:FUZZY_DICE,1600]"
expected "[ENTITY:RED_TWO_DOOR_CONVERTIBLE_SEDAN,1] [QUANTITY:1] [ENTITY:TINTED_WINDOWS,1205] [INTENT:CONJUNCTION] [ENTITY:FUZZY_DICE,1600]"

2 general - PASSED
   input "I'd like a four door sedan with moon roof trailer hitch and tinted windows"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:SILVER_FOUR_DOOR_SEDAN,12] [QUANTITY:1] [ENTITY:MOON_ROOF,1302] [ENTITY:TOW_PACKAGE,1303] [INTENT:CONJUNCTION] [ENTITY:TINTED_WINDOWS,1205]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:SILVER_FOUR_DOOR_SEDAN,12] [QUANTITY:1] [ENTITY:MOON_ROOF,1302] [ENTITY:TOW_PACKAGE,1303] [INTENT:CONJUNCTION] [ENTITY:TINTED_WINDOWS,1205]"

3 general - PASSED
   input "Give me the monster truck jacked with knobbies glass packs open headers and an air freshener"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GOLD_MONSTER_TRUCK,30] [ENTITY:LIFT_KIT,1200] [QUANTITY:1] [ENTITY:KNOBBY_TIRES,1004] [ENTITY:GLASS_PACKS,1204] [ENTITY:OPEN_HEADERS,1203] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:PINE_SCENTED_AIR_FRESHENER,1601]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:GOLD_MONSTER_TRUCK,30] [ENTITY:LIFT_KIT,1200] [QUANTITY:1] [ENTITY:KNOBBY_TIRES,1004] [ENTITY:GLASS_PACKS,1204] [ENTITY:OPEN_HEADERS,1203] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:PINE_SCENTED_AIR_FRESHENER,1601]"

4 general - PASSED
   input "I want a blue convertible four on the floor no undercoat no warranty"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:BLUE_TWO_DOOR_CONVERTIBLE_SEDAN,5] [ENTITY:FOUR_SPEED_MANUAL_TRANSMISSIONS,1300] [QUANTITY:0] [ENTITY:UNDER_COAT,1304] [QUANTITY:0] [ENTITY:EXTENDED_WARRANTY,1800]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:BLUE_TWO_DOOR_CONVERTIBLE_SEDAN,5] [ENTITY:FOUR_SPEED_MANUAL_TRANSMISSIONS,1300] [QUANTITY:0] [ENTITY:UNDER_COAT,1304] [QUANTITY:0] [ENTITY:EXTENDED_WARRANTY,1800]"

5 general - PASSED
   input "Can I have a silver four door sedan with leather interior and a dump truck"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:SILVER_FOUR_DOOR_SEDAN,12] [QUANTITY:1] [ENTITY:LEATHER_INTERIOR,1700] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:GREY_DUMP_TRUCK,33]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:SILVER_FOUR_DOOR_SEDAN,12] [QUANTITY:1] [ENTITY:LEATHER_INTERIOR,1700] [INTENT:CONJUNCTION] [QUANTITY:1] [ENTITY:GREY_DUMP_TRUCK,33]"

6 general - PASSED
   input "I'll take the school bus actually make that the dump truck"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:YELLOW_SCHOOL_BUS,32] [INTENT:CANCEL_LAST_ITEM] [INTENT:RESTATE] [QUANTITY:1] [ENTITY:GREY_DUMP_TRUCK,33]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:1] [ENTITY:YELLOW_SCHOOL_BUS,32] [INTENT:CANCEL_LAST_ITEM] [INTENT:RESTATE] [QUANTITY:1] [ENTITY:GREY_DUMP_TRUCK,33]"

7 general - PASSED
   input "I'd like two blue sedans one of them jacked with slicks and the other a low rider with moon roof"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:BLUE_TWO_DOOR_SEDAN,6] [QUANTITY:1] [INTENT:PREPOSITIONS] [ENTITY:LIFT_KIT,1200] [QUANTITY:1] [ENTITY:RACING_SLICKS,1006] [INTENT:CONJUNCTION] [QUANTITY:1] [INTENT:PREPOSITIONS] [QUANTITY:1] [ENTITY:LOW_RIDER_KIT,1201] [QUANTITY:1] [ENTITY:MOON_ROOF,1302]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:BLUE_TWO_DOOR_SEDAN,6] [QUANTITY:1] [INTENT:PREPOSITIONS] [ENTITY:LIFT_KIT,1200] [QUANTITY:1] [ENTITY:RACING_SLICKS,1006] [INTENT:CONJUNCTION] [QUANTITY:1] [INTENT:PREPOSITIONS] [QUANTITY:1] [ENTITY:LOW_RIDER_KIT,1201] [QUANTITY:1] [ENTITY:MOON_ROOF,1302]"

8 general - PASSED
   input "Get me two air fresheners one strawberry and the other new car actually make that vanilla"
  output "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:PINE_SCENTED_AIR_FRESHENER,1601] [QUANTITY:1] [ATTRIBUTE:AIR_FRESHENER(STRAWBERRY),302] [INTENT:CONJUNCTION] [QUANTITY:1] [INTENT:PREPOSITIONS] [ATTRIBUTE:AIR_FRESHENER(NEW_CAR),305] [INTENT:CANCEL_LAST_ITEM] [INTENT:RESTATE] [ATTRIBUTE:AIR_FRESHENER(VANILLA),304]"
expected "[INTENT:ADD_TO_ORDER] [QUANTITY:2] [ENTITY:PINE_SCENTED_AIR_FRESHENER,1601] [QUANTITY:1] [ATTRIBUTE:AIR_FRESHENER(STRAWBERRY),302] [INTENT:CONJUNCTION] [QUANTITY:1] [INTENT:PREPOSITIONS] [ATTRIBUTE:AIR_FRESHENER(NEW_CAR),305] [INTENT:CANCEL_LAST_ITEM] [INTENT:RESTATE] [ATTRIBUTE:AIR_FRESHENER(VANILLA),304]"

Suites:
  general: 9/9

Priorities:
  1: 9/9

Overall: 9/9
~~~

### REPL Sample

This sample provides a Read-Eval-Print-Loop that runs the tokenizer on each line entered.

If you've cloned the repo, you can build and run the sample as follows:

~~~
npm run compile
node build/samples/repl_demo.js
~~~

~~~
% node build/samples/repl_demo.js

Welcome to the token-flow REPL.
Type your order below.
A blank line exits.

14 items contributed 145 aliases.
5 items contributed 23 aliases.
16 items contributed 31 aliases.
78 items contributed 212 aliases.

% I'd like a 1/2 ton truck with the tow package

********************************************************
PLEASE NOTE: your input has been modified to be more
like the output of a speech-to-text system.
your input: "I'd like a 1/2 ton truck with the tow package"
modified:   "I'd like a half ton truck with the tow package"
********************************************************
INTENT: ADD_TO_ORDER: "I'd like"
QUANTITY: 1: "a"
ENTITY: BLACK_HALF_TON_PICKUP_TRUCK(34): "half ton truck"
QUANTITY: 1: "with the"
ENTITY: TOW_PACKAGE(1303): "tow package"

% Can I get a convertable four on the floor with moon roof and air freshener actually make that an automatic

INTENT: ADD_TO_ORDER: "Can I get"
QUANTITY: 1: "a"
ENTITY: RED_TWO_DOOR_CONVERTIBLE_SEDAN(1): "convertable"
ENTITY: FOUR_SPEED_MANUAL_TRANSMISSIONS(1300): "four on the floor"
QUANTITY: 1: "with"
ENTITY: MOON_ROOF(1302): "moon roof"
INTENT: CONJUNCTION: "and"
ENTITY: PINE_SCENTED_AIR_FRESHENER(1601): "air freshener"
INTENT: CANCEL_LAST_ITEM: "actually"
INTENT: RESTATE: "make that"
QUANTITY: 1: "an"
ENTITY: SIX_SPEED_AUTOMATIC_TRANSMISSIONS(1301): "automatic"

%
bye

~~~

### Stemmer Confusion Matrix Sample
In some cases, the stemmer can stem words with different meanings to the same term.
One can check for these problems in the `catalog.json`, `quantifiers.json`, and `intents.json` files by generating a stemmer confusion matrix.

~~~
node build\samples\stemmer_confusion_demo.js

14 items contributed 145 aliases.
5 items contributed 29 aliases.
23 items contributed 36 aliases.
83 items contributed 223 aliases.
"wall": [wall,walls]
"knobbi": [knobby,knobbies]
"inject": [injection,injected]
"lift": [lift,lifted]
"glass": [glass,glasses]
"seat": [seats,seat]
"custom": [customer,custom]
"organ": [organizer,organ,organic]
"that": [that,that's]
"thank": [thank,thanks]
~~~

In the example above, we see that the words `"organizer"` and `"organ"` are treated as the same term, as are `"customer"` and `"custom"`. This causes the phrase `"custom organ"` to match `"customer organizer folder"` instead of `"custom organ horn"`.

~~~
% I want a red convertible with a custom organ

INTENT: ADD_TO_ORDER: "I want"
QUANTITY: 1: "a"
ENTITY: RED_TWO_DOOR_CONVERTIBLE_SEDAN(1): "red convertible"
QUANTITY: 1: "with a"
ENTITY: CUSTOMER_ORGANIZER_FOLDER(2000): "custom organ"

% I want a red convertible with a custom organ horn

INTENT: ADD_TO_ORDER: "I want"
QUANTITY: 1: "a"
ENTITY: RED_TWO_DOOR_CONVERTIBLE_SEDAN(1): "red convertible"
QUANTITY: 1: "with a"
ENTITY: CUSTOM_ORGAN_HORN(2001): "custom organ horn"
~~~

One can address this problem with a different stemmer or lemmatizer. One simple work-around is to wrap the default stemmer in a function that has special handling
for certain words like `"organ"` and `"organizer"`:

~~~
function hackedStemmer(term: string): string {
    const lowercase = term.toLowerCase();
    if (lowercase === 'organ' || lowercase === 'organizer') {
        return lowercase;
    }
    return Tokenizer.defaultStemTerm(lowercase);
}
~~~

## Tokenizer Design Notes

