const fs = require('fs');
const path = require('path');
const ohm = require('ohm-js');

class Parser {
    constructor() {
        const grammarFile = path.join(__dirname, 'grammar.ohm');
        const grammarContent = fs.readFileSync(grammarFile, 'utf-8');
        this.grammar = ohm.grammar(grammarContent);
        this.semantics = this.grammar.createSemantics().addOperation('eval', {
            Main: (_leadingNl, statements, _trailingNl) => statements.asIteration().children.map(c => c.eval()),
            Statement: (action) => action.eval(),
            action: function(action, _sp, target) {
                const type = action.eval();
                if (target.ctorName === 'string') {
                    return {
                        type,
                        text: target.sourceString.slice(1, -1)
                    };
                } else {
                    return {
                        type,
                        target: target.eval()
                    };
                }
            },
            actionOnElement: (click) => click.sourceString,
            actionWithString: (type) => type.eval(),
            actionWithStringType: (type) => type.sourceString,
            element_single: (id) => id.sourceString,
            element_multi: (_open, _sp1, ids, _sp2, _close) => ids.eval(),
            multiIdentifier: (ids) => ids.asIteration().children.map(c => c.sourceString).join(' ')
        });
    }

    parse(input) {
        const matchResult = this.grammar.match(input);
        if (!matchResult.succeeded()) {
            throw new Error('Failed to parse input:\n' + matchResult.message);
        }
        return this.semantics(matchResult).eval();
    }
}

module.exports = { Parser };
