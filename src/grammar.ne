@{%
const moo = require('moo');

const lexer = moo.compile({
    ws: /[ \t]+/,
    nl: { match: /\n/, lineBreaks: true },
    string: /"(?:\\["\\]|[^\n"\\])*"/,
    identifier: /[a-zA-Z][a-zA-Z0-9]*/,
    langle: '<',
    rangle: '>',
});
%}

@lexer lexer

main -> statements %nl:* {% id %}

statements -> null {% () => [] %}
    | statement {% v => [v[0]] %}
    | statements %nl:* statement {% (d) => [...d[0], d[2]] %}

statement -> action {% id %}

# Actions can be either element actions (click foo) or string actions (type "foo")
action -> action_on_element __ element {% d => ({
    type: d[0],
    target: d[2]
}) %}
    | action_with_string __ %string {% d => ({
    type: d[0],
    text: d[2].value.slice(1, -1)
}) %}

action_on_element -> "click" {% d => d[0].value %}

action_with_string -> "type" {% d => d[0].value %}

# Elements can be either a single identifier or multiple identifiers in <...>
element -> %identifier {% d => d[0].value %}
    | %langle multi_identifier %rangle {% d => d[1] %}

# Multi-identifier is space-separated identifiers
multi_identifier -> identifiers {% d => d[0].join(' ') %}

identifiers -> %identifier {% d => [d[0].value] %}
    | identifiers __ %identifier {% d => [...d[0], d[2].value] %}

_ -> %ws:? {% () => null %}
__ -> %ws {% () => null %}

@{%
function id(d) { return d[0]; }
%}
