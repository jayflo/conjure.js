var Conjure = (function() {

    var operator = /[\(\)>\^\*+]/,
        tokens = [],
        stack = [];

    /**
     * returns true when precedence of operator f is less than
     * that of g
     * @param  {string} f string representing emmet operator
     * @param  {string} g ibid
     * @return {boolean} true when precendence of f <= g
     */
    var prec = function(f, g) {};

    /**
     * elements of tokens represent the RPN of expr
     * @param {array} expr : emmet string to be parsed
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
                        stack.pop();
                    } else {
                        while (prec(currentOp, stack[len - 1])) {
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

    var opHash = {
        '(': function(a, b) {

        },

        ')': function(a, b) {

        },

        '>': function(a, b) {

        },

        '^': function(a, b) {

        },

        '*': function(a, b) {

        },

        '+': function(a, b) {

        },

    };

    var create = function(expr) {
        SYAlgo(expr);
        var len = tokens.length;

        while (len--) {
            if (!opHash[tokens[len]]) { // if the last token is not an operator
                stack.push(tokens.pop());
            } else {
                stack.push(opHash[tokens[len]](stack.pop(), stack.pop()));
            }
        }
    };

})();
