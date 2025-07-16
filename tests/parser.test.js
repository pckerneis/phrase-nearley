const nearley = require('nearley');
const grammar = require('../src/grammar.js');

describe('Parser Initialization', () => {
    it('should initialize parser with grammar', () => {
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        console.log('Parser initialized successfully');
    });
});
