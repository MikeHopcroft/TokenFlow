/*

VALUE (V)
MAGNITUDE QUANTIFIER (MQ)
A number, 1 <= x <= 999, that can be used to quantify a magnitude like
'thousand', 'million', 'billion', etc. For example, 'seven hundred
sixty eight' as in 'seven hundred sixty eight million'.

V = [MQ 'million'] [MQ 'thousand'] [MQ] | 'zero'


HUNDREDS QUANTIFIER (HQ)
A number, 1 <= x <= 99, that can be used to quantify the 'hundred'
magnitude. For example, 'sixty three' as in 'sixty three hundred'.
Note that multiples of 10 cannot quantify the 'hundred' magnitude.
The word, 'a', is also an HC, as in 'a hundred'.

TENS VALUE (TV)
A number, 1 <= x <= 99. Note that TV differs from HQ in that it includes
multiples of 10.

QUANTIFYING UNITS (QU)
A number, 1 <= x <= 19. Examples include 'one', 'two', 'ten', and 'seventeen'.

QUANTIFYING TENS (QT)
A number, 20 <= x <= 90, where x is a multiple of 10. Examples include
'twenty', 'thirty', etc.

QUANTIFYING DIGITS (QD)
A single, non-zero decimal digit. Examples include 'one', 'five', and 'nine'.

BILLIONS MAGNITUDE (M9)
The word, 'billion'.

MILLIONS MAGNITUDE (M6)
The word, 'million'.

THOUSANDS MAGNITUDE (M3)
The word, 'thousand'.

HUNDREDS MAGNITUDE (M2)
The word, 'hundred'.

V = [MQ 'million'] [MQ 'thousand'] [MQ] | 'zero'
MQ = (('a' | TV) 'hundred' [['and'] TV]) | TV
MQ = [HQ 'hundred' [['and'] TV] |
     TV |
     'a'
HQ = [a, 1..9, 11..19] | QT QD
TV = QU | QT | QT QD
QU = [1..9, 10, 11..19]
QT = [20, 30, 40, 50, 60, 70, 80, 90]
QD = [1..9]

one, two, seventeen
    V => MQ => TV => QU
zero
    V
ten
    V => MQ => TV => QU
twenty, thirty ...
    V => MQ => TV => QT
twenty three
    V => MQ => QT QD
X ten three
    V => MQ => QU X
X twenty zero
    V => MQ => QT X
one hundred five
    V => MQ => TV 'hundred' TV
one hundred and five
    V => MQ => TV 'hundred' TV
one hundred twenty three
    V => MQ => TV 'hundred' TV => QU H QT QD
X ten hundred
    PROBLEM: QU contains 10 so match is QU H
ten thousand
    V => MQ 'thousand' => TV 'thousand' => QU 'thousand'
ten million
    V => MQ M6 => TV M6 => QU M6
X twenty hundred
    PROBLEM: QT contains 20 so match QT H
a thousand
    V => MQ M3 => A M3
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


*/
