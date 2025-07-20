const actionsOnElement = [
  {
    action: "click",
    description: "Click an element.",
    example: "click <login_button>",
  },
  {
    action: "double-click",
    description: "Double click an element.",
    example: "double-click <login_button>",
  },
  {
    action: "right-click",
    description: "Right click an element.",
    example: "right-click <login_button>",
  },
  {
    action: "hover",
    description: "Move the mouse over an element.",
    example: "hover <info_icon>",
  },
];

const actionsWithString = [
  {
    action: "visit",
    description: "Trigger navigation to the provided URL.",
    example: 'visit "https://example.com"',
  },
  {
    action: "type",
    description: "Type some text with the keyboard.",
    example: 'type "foo"',
  },
  {
    action: "press key",
    description: "Press a key.",
    example: 'press key "Enter"',
  },
];

module.exports = { actionsOnElement, actionsWithString };
