Operator rules for SYAlgo:
==========================

In general, the precedence of the operator is given by the
order in which it appears, NOT by the operator itself.  That
is,
    a ~ b ~' c = a ~ (b ~' c).
Therefore, the most general rule is that every new operator
simply gets added to the operator stack.

Once we have the rules for constructing the token stack,
we simply need to define the HTML construction functions and
the order in which we create elements is already taken care of.

Below, ~ may be any of the operators.


Primitive operators
===================
These are the two operators having any real content and have
one simple rule...always add them to the operator stack.

> : has child
-------------
a ~ b > c = a ~ (b > c)

+ : make siblings
-----------------
a ~ b + c = a ~ (b + c)


Convenience Operators
=====================
These operators are merely short hand for the above.

* : repeat + many times
-----------------------
We cannot write this operator out of the token stack due to the
'$' token used to produce attributes.  However, it has the same
simple rule as the two above...always add to the operator stack.

a ~ b * c = a ~ (b * c)

^ : make sibling of parent
--------------------------
This operator is the most annoying and will be written out of
the operator stack all together.  It only contributes to the
"global" structure and does not provide any information about
individual elements.

Rule: Pop last operator off operator stack ONTO token stack,
then add a '+' to operator stack.

a ~ b ^ c = (a ~ b) + c
a ~ b ^ c ~ d = (a ~ b) + (c ~ d)

RESULT:  While parsing emmet syntax, we need only worry about
parethesis and '^'.  All other operators go directly to the
operator stack.
