const assertionsWithString = [
  {
    assertion: "to have text",
    description: "Check the text inside an HTML element.",
    example: 'expect <welcome_message> to have text "Hello, Alice!"',
  },
  {
    assertion: "to contain text",
    description:
      "Check that the text inside an HTML element contains the given text.",
    example: 'expect <day_message> to contain text "today is"',
  },
  {
    assertion: "to have value",
    description: "Check the value of an HTML input.",
    example: 'expect <username_field> to have value "Alice"',
  },
  {
    assertion: "to have class",
    description: "Check that the HTML element has the given CSS class.",
    example: 'expect <accept_button> to have class "primary"',
  },
];

const assertionsOnElement = [
  {
    assertion: "to exist",
    description: "Check that the element exists.",
    example: "expect <consent_checkbox> to exist",
  },
  {
    assertion: "not to exist",
    description: "Check that the element doesn't exist.",
    example: "expect <consent_checkbox> not to exist",
  },
  {
    assertion: "to be checked",
    description: "Check that the checkbox is checked.",
    example: "expect <consent_checkbox> to be checked",
  },
  {
    assertion: "to be unchecked",
    description: "Check that the checkbox is unchecked.",
    example: "expect <consent_checkbox> to be unchecked",
  },
  {
    assertion: "to be visible",
    description: "Check the element is visible.",
    example: "expect <cancel_button> to be visible",
  },
  {
    assertion: "to be hidden",
    description: "Check the element is hidden.",
    example: "expect <cancel_button> to be hidden",
  },
  {
    assertion: "to be enabled",
    description:
      "Check the element is enabled. The target element could be a `input`, `textarea` or `button`.",
    example: "expect <cancel_button> to be enabled",
  },
  {
    assertion: "to be disabled",
    description:
      "Check the element is disabled. The target element could be a `input`, `textarea` or `button`.",
    example: "expect <cancel_button> to be disabled",
  },
];

module.exports = { assertionsWithString, assertionsOnElement };
