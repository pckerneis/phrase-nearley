const fs = require("fs");
const path = require("path");
const ohm = require("ohm-js");
const { actionsOnElement, actionsWithString } = require("./actions");
const {
  assertionsOnElementWithString,
  assertionsOnElement,
  assertionsWithString,
} = require("./assertions");

class Parser {
  constructor() {
    this.macros = [];
    const grammarFile = path.join(__dirname, "grammar.ohm");
    let grammarContent = fs.readFileSync(grammarFile, "utf-8");
    grammarContent = grammarContent
      .replace(
        "{{actionOnElementTypes}}",
        actionsOnElement.map((a) => `"${a.action}"`).join(" | "),
      )
      .replace(
        "{{actionWithStringTypes}}",
        actionsWithString.map((a) => `"${a.action}"`).join(" | "),
      )
      .replace(
        "{{assertionWithStringTypes}}",
        assertionsWithString.map((a) => `"${a.assertion}"`).join(" | "),
      )
      .replace(
        "{{assertionOnElementWithStringTypes}}",
        assertionsOnElementWithString
          .map((a) => `"${a.assertion}"`)
          .join(" | "),
      )
      .replace(
        "{{assertionOnElementTypes}}",
        assertionsOnElement.map((a) => `"${a.assertion}"`).join(" | "),
      );

    this.grammar = ohm.grammar(grammarContent);
    this.semantics = this.grammar.createSemantics().addOperation("eval", {
      _iter: (...children) => children.map((c) => c.eval()),
      main: (_leadingNl, statements, _trailingNl) => {
        return statements.asIteration().children.map((c) => c.eval());
      },
      statement: (action) => action.eval(),
      action: function (actionIdentifier, _sp, targetOrElement) {
        const action = actionIdentifier.eval();
        if (targetOrElement.ctorName === "string") {
          const rawText = targetOrElement.sourceString.slice(1, -1);
          return {
            type: "action",
            action,
            text: rawText,
          };
        } else {
          return {
            type: "action",
            action,
            target: targetOrElement.eval(),
          };
        }
      },
      actionOnElement: (click) => click.sourceString,
      actionWithString: (type) => type.eval(),
      actionWithStringType: (type) => type.sourceString,
      assertionOnElement: (_expect, _sp, element, _sp2, assertion) => {
        return {
          type: "assertion",
          target: element.eval(),
          assertion: assertion.sourceString,
        };
      },
      assertionWithString: (_expect, _sp, assertion, _sp2, string) => {
        return {
          type: "assertion",
          assertion: assertion.sourceString,
          text: string.sourceString.slice(1, -1),
        };
      },
      assertionOnElementWithString: (
        _expect,
        _sp,
        element,
        _sp2,
        assertion,
        _sp3,
        string,
      ) => {
        return {
          type: "assertion",
          target: element.eval(),
          assertion: assertion.sourceString,
          text: string.sourceString.slice(1, -1),
        };
      },
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
      macroParameter_string: (_open, name, _close) => ({
        param: name.sourceString,
        type: "string",
      }),
      macroParameter_target: (param) => ({
        param: param.eval(),
        type: "element",
      }),
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
      macroCallFragment_target: (target) => `<${target.eval()}>`,
      identifierParam: (_dollar, name) => name.sourceString,
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
      expanded: expanded,
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
      const params = this.matchMacroCall(macro, callString);
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
      throw new Error(
        `Cyclic macro call detected: ${callStack.join(" -> ")} -> ${macroSignature}`,
      );
    }

    // Add current macro to call stack
    const newCallStack = [...callStack, macroSignature];

    // Substitute parameters in macro body and recursively expand
    const substitutedBody = this.substituteParameters(
      matchedMacro.body,
      resolvedParams,
    );
    return this.expandMacros(substitutedBody, newCallStack);
  }

  getMacroSignature(macro) {
    return macro.header
      .map((fragment) => this.addFragmentDelimiters(fragment))
      .join(" ");
  }

  addFragmentDelimiters(fragment) {
    if (typeof fragment === "string") {
      return fragment;
    }

    if (fragment.type === "string") {
      return `{${fragment.param}}`;
    }

    if (fragment.type === "element") {
      return `<${fragment.param}>`;
    }
  }

  substituteParameters(statements, params) {
    return statements.map((statement) => {
      if (statement.type === "macro") {
        // Recursively substitute in nested macro definitions
        return {
          ...statement,
          body: this.substituteParameters(statement.body, params),
        };
      } else if (statement.type === "macroCall") {
        // Substitute parameters in macro call fragments
        return {
          ...statement,
          fragments: statement.fragments.map((fragment) =>
            typeof fragment === "string"
              ? this.substituteInString(fragment, params)
              : fragment,
          ),
        };
      }

      if (statement.text) {
        // Substitute parameters in text strings
        statement = {
          ...statement,
          text: this.substituteInString(statement.text, params),
        };
      }

      if (statement.target) {
        // Substitute parameters in element targets
        statement = {
          ...statement,
          target: this.substituteInTarget(statement.target, params),
        };
      }

      return statement;
    });
  }

  substituteInString(text, params) {
    // Process the string character by character to handle escape sequences properly
    let result = "";
    let i = 0;

    while (i < text.length) {
      if (text[i] === "\\" && i + 1 < text.length) {
        const nextChar = text[i + 1];

        if (nextChar === "{") {
          // This is an escaped brace \{ - add literal brace to result
          result += "{";
          i += 2; // Skip both \ and {
        } else if (nextChar === "}") {
          // This is an escaped brace \} - add literal brace to result
          result += "}";
          i += 2; // Skip both \ and }
        } else if (nextChar === '"') {
          // This is an escaped quote \" - add literal quote to result
          result += '"';
          i += 2; // Skip both \ and "
        } else if (nextChar === "\\") {
          // This is an escaped backslash \\ - add literal backslash to result
          result += "\\";
          i += 2; // Skip both backslashes
        } else {
          // Unknown escape sequence - keep as is
          result += text[i];
          i++;
        }
      } else if (text[i] === "{") {
        // This might be the start of a parameter
        let paramEnd = text.indexOf("}", i);
        if (paramEnd !== -1) {
          const paramName = text.substring(i + 1, paramEnd);
          if (params.hasOwnProperty(paramName)) {
            // Replace parameter with its value
            result += params[paramName];
            i = paramEnd + 1; // Skip to after the }
          } else {
            // Not a valid parameter - keep as literal
            result += text[i];
            i++;
          }
        } else {
          // No closing brace - keep as literal
          result += text[i];
          i++;
        }
      } else {
        // Regular character - add to result
        result += text[i];
        i++;
      }
    }

    return result;
  }

  substituteInTarget(target, params) {
    // Substitute element parameters ($param) in target strings
    let result = target;

    for (const [paramName, paramValue] of Object.entries(params)) {
      // Replace all occurrences of $paramName with paramValue
      const regex = new RegExp(`\\$${paramName}\\b`, "g");
      result = result.replace(regex, paramValue);
    }

    return result;
  }

  macroToRegex(macro) {
    const regexParts = macro.header.map((part) => {
      if (typeof part === "string") {
        // Escape the literal text
        return part
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .trim()
          .replace(/\s+/g, "\\s+");
      } else if (part.type === "element") {
        // Match identifiers between angle brackets
        return "<([^>]+)>";
      } else {
        // Match quoted string for parameter
        return '"([^"]+)"';
      }
    });

    return new RegExp("^" + regexParts.join("\\s*") + "$");
  }

  matchMacroCall(macro, macroCall) {
    const paramNames = macro.header
      .filter((f) => typeof f === "object")
      .map((f) => f.param);
    const regex = this.macroToRegex(macro);
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
