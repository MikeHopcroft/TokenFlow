# How token-flow works

`token-flow` converts human-readable text into sequences of `tokens` that represent meaning and user intent at a higher semantic level than words alone. Human speech and text is mess]y and approximate and has many different ways to express the same concept. For example, `"a couple of"`, `"a pair of"`, `"two"`, `"two more"`, `"double"` and `"dual"` might all correspond to the quantity, `2`, in a certain context.

token-flow attempts to simplify the sentence by replacing each of these phrases with a `token` denoting a quanity:

**IMAGE - I'd like a couple of fuzzy dice**

In this example, we've replaced the infinite variability of text with tokens representing quantities. In a similar way, we can identify and tokenize concepts like the intent to add an item to a shopping cart (`"I'd like"` or `"Please get me"`) or the names of catalog items (`"sedan"` or `"dice"`) or modifiers (`"red"`, or `"fuzzy"`)/

**IMAGE - I'd like a couple of fuzzy dice**

By replacing the infinite variability of text with tokens, we simplify the job of downstream code tasked with understanding and carrying out the user's intent.

## Challenge

The challenge with tokenization is that multiple tokens can be candidates for alignment with a given sequence of words. For example, the first position in the phrase, `"gin and tonic"` aligns with both the spirit, `"gin"` and the cocktail, `"gin and tonic"`. The phrase, `"I need a second olive"` aligns with the request for more time, `"I need a second"` and a more complex sequence of tokens representing a request for another olive.

The problem becomes more complex with relaxed matching. Human speech is rarely precise. It contains [disfluencies](https://en.wikipedia.org/wiki/Speech_disfluency), like `"ah"` and `"um"`, unconscious word repetitions and transpositions, [malapropism](https://en.wikipedia.org/wiki/Malapropism), and other errors. Speech to text transcription systems may introduce additional errors, due to factors ranging from background noise to the speaker's accent.

------
`token-flow` converts human-readable text into sequences of `tokens` that represent meaning and user intent at a higher semantic level than words alone.

The challenge in recognition systems is to bridge the gap between the messy, approximate ambiguity of the real world and the literal, determinism of the world of computers. A common approach to the recognition problem is to employ a sequence of feature-detecting filters, each of which removes a certain type of noise. As an example, a vision system in an autonomous vehicle might use a pedestrian detector, which filters out the wide variety of human appearances and poses, leaving only the relevant fact that there is a person to be avoided.

Speech recognition systems typically begin with a speech-to-text transcription system that filters out background noise and regional accents, replacing an audio waveform with text. `token-flow` starts with this transcription and uses knowledge of the conversational domain to replace sequences of words with tokens that represent higher level concepts.

As an example, the phrases `"a couple of"`, `"a pair of"`, `"two"`, `"two more"`, `"double"` and `"dual"` might all correspond to the quantity, `2`, in a certain context. `token-flow` can regularize this sort of input by emitting a `[QUANTITY:2]` token. 

At first glance, it might seem that this sort of regularization could be performed by a simple pattern recognizer that would replace all sequences matching a pattern with a corresponding token. In practice, this approach fails because human language is inherently ambiguous and the process of speaking and transcription introduces errors. 

The presense of errors in the text diminishes the value of exact pattern matching. An approximate matching algorithm can be used to reduce the
The presense of errors precludes the use of exact pattern matching, 


In many cases there simply isn't enough information in the phrase to resolve ambiguity.

errors preclude the use of exact matching
and relaxed matching introduces ambiguity

`token-flow` takes a two-pronged approach
conversational context
domain vocabulary
global tiling

`token-flow` works in conjunction with the next stage to come up with a global tiling that is consistent with the conversational context.

non-greedy
delay all decisions as long as possible

token-flow is not NLP. It has no knowledge of parts of speech. It has no trained language model.

Just as pedestrians crosswalks come in a wide variety of shapes, sizes, positions, and wardrobe


It would be appealing to perform this sort of regularization with a simple pattern recognizer that would replace all instances of a pattern with a corresponding token. 

Human speech is messy, approximate, and ambiguous.

At the word level, it contains [disfluencies](https://en.wikipedia.org/wiki/Speech_disfluency), like `"ah"` and `"um"`, along with unconscious word omissions, repetitions and transpositions, [malapropism](https://en.wikipedia.org/wiki/Malapropism), and other errors. Speech to text transcription systems introduce their own errors, due to factors ranging from background noise to homonyms to regional accents.

At the language level, there are many different ways to express the same concept. For example, `"a couple of"`, `"a pair of"`, `"two"`, `"two more"`, `"double"` and `"dual"` might all correspond to the quantity, `2`, in a certain context. There are no firm rules. In English, modifiers often appear as a noun followed by a preposition, but the roles of the two words can be reversed as in `"a side of guacamole"` and `"guacamole on the side"`.

Ambiguity presents other challenges. Consider the phrase, `"hamburger with cheese fries and a drink."` Are we referring to a `cheeseburger` with `fries` and a `drink` or do we just want a plain `hamburger` with `cheese fries` and a `drink`? 

* Regularization
    * Human speech is rarely precise
        * Messy, approximate, ambiguous
        * Speech disfluencies
        * Malapropism
        * Many ways to convey the same concept
    * Speech to text transcription systems typically introduce addition errors
        * Background noise
        * Speaker accent

## Use a feature extractor for ML/AI or for parser

## Parts of token-flow

Typically, token-flow is configured as a pipeline of recognizers, each of which identifies tokens for a particular domain. A four stage pipeline might consist of recognizers for
* catalog items (e.g. `"sedan"`, `"dump truck"`, `"school bus`", `"fuzzy dice"`)
* numbers (e.g. one, two, three, ... 1, 2, 3, ...)
* quantifiers (e.g. couple of, pair of, some, a few, extra, more)
* intents (e.g. `"I'd like"`, `"remove the"`, `"that's it"`)


4 tires
4 speed transmission

dual headers
dual action wipes

A typical use 

* Pipeline of Recognizers
* Recognizers
* Catalog or Index




 `dog`, `puppy`, `doggie`, `cocker spaniel`, 

token-flow converts a sequence of `Word` tokens 