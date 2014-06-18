/**
 * Still in production!
 *
 * Goal: to provide a method for creating DOM elements quickly at runtime
 * with a small amount of code.  The Emmet toolkit[http://emmet.io/]
 * provides an abbreviation syntax [see http://docs.emmet.io/abbreviations/syntax/]
 * which we shamelessly pirate for consistency to the user and its injenuity
 * (thanks Emmet developers!).
 *
 * The Conjure.js module exposes a single (maybe more in the future) function:
 *
 * Conjure.element(emmetStr)
 *
 * where emmetStr is a string consiting of emmet abbreviation syntax.
 * This function outputs a string which is the expansion of the abbreviation
 * syntax. This final string may then be operated on in any manner and added
 * to the DOM.
 *
 * @return {string} HTML expansion of emmet abreviation syntax.
 */
var Conjure = (function() {

    var operator = /[\(\)>\^\*+]/,
        tokens = [],
        stack = [];

    /**
     * Hash to simplify conditional in SYAlgo.
     * @type {Object}
     */
    var badOp = {
        '^': false,
        ')': false
    };

    /**
     * obtain RPN for expr using Shunting-yard algorithm.
     * @param {array} expr emmet string to be parsed
     */
    var SYAlgo = function(expr) {

        var i = expr.search(operator), // -1 if no operator, > 0 if operator is NOT first charactor
            currentOp = expr[0];

        while (++i) { // if there is an operator
            if (i - 1) { // and it is NOT the first character
                tokens.push(expr.slice(0, i));
            } else if (!badOp[currentOp]) { // if it is the first character and simple
                stack.push(currentOp);
            } else if (currentOp === '^') { // deal with '^' (see op_rules file)
                tokens.push(stack.pop());
                stack.push('+');
            } else { // otherwise we have a closing parenthesis
                len = stack.length;
                while (stack[--len] !== '(') {
                    tokens.push(stack.pop());
                }
                stack.pop();
            }
            expr = expr.slice(i); // remove token we just processed and repeat
            i = expr.search(operator);
        } // we have removed all operators from expr

        tokens.push(expr); // push remaining token

        len = stack.length;
        while (len--) { // push remaining operators
            tokens.push(stack.pop());
        } // stack is now empty
    };

    /**
     * This dictionary of functions defines what the emmet operators
     * do to the non-operator tokens.
     * @type {Object}
     */
    var opFuncHash = {

        '>': function(a, b) { // make a the parent of b

        },

        '*': function(a, b) { // repeat a, b times

        },

        '+': function(a, b) { // make a and b siblings

        },
    };

    /**
     * Here we obtain the RPN array tokens from SYAlgo, then construct
     * the HTML expansion.
     * @param  {string} expr emmet abbreviation syntax
     * @return {string}      HTML expansion of expr
     *
     * Future: return an actual DOM/JQuery/other object rather than a string?
     */
    var construct = function(expr) {
        SYAlgo(expr);
        tokens.reverse();
        var len = tokens.length;

        while (len--) {
            if (!opFuncHash[tokens[len]]) { // if the token is not an operator
                stack.push(tokens.pop());
            } else {
                stack.push(opFuncHash[tokens[len]](stack.pop(), stack.pop()));
            }
        }
    };

    return {
        element: construct
    };

})();
