const fs = require("fs");
const path = require("path");
const ohm = require("ohm-js");

class Parser {
  constructor() {
    this.macros = [];
    const grammarFile = path.join(__dirname, "grammar.ohm");
    const grammarContent = fs.readFileSync(grammarFile, "utf-8");
    this.grammar = ohm.grammar(grammarContent);
    this.semantics = this.grammar.createSemantics().addOperation("eval", {
      _iter: (...children) => children.map((c) => c.eval()),
      main: (_leadingNl, statements, _trailingNl) => {
        return statements.asIteration().children.map((c) => c.eval());
      },
      statement: (action) => action.eval(),
      action: function (action, _sp, target) {
        const type = action.eval();
        if (target.ctorName === "string") {
          return {
            type,
            text: target.sourceString.slice(1, -1),
          };
        } else {
          return {
            type,
            target: target.eval(),
          };
        }
      },
      actionOnElement: (click) => click.sourceString,
      actionWithString: (type) => type.eval(),
      actionWithStringType: (type) => type.sourceString,
      element: (_open, _sp1, ids, _sp2, _close) => ids.eval(),
      multiIdentifier: (ids) =>
        ids
          .asIteration()
          .children.map((c) => c.sourceString)
          .join(" "),
      macro: (header, _sp, body) => {
        const { fragments, params } = header.eval();
        return {
          type: "macro",
          header: fragments,
          params,
          body: body.eval(),
        };
      },
      macroHeader: (_inOrderTo, _sp, identifier, _colon) => identifier.eval(),
      macroIdentifier: (first, _sp, rest) => {
        const fragments = [
          first.sourceString,
          ...(rest.children?.[0]
            ?.asIteration()
            ?.children.map((c) => c.eval()) ?? []),
        ];
        return {
          fragments,
          params: fragments
            .filter((f) => typeof f === "object")
            .map((f) => f.param),
        };
      },
      macroIdentifierFragment_parameter: (fragment) => fragment.eval(),
      macroIdentifierFragment_identifier: (fragment) => fragment.sourceString,
      macroParameter: (_open, name, _close) => ({ param: name.sourceString }),
      macroBody: (statements) =>
        statements.asIteration().children.map((c) => c.eval()),
      indentedStatement: (_sp, statement) => statement.eval(),
      macroCall: (first, _sp, rest) => {
        const fragments = [
          first.sourceString,
          ...(rest.children[0]?.asIteration().children.map((c) => c.eval()) ??
            []),
        ];
        return {
          type: "macroCall",
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
      throw new Error("Failed to parse input:\n" + matchResult.message);
    }

    const statements = this.semantics(matchResult).eval();

    statements.forEach((statement) => {
      if (statement.type === "macro") {
        const testHeader1 = statement.header
          .map((fragment) => (typeof fragment === "object" ? "{}" : fragment))
          .join(" ");

        for (const macro of this.macros) {
          const testHeader2 = macro.header
            .map((fragment) => (typeof fragment === "object" ? "{}" : fragment))
            .join(" ");

          if (testHeader1 === testHeader2) {
            throw new Error("Macro is already registered.");
          }
        }

        this.macros.push(statement);
      }
    });

    this.resolveMacroCalls(statements);

    return statements;
  }

  resolveMacroCalls(statements) {
    statements.forEach((statement) => {
      if (statement.type === "macroCall") {
        this.resolveMacroCall(statement);
      } else if (statement.type === "macro") {
        this.resolveMacroCalls(statement.body);
      }
    });
  }

  resolveMacroCall(statement) {
    const callString = statement.fragments.join(" ");

    for (const macro of this.macros) {
      const macroDef = macro.header
        .map((fragment) =>
          typeof fragment === "object" ? `{${fragment.param}}` : fragment,
        )
        .join(" ");

      const resolvedParams = this.matchMacroCall(macroDef, callString);

      if (resolvedParams) {
        statement.resolvedMacro = macro;
        statement.resolvedParams = resolvedParams;
        return;
      }
    }

    throw new Error("Called macro could not be found.");
  }

  macroToRegex(macroDef) {
    // Split by parameter tokens like {param}
    const parts = macroDef.split(/(\{[^}]+\})/g);

    const regexParts = parts.map((part) => {
      if (part.match(/^\{[^}]+\}$/)) {
        // Match quoted string for parameter
        return '"([^"]+)"';
      } else {
        // Escape the literal text
        return part
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .trim()
          .replace(/\s+/g, "\\s+");
      }
    });

    return new RegExp("^" + regexParts.join("\\s*") + "$");
  }

  matchMacroCall(macroDef, macroCall) {
    const paramNames = [...macroDef.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
    const regex = this.macroToRegex(macroDef);
    const match = macroCall.match(regex);
    if (!match) return null;

    const paramValues = match.slice(1); // first match is the whole string
    const result = {};
    paramNames.forEach((name, i) => {
      result[name] = paramValues[i];
    });
    return result;
  }
}

module.exports = { Parser };
