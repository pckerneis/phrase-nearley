const {Parser} = require('../src/parser');
const assert = require('assert');

function parse(input) {
  try {
    const parser = new Parser();
    return parser.parse(input);
  } catch (error) {
    throw error;
  }
}

describe('DSL Macro Tests', () => {
  describe('Invalid macros', () => {
    it('should fail empty macro body', () => {
      assert.throws(() => parse('in order to login:'), Error);
    });
  });

  describe('Valid macros', () => {
    it('should parse macro', () => {
      const result = parse(`
in order to login:
  click loginButton`)[0];
      assert.deepStrictEqual(result, {
        header: 'login', body: [{
          type: 'click', target: 'loginButton',
        }],
      });
    });

    it('should accept non empty lines in macro body', () => {
      const result = parse(`
in order to login:
  click loginButton
  
  type "toto"
`)[0];
      assert.deepStrictEqual(result, {
        header: 'login', body: [{
          type: 'click', target: 'loginButton',
        }, {
          type: 'type', text: 'toto',
        }],
      });
    });

    it('should accept empty lines in macro body', () => {
      const result = parse(`
in order to login:
  click loginButton

  type "toto"
`)[0];
      assert.deepStrictEqual(result, {
        header: 'login', body: [{
          type: 'click', target: 'loginButton',
        }, {
          type: 'type', text: 'toto',
        }],
      });
    });

    it('should parse root statement after macro body', () => {
      const result = parse(`
in order to login:
  click loginButton
  type "toto"
type "foo"
`);
      assert.deepStrictEqual(result, [{
        header: 'login', body: [{
          type: 'click', target: 'loginButton',
        }, {
          type: 'type', text: 'toto',
        }],
      }, {
        type: 'type', text: 'foo',
      }]);
    });
  });
});