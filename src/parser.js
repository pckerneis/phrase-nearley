const nearley = require('nearley');

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
