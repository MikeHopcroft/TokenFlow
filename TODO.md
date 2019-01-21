
* Remove `Tokenizer` members
    * ~~`Tokenizer.matcher`~~
    * `Tokenizer.downstreamWords`
    * `Tokenizer.hashedDownstreamWordSet`
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