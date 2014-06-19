/**
 * Still in production!
 *
 * Goal: to provide a method for creating DOM elements quickly at runtime
 * with a small amount of code.  The Emmet toolkit[http://emmet.io/]
 * provides an abbreviation syntax [see http://docs.emmet.io/abbreviations/syntax/]
 * which we shamelessly pirate for consistency to the user and its injenuity
 * (thanks Emmet developers!).
 *
 * The Conjure.js module exposes a couple (maybe more in the future) functions:
 *
 * Conjure.HTML(emmetStr)
 * Conjure.element(emmetStr)
 *
 * where emmetStr is a string consiting of emmet abbreviation syntax.
 * This function outputs a string/DOM element which is the expansion of the
 * abbreviation syntax. This final string may then be operated on in any manner
 * and added to the DOM.
 *
 * @return {string} HTML expansion of emmet abreviation syntax.
 */
var Conjure = (function() {
    var tokens = [],
        stack = [],
        len;

    /**
     * obtain RPN for expr using Shunting-yard algorithm.
     * @param {array} expr emmet string to be parsed
     */
    var SYAlgo = function(expr) {

        var re = /[\(\)>\^\*+]|[^\(\)>\^\*+]+/g,
            operator = {
                '>': true,
                '^': true,
                '*': true,
                '+': true,
                ')': true,
                '(': true
            },
            badOps = {
                '^': true,
                ')': true
            };

        expr = (expr.match(operator)).reverse();
        var i = expr.length,
            len;

        while (--i) { // if there is an operator
            if (!operator[expr[i]]) {
                tokens.push(expr.pop());
            } else if (!badOps[expr[i]]) {
                stack.push(expr.pop());
            } else if (expr[i] === '^') { // deal with '^' (see op_rules file)
                tokens.push(stack.pop());
                stack.push('+');
            } else { // otherwise we have a closing parenthesis
                len = stack.length;
                while (stack[--len] !== '(') {
                    tokens.push(stack.pop());
                }
                stack.pop();
            }
        } // we have removed all operators from expr

        len = stack.length;
        while (len--) { // push remaining operators
            tokens.push(stack.pop());
        } // stack is now empty
        tokens.reverse(); // construct needs to read tokens from bottom
    };

    /**
     * This has should contain all tag types which do not require a
     * closing tag.
     * @type {Object}
     */
    var uniTag = {
        'br': true,
        'input': true
    };

    /**
     * Determine if closing tag is needed and return finished product.
     * @param  {string} expr formatted tag type and attributes
     * @param  {string} text text provided from {text} syntax.
     * @return {string}      complete HTML tag
     */
    var tagify = function(expr, text) {
        if (!uniTag[expr]) {
            return ['<', expr, '>', text, '</', expr, '>'].join('');
        } else {
            return ['<', expr, '>'].join('');
        }
    };

    /**
     * Assuming only match brackets, find closing bracket.
     * @param  {string} expr find closing bracket here
     * @return {number}      index of closing bracket
     */
    var findClosingBracket = function(expr) {
        var count = 1,
            re = /[\[\]]/g,
            result;

        while (count > 0) {
            result = re.exec(expr);
            if (result[0] === ']') {
                count--;
            } else {
                count++;
            }
        }
        return result.index;
    };

    /**
     * Changes a token into HTML tag.  We must work through expr manually since
     * the custom attribute and text brackets may contain attr operators themselves.
     * So we are unable to use a generic regular expression. RULES:
     * 1) Custom attribute tags [] must contain only matched brackets
     * 2) Text attribute tags {} must go last
     *
     * @param  {string} expr a token parsed from emmet syntax
     * @return {string}      HTML expansion of the token
     */
    var createTag = function(expr) {
        var attrOps = /#\.\[\]\{\}/,
            i = expr.search(attrOps);

        if (++i) { // expr has no attributes
            return tagify(expr);
        }

        var tag = expr.slice(0, i) + ' ', // characters before first attribute comprise tag
            attrHash = {
                '.': "class=",
                '#': "id="
            }, attr, val;
        expr = expr.slice(i); // leave only attribute(s)

        while (expr.length) { // format all attributes
            attr = expr[0];
            expr = expr.slice(1);
            i = expr.search(attrOps); // index of next attribute operator (should it exist)

            if (attrHash[attr]) {
                val = ++i ? expr : expr.slice(0, i);
                tag = [tag, attrHash[attr], '"', val, '" '].join('');
                val = '';
            } else if (attr === '[') {
                i = findClosingBracket(expr);
                tag = [tag, ' ', expr.slice(0, ++i), ' '].join('');
            } else {
                val = expr.slice(1, -1);
                expr = '';
                i = 0;
            }
            expr = expr.slice(i);
        }
        return tagify(tag, val);
    };

    /**
     * This dictionary of functions defines what the emmet operators
     * do to the non-operator tokens.
     * @type {Object}
     */
    var opHash = {
        /**
         * These functions define the emmet syntax operators.  The argument b,
         * which is popped off the stack second, is the single token which is
         * to be merged into a, the accumulation of the previous operations.
         * @param  {string} a the HTML which is the sum total of merges up to
         *                    this point
         * @param  {string} b the new token to be merged into a
         * @return {string}   new HTML with b merged into a
         */
        '>': function(a, b) {

        },

        '*': function(a, b) { // untangle $, @ modifiers here, then make multiple calls to createTag

        },

        '+': function(a, b) {

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
        var len = tokens.length;

        while (len--) {
            if (!opHash[tokens[len]]) { // if the token is not an operator
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
