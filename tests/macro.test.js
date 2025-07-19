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

    it('should reject duplicate macro headers', () => {
      assert.throws(() => parse(`
in order to login as {foo}:
  click <foo>

in order to login as {bar}:
  click <bar>
`));
    });
  });

  describe('Valid macros', () => {
    it('should parse macro with flexible header and parameters', () => {
      const result = parse(`
in order to login as {user} with password {pwd}:
  click <loginField>
  type "{user}"
  click <passwordField>
  type "{pwd}"`)[0];

      assert.deepStrictEqual(result, {
        type: 'macro',
        header: [
          'login',
          'as',
          {
            'param': 'user'
          },
          'with',
          'password',
          {
            'param': 'pwd'
          }
        ],
        params: ['user', 'pwd'],
        body: [
          {type: 'click', target: 'loginField'},
          {type: 'type', text: '{user}'},
          {type: 'click', target: 'passwordField'},
          {type: 'type', text: '{pwd}'}
        ]
      });
    });

    it('should parse macro with minimal header', () => {
      const result = parse(`
in order to login {user} {pwd}:
  click <loginField>
  type "{user}"
  click <passwordField>
  type "{pwd}"`)[0];

      assert.deepStrictEqual(result, {
        type: 'macro',
        header: [
          'login',
          {
            'param': 'user'
          },
          {
            'param': 'pwd'
          }
        ],
        params: ['user', 'pwd'],
        body: [
          {type: 'click', target: 'loginField'},
          {type: 'type', text: '{user}'},
          {type: 'click', target: 'passwordField'},
          {type: 'type', text: '{pwd}'}
        ]
      });
    });

    it('should parse macro', () => {
      const result = parse(`
in order to login:
  click <loginButton>`)[0];
      assert.deepStrictEqual(result, {
        header: ['login'], params: [], type: 'macro', body: [{
          type: 'click', target: 'loginButton',
        }],
      });
    });

    it('should accept non empty lines in macro body', () => {
      const result = parse(`
in order to login:
  click <loginButton>
  
  type "toto"
`)[0];
      assert.deepStrictEqual(result, {
        header: ['login'], params: [], type: 'macro', body: [{
          type: 'click', target: 'loginButton',
        }, {
          type: 'type', text: 'toto',
        }],
      });
    });

    it('should accept empty lines in macro body', () => {
      const result = parse(`
in order to login:
  click <loginButton>

  type "toto"
`)[0];
      assert.deepStrictEqual(result, {
        header: ['login'], params: [], type: 'macro', body: [{
          type: 'click', target: 'loginButton',
        }, {
          type: 'type', text: 'toto',
        }],
      });
    });

    it('should parse root statement after macro body', () => {
      const result = parse(`
in order to login:
  click <loginButton>
  type "toto"
type "foo"
`);
      assert.deepStrictEqual(result, [{
        header: ['login'], params: [], type: 'macro', body: [{
          type: 'click', target: 'loginButton',
        }, {
          type: 'type', text: 'toto',
        }],
      }, {
        type: 'type', text: 'foo',
      }]);
    });
  });

  describe('Macro parameters', () => {
    it('should parse macro parameters', () => {
      const result = parse(`
in order to login as {username}:
 click <loginButton>`)[0];

      assert.deepStrictEqual(result, {
        header: ['login', 'as', { param: 'username' }], params: ['username'], type: 'macro', body: [{
          type: 'click', target: 'loginButton',
        }]
      })
    });

    it('should reject macro identifier if starting with parameter', () => {
      assert.throws(() => parse(`
in order to {username} login:
 click <loginButton>`), Error);
    });
  });

  describe('Macro calls', () => {
    it('should match simple macro calls', () => {
      const result = parse(`
in order to login:
  click <loginButton>

login
`);

      assert.deepStrictEqual(result[1].resolvedMacro, result[0]);
      assert.deepStrictEqual(result[1].resolvedParams, {});
    });

    it('should match macro call with one parameter', () => {
      const result = parse(`
in order to login as {username}:
  click <loginButton>

login as "foo"
`);

      assert.deepStrictEqual(result[1].resolvedMacro, result[0]);
      assert.deepStrictEqual(result[1].resolvedParams, {
        username: 'foo'
      });
    });
  });
});