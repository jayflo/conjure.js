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
        stack = [];

    /**
     * obtain RPN for expr using the Shunting-yard algorithm.
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
            },
            openParenIndex = [],
            len;

        expr = (expr.match(operator)).reverse(); // assumes attributes do not contain any operator
        var i = expr.length;

        while (--i) { // if there is an operator
            if (!operator[expr[i]]) {
                tokens.push(expr.pop());
            } else if (!badOps[expr[i]]) {
                if (expr[i] == '(') {
                    openParenIndex.push(tokens.length); // all tokens after this index are inside current parentheses
                }
                stack.push(expr.pop());
            } else if (expr[i] === '^') {
                expr.pop();
                tokens.push(stack.pop());
                stack.push('+');
            } else { // otherwise we have a closing parenthesis
                expr.pop(); // pop off parenthesis
                if (!operator[expr[i - 1]]) { // next token must be attributes, so distribute to tokens.
                    i--;
                    var j = tokens.length;
                    index = openParenIndex.pop();
                    while (j - index > 0) {
                        tokens[--j].concat(expr[i]);
                    }
                    expr.pop(); // pop off attribute
                }
                len = stack.length;
                while (stack[--len] !== '(') {
                    tokens.push(stack.pop());
                }
            }
        } // we have removed all operators from expr

        len = stack.length;
        while (len--) { // push remaining operators
            tokens.push(stack.pop());
        } // stack is now empty
        tokens.reverse(); // buildTree needs to read tokens from bottom
    };

    /**
     * This hash should contain all tag types which do not require a
     * closing tag.
     * @type {Object}
     */
    var uniTag = {
        'br': true,
        'input': true
    };

    /**
     * Determine if closing tag is needed and return finished product.
     * @param  {string} type tag type
     * @param  {string} attr tag attributes
     * @return {array}      first element is opening tag, second is closing (should it exist)
     */
    var tagify = function(type, attr) {
        if (!uniTag[expr]) {
            return ['<'.concat(type, attr, '>'), '</'.concat(type, '>')];
        } else {
            return ['<'.concat(type, attr, '>')];
        }
    };

    /**
     * Assuming only matching brackets exist, find closing bracket.
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
     * 1) no attribute can contain emmet operators (see SYAlgo.operators)
     * 2) Custom attribute tags [] must contain only matched brackets
     *
     * @param  {string} expr a token parsed from emmet syntax
     * @return {array}       first element is opening tag, second is closing (should it exist)
     */
    var createTag = function(expr) {
        var attrRe = /#\.\[/,
            i = expr.search(attrRe);

        if (++i) { // expr has no attributes, leave quick.
            return tagify(expr, '');
        }

        var type = expr.slice(0, i) + ' ',
            attrHash = {
                '.': "class=",
                '#': "id="
            },
            attributes = [],
            currentAttrOp, val;
        expr = expr.slice(i); // leave only attribute(s)

        while (expr.length) { // format all attributes
            currentAttrOp = expr[0];
            expr = expr.slice(1);

            if (attrHash[currentAttrOp]) {
                i = expr.search(attrRe); // index of next attribute operator (should it exist)
                val = ++i ? expr : expr.slice(0, i);
                attributes.push(attrHash[currentAttrOp], '"', val, '" ');
            } else {
                i = findClosingBracket(expr); // assumes custom attributes do not contain mismatched square brackets
                attributes.push(expr.slice(0, i), ' ');
                i++;
            }
            expr = expr.slice(i);
        }
        return tagify(type, attributes.join(''));
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
         * @param  {array}  a
         * @param  {string} b the new token to be merged into a
         * @return {array}   new HTML with b merged into a
         */
        '>': function(a, b) {

        },

        '*': function(a, b) { // untangle $, @ modifiers here, then make multiple calls to createTag

        },

        '+': function(a, b) {

        },
    };

    /**
     * Standard tree classes used to keep track of parent/child
     * relationship between tags.
     * @param  {array} tag      of type returned from tagify
     * @param  {node} parent    parent of current node
     * @param  {array} children array of children nodes
     */
    var Node = function(tag, parent, children) {
        this.tag = tag;
        this.parent = parent || undefined;
        this.children = children === undefined ? undefined : children instanceof Array ? children : [children];
    };

    var Tree = function(root) {
        var root = new Node(root)
        this.nodes = [this.root];
        this.prototype.Forest.push(this);
    };

    Tree.prototype.Forest = [];
    Tree.prototype.addNode = function(tag, parent, children) {
        var node = new Node(tag, parent, children);
        this.nodes.push(node);
    };

    /**
     * Here we obtain the RPN array tokens from SYAlgo, then buildTree
     * the HTML expansion.
     * @param  {string} expr emmet abbreviation syntax
     * @return {forest}      forest representing parent/child structure of html tags
     *
     * Future: return an actual DOM/JQuery/other object rather than a string?
     */
    var buildTree = function(expr) {
        SYAlgo(expr);

        var ensemble = new Tree(tokens.pop);



        while (len--) {
            if (!opHash[tokens[len]]) { // if the token is not an operator
                stack.push(tokens.pop());
            } else {
                stack.push(opHash[tokens[len]](stack.pop(), stack.pop()));
            }
        }
    };

    // return {
    //
    // };

})();
