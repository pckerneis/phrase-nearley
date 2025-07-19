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
          // Keep the raw text with escape sequences for parameter substitution
          const rawText = target.sourceString.slice(1, -1);
          return {
            type,
            text: rawText,
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
    this.registerMacros(statements);
    const expanded = this.expandMacros(statements);
    
    return {
      original: statements,
      expanded: expanded
    };
  }

  registerMacros(statements) {
    const getMacroHeaderWithoutParameters = (statement) =>
      statement.header
        .map((fragment) => (typeof fragment === "object" ? "{}" : fragment))
        .join(" ");

    statements.forEach((statement) => {
      if (statement.type === "macro") {
        const testHeader1 = getMacroHeaderWithoutParameters(statement);

        for (const macro of this.macros) {
          const testHeader2 = getMacroHeaderWithoutParameters(macro);

          if (testHeader1 === testHeader2) {
            throw new Error("Macro is already registered.");
          }
        }

        this.macros.push(statement);
      }
    });
  }

  expandMacros(statements, callStack = []) {
    const expandedStatements = [];

    for (const statement of statements) {
      if (statement.type === "macroCall") {
        // Find and expand the macro call
        const expandedMacro = this.expandMacroCall(statement, callStack);
        expandedStatements.push(...expandedMacro);
      } else if (statement.type === "macro") {
        // Skip macro definitions in the output
        continue;
      } else {
        // Regular statement, keep as-is
        expandedStatements.push(statement);
      }
    }

    return expandedStatements;
  }

  expandMacroCall(statement, callStack = []) {
    const callString = statement.fragments.join(" ");

    // Find matching macro definition
    let matchedMacro = null;
    let resolvedParams = null;

    for (const macro of this.macros) {
      const macroDef = macro.header
        .map((fragment) =>
          typeof fragment === "object" ? `{${fragment.param}}` : fragment,
        )
        .join(" ");

      const params = this.matchMacroCall(macroDef, callString);
      if (params) {
        matchedMacro = macro;
        resolvedParams = params;
        statement.resolvedMacro = macro;
        statement.resolvedParams = params;
        break;
      }
    }

    if (!matchedMacro) {
      throw new Error(`Called macro could not be found: ${callString}`);
    }

    // Check for cycles
    const macroSignature = this.getMacroSignature(matchedMacro);
    if (callStack.includes(macroSignature)) {
      throw new Error(`Cyclic macro call detected: ${callStack.join(" -> ")} -> ${macroSignature}`);
    }

    // Add current macro to call stack
    const newCallStack = [...callStack, macroSignature];

    // Substitute parameters in macro body and recursively expand
    const substitutedBody = this.substituteParameters(matchedMacro.body, resolvedParams);
    return this.expandMacros(substitutedBody, newCallStack);
  }

  getMacroSignature(macro) {
    return macro.header
      .map((fragment) => (typeof fragment === "object" ? `{${fragment.param}}` : fragment))
      .join(" ");
  }

  substituteParameters(statements, params) {
    return statements.map(statement => {
      if (statement.type === "macro") {
        // Recursively substitute in nested macro definitions
        return {
          ...statement,
          body: this.substituteParameters(statement.body, params)
        };
      } else if (statement.type === "macroCall") {
        // Substitute parameters in macro call fragments
        return {
          ...statement,
          fragments: statement.fragments.map(fragment => 
            typeof fragment === "string" ? this.substituteInString(fragment, params) : fragment
          )
        };
      } else if (statement.text) {
        // Substitute parameters in text strings
        return {
          ...statement,
          text: this.substituteInString(statement.text, params)
        };
      } else {
        // Return statement as-is for other types
        return statement;
      }
    });
  }

  substituteInString(text, params) {
    // Step 1: Temporarily replace escaped braces with unique placeholders
    const ESCAPED_OPEN_PLACEHOLDER = '__ESCAPED_OPEN_BRACE__';
    const ESCAPED_CLOSE_PLACEHOLDER = '__ESCAPED_CLOSE_BRACE__';
    
    let result = text
      .replace(/\\\{/g, ESCAPED_OPEN_PLACEHOLDER)   // \{ -> placeholder
      .replace(/\\\}/g, ESCAPED_CLOSE_PLACEHOLDER); // \} -> placeholder
    
    // Step 2: Perform parameter substitution on non-escaped braces
    for (const [paramName, paramValue] of Object.entries(params)) {
      // Replace all occurrences of {paramName} with paramValue
      const regex = new RegExp(`\\{${paramName}\\}`, 'g');
      result = result.replace(regex, paramValue);
    }
    
    // Step 3: Process all escape sequences
    result = result
      .replace(new RegExp(ESCAPED_OPEN_PLACEHOLDER, 'g'), '{')
      .replace(new RegExp(ESCAPED_CLOSE_PLACEHOLDER, 'g'), '}')
      .replace(/\\\"/g, '"')
      .replace(/\\\\/g, '\\');
    
    return result;
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
