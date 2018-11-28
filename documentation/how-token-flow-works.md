# How token-flow works

`token-flow` converts human-readable text into a sequence of `tokens` that represent meaning and user intent at a higher semantic level than words alone. Human speech and text is mess]y and approximate and has many different ways to express the same concept. For example, `"a couple of"`, `"a pair of"`, `"two"`, `"two more"`, `"double"` and `"dual"` might all correspond to the quantity, `2`, in a certain context.

token-flow attempts to simplify the sentence by replacing each of these phrases with a `token` denoting a quanity:

**IMAGE - I'd like a couple of fuzzy dice**

In this example, we've replaced the infinite variability of text with tokens representing quantities. In a similar way, we can identify and tokenize concepts like the intent to add an item to a shopping cart (`"I'd like"` or `"Please get me"`) or the names of catalog items (`"sedan"` or `"dice"`) or modifiers (`"red"`, or `"fuzzy"`)/

**IMAGE - I'd like a couple of fuzzy dice**

By replacing the infinite variability of text with tokens, we simplify the job of downstream code tasked with carrying out the user's intent.



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