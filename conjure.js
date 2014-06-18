/**
 * Still in production!
 *
 * Goal: to provide a method for creating DOM elements quickly at runtime
 * with a small amount of code.  The Emmet toolkit[http://emmet.io/]
 * provides an abbreviation syntax [see http://docs.emmet.io/abbreviations/syntax/]
 * which we shamelessly pirate for consistency to the user and its injenuity
 * (thanks Emmet developers!).
 *
 * The Conjure.js module exposes one (maybe more in the future) function:
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
     * This hash value precLTE[f][g] is true when the precedence
     * of operator f is less than or equal to that of operator g.
     * @type {Object}
     */
    var precLTE = { // need to actually configure this
        '>': {

            '^': true,
            '*': true,
            '+': true
        },
        '^': {

            '>': true,
            '*': true,
            '+': true
        },
        '*': {

            '>': true,
            '^': true,
            '+': true
        },
        '+': {

            '>': false,
            '^': true,
            '*': true
        },
    };

    /**
     * obtain RPN for expr using Shunting-yard algorithm.
     * @param {array} expr emmet string to be parsed
     */
    var SYAlgo = function(expr) {

        var i = expr.search(operator), // i>0 means first character is not an stack
            currentOp, len;

        while (++i) { // if there is an stack
            if (i - 1) { // and it is NOT the first character
                tokens.push(expr.slice(0, i));
            } else {
                len = stack.length;
                currentOp = expr[0];

                if (!len || currentOp === '(') {
                    stack.push(currentOp);
                } else {
                    if (currentOp === ')') {
                        while (stack[len - 1] !== '(') {
                            tokens.push(stack.pop());
                        }
                        stack.pop(); // ')' is removed from expr at end of while loop
                    } else {
                        while (precLTE[currentOp][stack[len - 1]]) {
                            tokens.push(stack.pop());
                        }
                        stack.push(currentOp);
                    }
                }
            }
            expr = expr.slice(i);
            i = expr.search(operator);
        } // we have removed all stacks from expr

        tokens.push(expr); // push on last non-stack

        len = stack.length;
        while (len--) {
            tokens.push(stack.pop());
        }
        stack = []; // for good measure
    };

    /**
     * This dictionary of functions defines what the emmet operators
     * do to the non-operator tokens.
     * @type {Object}
     */
    var opHash = {

        '>': function(a, b) { // make a the parent of b

        },

        '^': function(a, b) { // move up a level

        },

        '*': function(a, b) { // repeat a b times

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
        SYAlgo(expr); // may need to reverse
        var len = tokens.length;

        while (len--) {
            if (!opHash[tokens[len]]) { // if the last token is not an operator
                stack.push(tokens.pop());
            } else {
                stack.push(opHash[tokens[len]](stack.pop(), stack.pop()));
            }
        }
    };

    return {
        element: construct
    };

})();
