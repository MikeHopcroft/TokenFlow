# Text-to-Number Matcher

The `Text-to-Number Matcher` identifies all non-negative integers that match a the head of a sequence of words. For example, the sequence, `"five hundred eighty six thousand and two hundred five"` matches the following integers:
~~~
5
500
580
586
586,000
586,002
586,200
586,205
~~~

Generating all possible matches helps in parsing sentences like
~~~
I would like a can of w d forty three hundred screws and a screwdriver
~~~

In this case, a maximal-length number matcher would interpret this sentence as meaning
~~~
I would like a can of w d 4300 screws and a screwdriver
~~~
when we need to also consider
~~~
I would like a can of w d 40 300 screws and a screwdriver
~~~

Another example would be
~~~
twenty four wheel drive vehicles
~~~

In this case we likely want to consider
~~~
20 4 wheel drive vehicles
~~~

in addition to
~~~
24 wheel drive vehicles
~~~

## Grammar

### VALUE (V)
A non-negative integer value, `0 <= x <= 1e+12`.
~~~
V = [MQ M6] [MQ M3] [MQ] | Z
~~~

### MAGNITUDE QUANTIFIER (MQ)
A number, `1 <= x <= 999`, that can be used to quantify a magnitude like
`thousand`, `million`, `billion`, etc. For example, `seven hundred
sixty eight` as in `seven hundred sixty eight million`.

~~~
MQ = HQ M2 [[`and`] TV] |
     TV |
     `a`
~~~

Examples include
* `seven hundred` thousand
* `seven hundred sixty eight` million
* `seven hundred and sixty eight` billion
* `sixty eight` thousand
* `eight` million
* `a` billion

### HUNDREDS QUANTIFIER (HQ)
A number, 1 <= x <= 99, that can be used to quantify the `hundred`
magnitude. For example, `sixty three` as in `sixty three hundred`.
Note that multiples of 10 cannot quantify the `hundred` magnitude.
The word, `a`, is also an HC, as in `a hundred`.

~~~
HQ = [a, 1..9, 11..19] | QT QD
~~~

Examples include
* `a` hundred
* `five` hundred
* `fourteen` hundred
* `twenty three` hundred

### TENS VALUE (TV)
A number, 1 <= x <= 99. Note that TV differs from HQ in that it includes
multiples of 10.

~~~
TV = QU | QT | QT QD
~~~

Examples include
* `one`
* `two`
* `ten`
* `seventeen`
* `twenty`
* `seventy three`

### QUANTIFYING UNITS (QU)
A number, 1 <= x <= 19. Examples include `one`, `two`, `ten`, and `seventeen`.

~~~
QU = [1..9, 10, 11..19]
~~~

### QUANTIFYING TENS (QT)
A number, 20 <= x <= 90, where x is a multiple of 10. Examples include
`twenty`, `thirty`, etc.

~~~
QT = [20, 30, 40, 50, 60, 70, 80, 90]
~~~

### QUANTIFYING DIGITS (QD)
A single, non-zero decimal digit. Examples include `one`, `five`, and `nine`.

~~~
QD = [1..9]
~~~

### BILLIONS MAGNITUDE (M9)
The word, `billion`.

### MILLIONS MAGNITUDE (M6)
The word, `million`.

### THOUSANDS MAGNITUDE (M3)
The word, `thousand`.

### HUNDREDS MAGNITUDE (M2)
The word, `hundred`.

### ZERO (Z)
The word, `zero`.

