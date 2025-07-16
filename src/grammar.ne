@{%
const moo = require('moo');

const lexer = moo.compile({
    ws: /[ \t]+/,
    nl: { match: /\n/, lineBreaks: true },
    indent: /^[ \t]+/,
    string: /"(?:\\["\\]|[^\n"\\])*"/,
    identifier: /\{[a-zA-Z_][a-zA-Z0-9_]*\}/,
    colon: ':',
    fill: /fill(?![a-zA-Z0-9])/,
    click: /click(?![a-zA-Z0-9])/,
    visit: /visit(?![a-zA-Z0-9])/,
    with_value: /with(?![a-zA-Z0-9])/,
    as: /as(?![a-zA-Z0-9])/,
    in_order_to: /in order to(?![a-zA-Z0-9])/,
    element_word: /[A-Z][a-zA-Z0-9]*/,  // Words that can be part of element names
    word: /[a-zA-Z][a-zA-Z0-9_]*/  // For macro names and args
});

function tokenValue(token) {
    return token ? token.value : null;
}
%}

@lexer lexer

main -> statements {% id %}

statements -> null {% () => [] %}
    | statement {% v => [v[0]] %}
    | statements %nl statement {% (d) => [...d[0], d[2]] %}

statement -> action {% id %}
    | macro_definition {% id %}
    | macro_call {% id %}

macro_definition -> %in_order_to __ %identifier %colon %nl indented_statements {% d => ({
    type: 'macro_definition',
    name: d[2].value.slice(1, -1),
    statements: d[5]
}) %}

indented_statements -> null {% () => [] %}
    | indented_statement {% v => [v[0]] %}
    | indented_statements %nl indented_statement {% (d) => [...d[0], d[2]] %}

indented_statement -> %indent statement {% d => d[1] %}

action -> %fill __ element __ %with_value __ %string {% d => ({
    type: 'fill',
    target: d[2],
    value: d[6].value.slice(1, -1)
}) %}
    | %click __ element {% d => ({
    type: 'click',
    target: d[2]
}) %}
    | %visit __ %string {% d => ({
    type: 'visit',
    url: d[2].value.slice(1, -1)
}) %}
    | %word __ %as __ %word {% d => ({
    type: 'macro_call',
    name: d[0].value,
    args: [d[4].value]
}) %}

word -> %word {% d => d[0].value %}

macro_call -> word __ %as __ word {% d => ({
    type: 'macro_call',
    name: d[0].value,
    args: [d[4].value]
}) %}

# Multi-word element names (e.g., "Login button", "Username field")
element -> element_words {% d => d[0].join(' ') %}

element_words -> %element_word {% d => [d[0].value] %}
    | element_words __ %element_word {% d => [...d[0], d[2].value] %}

_ -> %ws:? {% () => null %}
__ -> %ws {% () => null %}

@{%
function id(d) { return d[0]; }
%}
