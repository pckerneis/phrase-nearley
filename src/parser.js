const nearley = require('nearley');
const grammar = require('./grammar.js');

class Parser {
    constructor() {
    }

    reset() {
        this.parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    }

    parse(input) {
        this.reset();
        this.parser.feed(input);
        const results = this.parser.results;

        if (results.length === 0) {
            throw new Error('No results found');
        }

        return results[0];
    }
}

module.exports = { Parser };
