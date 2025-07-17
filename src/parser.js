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
            Action_element: (action, _sp, element) => ({
                type: action.eval(),
                target: element.eval()
            }),
            Action_string: (action, _sp, str) => ({
                type: action.eval(),
                text: str.sourceString.slice(1, -1)
            }),
            ActionOnElement: (click) => click.sourceString,
            ActionWithString: (type) => type.eval(),
            ActionWithStringType: (type) => type.sourceString,
            Element_single: (id) => id.sourceString,
            Element_multi: (_, ids, __) => ids.eval(),
            MultiIdentifier: (ids) => ids.asIteration().children.map(c => c.sourceString).join(' ')
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
