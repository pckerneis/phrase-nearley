const assertionsWithString = [
  {
    assertion: "to have text",
    description: "Check the text inside a HTML element.",
    example: 'expect <welcome_message> to have text "Hello, Alice!"',
  },
  {
    assertion: "to have value",
    description: "Check the value of a HTML input.",
    example: 'expect <username_field> to have value "Alice"',
  },
];

module.exports = { assertionsWithString };
