const moo = require('moo');
const assert = require('assert');

const lexer = moo.compile({
    ws: /[ \t]+/,
    nl: { match: /\n/, lineBreaks: true },
    string: /"(?:\\["\\]|[^\n"\\])*"/,
    identifier: /\{[a-zA-Z_][a-zA-Z0-9_]*\}/,
    colon: ':',
    keywords: {
        fill: 'fill',
        click: 'click',
        visit: 'visit',
        with: 'with',
        as: 'as',
        in_order_to: 'in order to'
    },
    element_word: /[A-Z][a-zA-Z0-9]*/,
    word: /[a-zA-Z][a-zA-Z0-9]*/
});

describe('Lexer Tests', () => {
    it('should tokenize fill action correctly', () => {
        lexer.reset('fill Username Field with "john"');
        const tokens = Array.from(lexer);
        console.log('Tokens:', tokens);
        
        assert.equal(tokens[0].type, 'keywords');
        assert.equal(tokens[0].value, 'fill');
        assert.equal(tokens[2].type, 'element_word');
        assert.equal(tokens[2].value, 'Username');
        assert.equal(tokens[4].type, 'element_word');
        assert.equal(tokens[4].value, 'Field');
        assert.equal(tokens[6].type, 'keywords');
        assert.equal(tokens[6].value, 'with');
        assert.equal(tokens[8].type, 'string');
        assert.equal(tokens[8].value, '"john"');
    });

    it('should tokenize macro definition correctly', () => {
        lexer.reset('in order to login as {user}:');
        const tokens = Array.from(lexer);
        console.log('Tokens:', tokens);
        
        assert.equal(tokens[0].type, 'keywords');
        assert.equal(tokens[0].value, 'in order to');
        assert.equal(tokens[2].type, 'word');
        assert.equal(tokens[2].value, 'login');
        assert.equal(tokens[4].type, 'keywords');
        assert.equal(tokens[4].value, 'as');
        assert.equal(tokens[6].type, 'identifier');
        assert.equal(tokens[6].value, '{user}');
    });
});
