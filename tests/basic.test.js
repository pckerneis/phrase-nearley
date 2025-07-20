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

describe("DSL Grammar Tests", () => {
  describe("Invalid Actions", () => {
    it("should fail on unknown action", () => {
      assert.throws(() => parse("foo bar"), Error);
      assert.throws(() => parse("unknown <Something>"), Error);
    });

    it("should fail on missing arguments", () => {
      assert.throws(() => parse("click"), Error);
      assert.throws(() => parse("type"), Error);
    });

    it("should fail on wrong argument types", () => {
      assert.throws(() => parse('click "button"'), Error);
      assert.throws(() => parse("type <foo>"), Error);
      assert.throws(() => parse("type <Text Field>"), Error);
    });
  });

  describe("Element Actions", () => {
    it("should parse click with identifier containing digits", () => {
      const result = parse("click <button2>").original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "click",
        target: "button2",
      });
    });

    it("should parse click with multi-identifier and digits", () => {
      const result = parse("click <Form2 Submit Button3>").original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "click",
        target: "Form2 Submit Button3",
      });
    });

    it("should fail on missing angle brackets", () => {
      assert.throws(() => parse("click Login Button"), Error);
    });

    it("should fail on mismatched angle brackets", () => {
      assert.throws(() => parse("click <Login Button"), Error);
      assert.throws(() => parse("click Login Button>"), Error);
    });
    it("should parse click with single identifier", () => {
      const result = parse("double-click <foo>").original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "double-click",
        target: "foo",
      });
    });

    it("should parse click with multi-identifier", () => {
      const result = parse("click <Login Button>").original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "click",
        target: "Login Button",
      });
    });

    it("should parse click with three-part identifier", () => {
      const result = parse("click <Submit Login Form>").original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "click",
        target: "Submit Login Form",
      });
    });

    it("should fail on invalid identifier", () => {
      assert.throws(() => parse("click 123"), Error);
      assert.throws(() => parse("click <123>"), Error);
      assert.throws(() => parse("click <Login 123>"), Error);
    });
  });

  describe("Assertions", () => {
    it("should parse have text assertion", () => {
      const result = parse(
        'expect <greetings_message> to have text "hello, bob!"',
      ).original[0];
      assert.deepStrictEqual(result, {
        type: "assertion",
        assertion: "to have text",
        target: "greetings_message",
        text: "hello, bob!",
      });
    });

    it("should parse not to exist assertion", () => {
      const result = parse("expect <greetings_message> not to exist")
        .original[0];
      assert.deepStrictEqual(result, {
        type: "assertion",
        assertion: "not to exist",
        target: "greetings_message",
      });
    });
  });

  describe("String Actions", () => {
    it("should parse type with special characters", () => {
      const result = parse('type "hello@world.com"').original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "type",
        text: "hello@world.com",
      });
    });

    it("should parse type with numbers and punctuation", () => {
      const result = parse('type "123!@#$%^&*()"').original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "type",
        text: "123!@#$%^&*()",
      });
    });

    it("should fail on unclosed string", () => {
      assert.throws(() => parse('type "unclosed'), Error);
    });

    it("should fail on invalid string escapes", () => {
      assert.throws(() => parse('type "\\x"'), Error);
    });
    it("should parse type with string", () => {
      const result = parse('type "hello world"').original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "type",
        text: "hello world",
      });
    });

    it("should parse type with empty string", () => {
      const result = parse('type ""').original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "type",
        text: "",
      });
    });

    it("should parse type with escaped quotes", () => {
      const result = parse('type "hello \\"world\\""').original[0];
      assert.deepStrictEqual(result, {
        type: "action",
        action: "type",
        text: 'hello \\"world\\"',
      });
    });
  });

  describe("Multi-line Scripts", () => {
    it("should parse script with multiple lines", () => {
      const input = `click <Login Button>
type "hello"
click <submit>`;
      const results = parse(input).original;
      assert.equal(results.length, 3);
    });

    it("should parse script with empty lines", () => {
      const input = `click <Login Button>

type "hello"

click <submit>

`;
      const results = parse(input).original;
      assert.equal(results.length, 3);
    });

    it("should parse script with empty lines at beginning", () => {
      const input = `

click <Login Button>
type "hello"
click <submit>`;
      const results = parse(input).original;
      assert.equal(results.length, 3);
    });

    it("should parse script with empty lines at end", () => {
      const input = `click <Login Button>
type "hello"
click <submit>

`;
      const results = parse(input).original;
      assert.equal(results.length, 3);
    });

    it("should parse script with mixed actions", () => {
      const input = `type "username"
click <Submit Button>
type "password123"
click <login>
type "Hello, World!"`;
      const results = parse(input).original;
      assert.equal(results.length, 5);
      assert.equal(results[0].type, "action");
      assert.equal(results[0].action, "type");
      assert.equal(results[1].type, "action");
      assert.equal(results[1].action, "click");
      assert.equal(results[2].type, "action");
      assert.equal(results[2].action, "type");
      assert.equal(results[3].type, "action");
      assert.equal(results[3].action, "click");
      assert.equal(results[4].type, "action");
      assert.equal(results[4].action, "type");
    });

    it("should fail on invalid line in multi-line script", () => {
      const input = `click button
type "text"
whoops
click <submit>`;
      assert.throws(() => parse(input), Error);
    });
    it("should parse multiple actions", () => {
      const input = `click <Login Button>
type "hello"
click <submit>`;
      try {
        const results = parse(input).original;
        console.log("Parsed results:", JSON.stringify(results, null, 2));
        assert.equal(results.length, 3);
        assert.equal(results[0].type, "action");
        assert.equal(results[0].action, "click");
        assert.equal(results[1].type, "action");
        assert.equal(results[1].action, "type");
        assert.equal(results[2].type, "action");
        assert.equal(results[2].type, "action");
        assert.equal(results[2].action, "click");
      } catch (err) {
        console.error("Parse error:", err.message);
        throw err;
      }
    });
  });
});
