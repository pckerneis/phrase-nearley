const { Parser } = require('../src/parser');
const assert = require('assert');

function parse(input) {
    try {
        const parser = new Parser();
        return parser.parse(input);
    } catch (error) {
        console.error('Parse error for input:', input);
        console.error('Error message:', error.message);
        throw error;
    }
}

describe('DSL Grammar Tests', () => {
    describe('Basic Actions', () => {
        it('should parse fill action with multi-word element', () => {
            const result = parse('fill Username Field with "john"')[0][0];
            assert.deepStrictEqual(result, {
                type: 'fill',
                target: 'Username Field',
                value: 'john'
            });
        });

        it('should parse click action with multi-word element', () => {
            const result = parse('click Login Button')[0][0];
            assert.deepStrictEqual(result, {
                type: 'click',
                target: 'Login Button'
            });
        });

        it('should parse visit action', () => {
            const result = parse('visit "http://localhost:8080"')[0][0];
            assert.deepStrictEqual(result, {
                type: 'visit',
                url: 'http://localhost:8080'
            });
        });
    });

    describe('Macro Definition and Usage', () => {
        it('should parse macro definition', () => {
            const result = parse('in order to login as {user}:')[0][0];
            assert.deepStrictEqual(result, {
                type: 'macro_definition',
                name: 'user',
                statements: []
            });
        });

        it('should parse macro call', () => {
            const result = parse('login as bob')[0][0];
            assert.deepStrictEqual(result, {
                type: 'macro_call',
                name: 'login',
                args: ['bob']
            });
        });
    });

    describe('Multi-line Scripts', () => {
        it('should parse complete login script', () => {
            const input = `in order to login as {user}:
  fill Username Field with "{user}"
  fill Password Field with "secret"
  click Login Button

visit "http://localhost:8080"
login as bob`;
            const results = parse(input)[0];
            assert.equal(results.length, 3); // macro def + visit + login call
            assert.equal(results[0].type, 'macro_definition');
            assert.equal(results[1].type, 'visit');
            assert.equal(results[2].type, 'macro_call');
        });
    });
});
