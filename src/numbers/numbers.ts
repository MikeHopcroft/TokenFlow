/*

one seventy three - is this implied hundreds?
twenty nineteen - is this implied hundreds?

DIGIT = [0..9]
QUANTIFYING_DIGIT = [1..9]

UNITS = [0..19]
QUANTIFYING_UNITS = [1..9, 11..19]

TENS = [10, 20, 30, 40, 50, 60, 70, 80, 90]
QUANTIFYING_TENS = [20, 30, 40, 50, 60, 70, 80, 90]
MAGNITUDES = [100, 1000, 1000000, ...]


one, two, seventeen
UNITS

ten, twenty, thirty ...
TENS

twenty three
X ten three
X twenty zero
TENS UNITS

one hundred five
one hundred a five
one hundred twenty three

X ten hundred
ten thousand
ten milltion
X twenty hundred
a thousand
a hundred
two thousand
fifteen hundred
fifteen hundred thousand
X two thousand thousand
five hundred thousand two hundred eighty six
X fifteen hundred two hundred eighty six
fifteen hundred eighty six
? fifteen hundred thousand two hundred eighty six
(((five hundred) twenty seven) million) (((three hundred) sixty four) thousand) ((two hundred) eighty six)
((((fifty five) hundred) twenty seven) million) (((thirty three hundred) sixty four) thousand) ((twenty two hundred) eighty six)
UNITS MAGNITUDES

VALUE =
//    [MQ 'million'] [MQ 'thousand'] [MQ 'hundred'] [['and'] TV] |
    [MQ 'million'] [MQ 'thousand'] [MQ] |
    'zero'

V = [MQ 'million'] [MQ 'thousand'] [MQ] |
    'zero'

MQ = 'a' | TV

TV = QU | QT QD

QU = [1..9, 10, 11..19]

QT = [20, 30, 40, 50, 60, 70, 80, 90]

QD = [1..9]

MAGNITUDE_QUANTIFIER =
    [HUNDREDS_QUANTIFIER 'hundred'] [['and'] TENS_VALUE]
//    [HUNDREDS_QUANTIFIER 'hundred'] ['and'] (QUANTIFYING_UNITS | QUANTIFYNG_TENS [QUANTIFYING_DIGIT])

HUNDREDS_QUANTIFIER =
    'a' |
    QUANTIFYING_UNITS |
    QUANTIFYING_TENS QUANTIFYING_DIGITS

TENS_VALUE =
    QUANTIFYING_UNITS |
    QUANTIFYING_TENS QUANTIFYING_DIGITS


REGION =
    [MAGNITUDE_QUANTIFIER MAGNITUDE]


*/