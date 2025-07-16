const nearley = require('nearley');
const moo = require('moo');

const lexer = moo.compile({
    ws: /[ \t]+/,
    nl: { match: /\n/, lineBreaks: true },
    string: /"(?:\\["\\]|[^\n"\\])*"/,
    word: /[a-zA-Z][a-zA-Z0-9]*/,
    element_word: /[A-Z][a-zA-Z0-9]*/,
    identifier: /\{[a-zA-Z_][a-zA-Z0-9_]*\}/,
    colon: ':',
    with: 'with',
    as: 'as',
    fill: 'fill',
    click: 'click',
    visit: 'visit',
    in_order_to: 'in order to'
});

class Parser {
    constructor() {
        const grammar = require('./grammar.js');
        this.parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    }

    parse(input) {
        this.parser.feed(input);
        const results = this.parser.results;
        this.parser = new nearley.Parser(nearley.Grammar.fromCompiled(require('./grammar.js')));
        return results;
    }
}

module.exports = { Parser };
