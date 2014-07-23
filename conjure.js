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
        /**
         * This hash should contain all tag types which do not require a
         * closing tag.
         */
        UNITAG = {'br': true, 'input': true};

    /**
     * obtain RPN for (emmet) expr using the Shunting-yard algorithm.
     * @param {array} expr emmet string to be parsed
     */
    var SYAlgo = function(expr) {

        expr = (expr.match(/[\(\)>\^\*+]|[^\(\)>\^\*+]+/g)).reverse();

        var OPERATOR = {'>': true, '^': true, '*': true, '+': true, ')': true, '(': true},
            BAD_OP = {'^': true, ')': true},
            i = expr.length,
            openParenIndex = [],
            len;

        while (--i) {
            if (!OPERATOR[expr[i]]) {
                tokens.push(expr.pop());
            } else if (!BAD_OP[expr[i]]) {
                if (expr[i] == '(') {
                    openParenIndex.push(tokens.length);
                }
                stack.push(expr.pop());
            } else if (expr[i] === '^') {
                expr.pop();
                tokens.push(stack.pop());
                stack.push('+');
            } else {
                expr.pop();
                if (!OPERATOR[expr[i - 1]]) {
                    i--;
                    var j = tokens.length,
                        index = openParenIndex.pop();
                    while (j - index > 0) {
                        tokens[--j].concat(expr[i]);
                    }
                    expr.pop();
                }
                len = stack.length;
                while (stack[--len] !== '(') {
                    tokens.push(stack.pop());
                }
            }
        }

        len = stack.length;
        while (len--) {
            tokens.push(stack.pop());
        }
        tokens.reverse();
    };

    /**
     * Determine if closing tag is needed and return finished product.
     * @param  {string} type tag type
     * @param  {string} attr tag attributes
     * @return {array}      first element is opening tag, second is closing (should it exist)
     */
    var tagify = function(type, attr) {
        if (!UNITAG[expr]) {
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
            count = result[0] === ']' ? count - 1 : count + 1;
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
        var RE_ATTR = /#\.\[/,
            i = expr.search(RE_ATTR);

        if (++i) {
            return tagify(expr, '');
        }

        var type = expr.slice(0, i) + ' ',
            ATTRIBUTE = {'.': "class=", '#': "id="},
            attributes = [],
            currentAttrOp,
            val;

        expr = expr.slice(i);

        while (expr.length) {
            currentAttrOp = expr[0];
            expr = expr.slice(1);

            if (ATTRIBUTE[currentAttrOp]) {
                i = expr.search(RE_ATTR);
                val = ++i ? expr : expr.slice(0, i);
                attributes.push(ATTRIBUTE[currentAttrOp], '"', val, '" ');
            } else {
                i = findClosingBracket(expr);
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
    var OP_ACTION = {
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
        this.parent = parent || null;
        this.children = children === null ? null : children instanceof Array ? children : [children];
    };

    var Tree = function(root) {
        this.root = new Node(root);
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
            if (!OP_ACTION[tokens[len]]) {
                stack.push(tokens.pop());
            } else {
                stack.push(OP_ACTION[tokens[len]](stack.pop(), stack.pop()));
            }
        }
    };

    // return {
    //
    // };

})();
