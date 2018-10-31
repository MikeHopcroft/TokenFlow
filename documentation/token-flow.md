## What is token-flow?

`token-flow` is a Node.JS library that converts text utterances into sequences of tokens with the goal of abstracting away much of the unimportant variation in human language. For example, token-flow might process the following utterance
~~~
something said
~~~
to
~~~
[TOKENS]
~~~

Problem space is called [Named-Entity Recognication](https://en.wikipedia.org/wiki/Named-entity_recognition).

One way to think about token-flow is as the first stage of an intent-processing pipeline. If this pipeline were a compiler, token-flow would be the lexical analyzer. All of the interesting stuff, like parsing, ASTs, register allocation, and code generation would happen after token-flow.

As with the lexical analyzer, token-flow only knows about the lowest level - it can see the trees, but not the forest. Aside from stemming, token-flow does no natural language processing. It
* doesn't know parts of speech
* can't sort out references between words
* does not use AI or ML

In general, token-flow doesn't understand anything about the utterance - it's just a glorified pattern recognizer.

### Why this problem is hard
It turns out that named-entity recognition is actually a hard problem. On the s
* aliases contain other aliases (e.g. `4 wheel drive` contains `4 wheels`)
* aliases start with other tokens (e.g. `4 wheel drive` starts with a number)
* text-to-speech algorithms don't give us punctuation and inflection to sort out modifiers.
* modifiers can come before and after nouns (e.g. `a 4 wheel drive diesel` vs `a diesel 4 wheel drive`)
* different orders
* different ways of saying the same thing
* same term means different things in different contexts
* data driven

## Token-flow principles
* relaxed matching
* exact matching

### Pattern Recognizers
* items
* aliases
* alias generator patterns
* pipelines
* downstream terms

## Token-flow tutorial

### Contemplating a Pipeline
### Entity Recognizer
* token factory
### Number Recognizer
### Quantity Recognizer
### Intent Recognizer
### Putting it all Together


In an analogy with a compiler, token-flow would be the lexical analyzer. In an analogy with a machine vision system, token-flow would do image segmentation and feature extracion.

* not really NLP
* doesn't know parts of speech
* doesn't handle relationships
* does not use AI or machine learning.
* doesn't understand anything
* basically just a glorified pattern recognizer

 the infinite variety 
