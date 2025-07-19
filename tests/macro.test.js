const { Parser } = require("../src/parser");
const assert = require("assert");

function parse(input) {
  try {
    const parser = new Parser();
    return parser.parse(input);
  } catch (error) {
    throw error;
  }
}

describe("DSL Macro Tests", () => {
  describe("Invalid macros", () => {
    it("should fail empty macro body", () => {
      assert.throws(() => parse("in order to login:"), Error);
    });

    it("should reject duplicate macro headers", () => {
      assert.throws(() =>
        parse(`
in order to login as {foo}:
  click <foo>

in order to login as {bar}:
  click <bar>
`),
      );
    });
  });

  describe("Valid macros", () => {
    it("should parse macro with flexible header and parameters", () => {
      const result = parse(`
in order to login as {user} with password {pwd}:
  click <loginField>
  type "{user}"
  click <passwordField>
  type "{pwd}"`).original[0];

      assert.deepStrictEqual(result, {
        type: "macro",
        header: [
          "login",
          "as",
          {
            param: "user",
          },
          "with",
          "password",
          {
            param: "pwd",
          },
        ],
        params: ["user", "pwd"],
        body: [
          { type: "click", target: "loginField" },
          { type: "type", text: "{user}" },
          { type: "click", target: "passwordField" },
          { type: "type", text: "{pwd}" },
        ],
      });
    });

    it("should parse macro with minimal header", () => {
      const result = parse(`
in order to login {user} {pwd}:
  click <loginField>
  type "{user}"
  click <passwordField>
  type "{pwd}"`).original[0];

      assert.deepStrictEqual(result, {
        type: "macro",
        header: [
          "login",
          {
            param: "user",
          },
          {
            param: "pwd",
          },
        ],
        params: ["user", "pwd"],
        body: [
          { type: "click", target: "loginField" },
          { type: "type", text: "{user}" },
          { type: "click", target: "passwordField" },
          { type: "type", text: "{pwd}" },
        ],
      });
    });

    it("should parse macro", () => {
      const result = parse(`
in order to login:
  click <loginButton>`).original[0];
      assert.deepStrictEqual(result, {
        header: ["login"],
        params: [],
        type: "macro",
        body: [
          {
            type: "click",
            target: "loginButton",
          },
        ],
      });
    });

    it("should accept non empty lines in macro body", () => {
      const result = parse(`
in order to login:
  click <loginButton>
  
  type "toto"
`).original[0];
      assert.deepStrictEqual(result, {
        header: ["login"],
        params: [],
        type: "macro",
        body: [
          {
            type: "click",
            target: "loginButton",
          },
          {
            type: "type",
            text: "toto",
          },
        ],
      });
    });

    it("should accept empty lines in macro body", () => {
      const result = parse(`
in order to login:
  click <loginButton>

  type "toto"
`).original[0];
      assert.deepStrictEqual(result, {
        header: ["login"],
        params: [],
        type: "macro",
        body: [
          {
            type: "click",
            target: "loginButton",
          },
          {
            type: "type",
            text: "toto",
          },
        ],
      });
    });

    it("should parse root statement after macro body", () => {
      const result = parse(`
in order to login:
  click <loginButton>
  type "toto"
type "foo"
`).original;
      assert.deepStrictEqual(result, [
        {
          header: ["login"],
          params: [],
          type: "macro",
          body: [
            {
              type: "click",
              target: "loginButton",
            },
            {
              type: "type",
              text: "toto",
            },
          ],
        },
        {
          type: "type",
          text: "foo",
        },
      ]);
    });
  });

  describe("Macro parameters", () => {
    it("should parse macro parameters", () => {
      const result = parse(`
in order to login as {username}:
 click <loginButton>`).original[0];

      assert.deepStrictEqual(result, {
        header: ["login", "as", { param: "username" }],
        params: ["username"],
        type: "macro",
        body: [
          {
            type: "click",
            target: "loginButton",
          },
        ],
      });
    });

    it("should reject macro identifier if starting with parameter", () => {
      assert.throws(
        () =>
          parse(`
in order to {username} login:
 click <loginButton>`),
        Error,
      );
    });
  });

  describe("Macro calls", () => {
    it("should match simple macro calls", () => {
      const result = parse(`
in order to login:
  click <loginButton>

login
`).original;

      assert.deepStrictEqual(result[1].resolvedMacro, result[0]);
      assert.deepStrictEqual(result[1].resolvedParams, {});
    });

    it("should match macro call with one parameter", () => {
      const result = parse(`
in order to login as {username}:
  click <loginButton>

login as "foo"
`).original;

      assert.deepStrictEqual(result[1].resolvedMacro, result[0]);
      assert.deepStrictEqual(result[1].resolvedParams, {
        username: "foo",
      });
    });

    it("should expand nested macro calls", () => {
      const result = parse(`
in order to login as {username}:
  click <loginButton>
  type "{username}"

in order to foo:
  login as "foo"

foo
`).expanded;

      assert.deepStrictEqual(result, [
        { type: "click", target: "loginButton" },
        { type: "type", text: "foo" },
      ]);
    });

    it("should reject cyclic macro calls", () => {
      assert.throws(() =>
        parse(`
in order to login as {username}:
  foo

in order to connect as {username}:
  login as "{username}"

in order to foo:
  connect as "hello"

foo
`),
      );
    });
  });

  describe("Cycle detection", () => {
    it("should detect direct cycles with clear error message", () => {
      let errorMessage = "";
      try {
        parse(`
in order to macro a:
  macro b

in order to macro b:
  macro a

macro a
`);
        assert.fail("Should have thrown a cycle detection error");
      } catch (error) {
        errorMessage = error.message;
      }

      // Verify the error message shows the complete cycle path
      assert(
        errorMessage.includes("Cyclic macro call detected"),
        "Should mention cyclic macro call",
      );
      assert(
        errorMessage.includes("macro a -> macro b -> macro a"),
        `Should show complete cycle path, got: ${errorMessage}`,
      );
    });

    it("should detect indirect cycles with parameter details", () => {
      let errorMessage = "";
      try {
        parse(`
in order to step {name}:
  execute "{name}"

in order to execute {name}:
  perform "{name}"

in order to perform {name}:
  step "{name}"

step "test"
`);
        assert.fail("Should have thrown a cycle detection error");
      } catch (error) {
        errorMessage = error.message;
      }

      // Verify the error message shows the complete cycle path with parameters
      assert(
        errorMessage.includes("Cyclic macro call detected"),
        "Should mention cyclic macro call",
      );
      assert(
        errorMessage.includes("step {name}"),
        "Should show macro with parameters",
      );
      assert(
        errorMessage.includes("execute {name}"),
        "Should show second macro in chain",
      );
      assert(
        errorMessage.includes("perform {name}"),
        "Should show third macro in chain",
      );
      assert(errorMessage.includes("->"), "Should show call chain with arrows");
    });

    it("should allow valid recursive-like macros (no cycle)", () => {
      const result = parse(`
in order to login as {user}:
  click <loginField>
  type "{user}"

in order to complete login as {user}:
  login as "{user}"
  click <submitButton>

complete login as "jdoe"
`);

      // Should successfully expand without throwing cycle error
      assert.strictEqual(result.expanded.length, 3);
      assert.strictEqual(result.expanded[0].type, "click");
      assert.strictEqual(result.expanded[1].type, "type");
      assert.strictEqual(result.expanded[1].text, "jdoe");
      assert.strictEqual(result.expanded[2].type, "click");
    });
  });

  describe("Escape character support", () => {
    it("should handle escaped braces in parameter substitution", () => {
      const result = parse(`
in order to show message for {name}:
  type "Hello \\{world\\} and {name}!"

show message for "Alice"
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(result.expanded[0].text, "Hello {world} and Alice!");
    });

    it("should handle only escaped braces (no parameters)", () => {
      const result = parse(`
in order to show brackets:
  type "These are literal braces: \\{ and \\}"

show brackets
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(
        result.expanded[0].text,
        "These are literal braces: { and }",
      );
    });

    it("should handle multiple escaped braces in complex strings", () => {
      const result = parse(`
in order to show json for {data}:
  type "\\{\\\"key\\\": \\\"{data}\\\", \\\"literal\\\": \\\"\\{not_param\\}\\\"\\}"

show json for "test123"
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(
        result.expanded[0].text,
        '{"key": "test123", "literal": "{not_param}"}',
      );
    });

    it("should not substitute parameters in escaped braces", () => {
      const result = parse(`
in order to test escaping {param}:
  type "Parameter: {param}, Escaped: \\{param\\}"

test escaping "value"
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(
        result.expanded[0].text,
        "Parameter: value, Escaped: {param}",
      );
    });

    it("should handle escaped backslash before parameter (double backslash)", () => {
      const result = parse(`
in order to test double escape {param}:
  type "Value: \\\\{param}"

test double escape "test123"
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(result.expanded[0].text, "Value: \\test123");
    });

    it("should handle escaped backslash before escaped brace (triple backslash)", () => {
      const result = parse(`
in order to test triple escape {param}:
  type "Value: \\\\\\{param\\} and {param}"

test triple escape "test123"
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(
        result.expanded[0].text,
        "Value: \\{param} and test123",
      );
    });

    it("should handle quadruple backslash (two literal backslashes)", () => {
      const result = parse(`
in order to test quad escape:
  type "Four backslashes: \\\\\\\\"

test quad escape
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(result.expanded[0].text, "Four backslashes: \\\\");
    });

    it("should handle mixed complex escape sequences", () => {
      const result = parse(`
in order to test complex {param}:
  type "Escaped brace: \\{literal\\}, Parameter: {param}, Literal backslash: \\\\"

test complex "value"
`);

      assert.strictEqual(result.expanded.length, 1);
      assert.strictEqual(result.expanded[0].type, "type");
      assert.strictEqual(
        result.expanded[0].text,
        "Escaped brace: {literal}, Parameter: value, Literal backslash: \\",
      );
    });
  });
});
