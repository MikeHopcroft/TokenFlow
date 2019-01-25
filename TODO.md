
* Stemmer needs special handling for numbers
* isDownstreamTerm function needs to handle number tokens
* Move lexicon.ts to src/tokenizer
* `Tokenizer.matchAndScore` should get `isTokenHash` from termModel.
* Remove `Tokenizer` members
    * ~~`Tokenizer.matcher`~~
    * `Tokenizer.downstreamWords`
    * `Tokenizer.hashedDownstreamWordSet`
    * `isNumberHash`
    * `isTokenHash`
    * `stemAndHash`
    * `addHashedDownstreamTerm`
    * `stemTermInternal`
    * `hashTerm`
    * `decodeTerm`
    * `addItem2`, `addItem`
    * `PID`, `pidToName`
    * `aliasFromEdge`
    * `processQuery`
* Remove `Tokenizer.constructor()` parameters
    * `downstreamWords`
    * ~~`relaxedMatching`~~ parameter.
* `Tokenizer.addItem2()`
    * Remove `addTokensToDOwnstream`
    * Move alias splitting, stemming, and hashing to caller. Take `TokenizerAlias` as parameter. Role is now just to update inverted index.
* Make `Tokenizer` members private.
* Logging
    * Consider getting `debugMode` from the logging framework.
* Tokenizer
    * Eliminate `PIDs.` Replace with `Token`.
    * Move alias splitting, stemming, and hashing to `Lexicon`.
* Lexicon
    * Splits, stems, and hashes.
    * Provisions domains with downStreamTerms.
    * Ingests into tokenizer.
* Domain