const fs = require('fs');
const path = require('path');
const ohm = require('ohm-js');

class Parser {
  constructor() {
    this.macros = new Map();
    const grammarFile = path.join(__dirname, 'grammar.ohm');
    const grammarContent = fs.readFileSync(grammarFile, 'utf-8');
    this.grammar = ohm.grammar(grammarContent);
    this.semantics = this.grammar.createSemantics().addOperation('eval', {
      _iter: (...children) => children.map(c => c.eval()),
      main: (_leadingNl, statements, _trailingNl) => {
        return statements.asIteration().children.map(c => c.eval());
      },
      statement: (action) => action.eval(),
      action: function (action, _sp, target) {
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
      multiIdentifier: (ids) => ids.asIteration().children.map(c => c.sourceString).join(' '),
      macro: (header, _sp, body) => {
        const { fragments, params } = header.eval();
        return {
          type: 'macro',
          header: fragments,
          params,
          body: body.eval()
        };
      },
      macroHeader: (_inOrderTo, _sp, identifier, _colon) => identifier.eval(),
      macroIdentifier: (first, _sp, rest) => {
        const fragments = [first.sourceString, ...(rest.children?.[0]?.asIteration()?.children.map(c => c.eval()) ?? [])];
        return {
          fragments,
          params: fragments.filter(f => typeof f === 'object').map(f => f.param),
        };
      },
      macroIdentifierFragment_parameter: (fragment) => fragment.eval(),
      macroIdentifierFragment_identifier: (fragment) => fragment.sourceString,
      macroParameter: (_open, name, _close) => ({ param: name.sourceString }),
      macroBody: (statements) => statements.asIteration().children.map(c => c.eval()),
      indentedStatement: (_sp, statement) => statement.eval(),
      macroCall: (first, _sp, rest) => {
        const fragments = [
            first.sourceString, ...rest.children[0].asIteration().children.map(c => c.eval()),
        ];
        return {
          type: 'macroCall',
          fragments,
        };
      },
      macroCallFragment_identifier: (id) => id.sourceString,
      macroCallFragment_string: (string) => string.sourceString,
    });
  }

  parse(input) {
    const matchResult = this.grammar.match(input);
    if (!matchResult.succeeded()) {
      throw new Error('Failed to parse input:\n' + matchResult.message);
    }
    // TODO expand macros
    return this.semantics(matchResult).eval();
  }

  expandMacro(name, args) {
    const macro = this.macros.get(name);
    if (!macro) {
      throw new Error(`Macro '${name}' not found`);
    }
    if (args.length !== macro.params.length) {
      throw new Error(`Macro '${name}' expects ${macro.params.length} arguments, got ${args.length}`);
    }

    const paramMap = {};
    macro.params.forEach((param, i) => {
      paramMap[param] = args[i];
    });

    return macro.body.map(statement => {
      const newStatement = { ...statement };
      if (newStatement.text) {
        newStatement.text = this.replaceParameters(newStatement.text, paramMap);
      }
      if (newStatement.target) {
        newStatement.target = this.replaceParameters(newStatement.target, paramMap);
      }
      return newStatement;
    });
  }

  replaceParameters(text, params) {
    return text.replace(/\{([^}]+)\}/g, (match, param) => {
      if (params[param] === undefined) {
        throw new Error(`Missing argument for parameter '${param}'`);
      }
      return params[param];
    });
  }
}

module.exports = {Parser};
