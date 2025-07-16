const assert = require('assert');
const { MacroExpander } = require('../src/macro-expander');

describe('MacroExpander', () => {
    let expander;

    beforeEach(() => {
        expander = new MacroExpander();
    });

    it('should expand simple macro with parameter substitution', () => {
        const loginMacro = {
            params: ['user'],
            statements: [
                {
                    type: 'fill',
                    target: 'Username Field',
                    value: '{user}'
                },
                {
                    type: 'fill',
                    target: 'Password Field',
                    value: 'secret'
                },
                {
                    type: 'click',
                    target: 'Login Button'
                }
            ]
        };

        expander.registerMacro('login', loginMacro.params, loginMacro.statements);
        const expanded = expander.expandMacro('login', ['john']);

        assert.deepStrictEqual(expanded, [
            {
                type: 'fill',
                target: 'Username Field',
                value: 'john'
            },
            {
                type: 'fill',
                target: 'Password Field',
                value: 'secret'
            },
            {
                type: 'click',
                target: 'Login Button'
            }
        ]);
    });

    it('should throw error for unknown macro', () => {
        assert.throws(() => {
            expander.expandMacro('unknown', ['arg']);
        }, /Macro 'unknown' not found/);
    });
});
