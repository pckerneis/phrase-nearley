## Built-in Actions

| keyword        | description                             | example                       |
| -------------- | --------------------------------------- | ----------------------------- |
| `click`        | Click an element.                       | `click <login_button>`        |
| `double-click` | Double-click an element.                | `double-click <login_button>` |
| `hover`        | Move the mouse over an element.         | `hover <info_icon>`           |
| `press key`    | Press a key.                            | `press key "Enter"`           |
| `right-click`  | Right-click an element.                 | `right-click <login_button>`  |
| `type`         | Type some text with the keyboard.       | `type "foo"`                  |
| `visit`        | Trigger navigation to the provided URL. | `visit "https://example.com"` |

## Built-in Assertions

| keyword           | description                                                                                   | example                                                 |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `not to exist`    | Check that the element doesn't exist.                                                         | `expect <consent_checkbox> not to exist`                |
| `to be checked`   | Check that the checkbox is checked.                                                           | `expect <consent_checkbox> to be checked`               |
| `to be disabled`  | Check the element is disabled. The target element could be a `input`, `textarea` or `button`. | `expect <cancel_button> to be disabled`                 |
| `to be enabled`   | Check the element is enabled. The target element could be a `input`, `textarea` or `button`.  | `expect <cancel_button> to be enabled`                  |
| `to be hidden`    | Check the element is hidden.                                                                  | `expect <cancel_button> to be hidden`                   |
| `to be unchecked` | Check that the checkbox is unchecked.                                                         | `expect <consent_checkbox> to be unchecked`             |
| `to be visible`   | Check the element is visible.                                                                 | `expect <cancel_button> to be visible`                  |
| `to contain text` | Check that the text inside an HTML element contains the given text.                           | `expect <day_message> to contain text "today is"`       |
| `to exist`        | Check that the element exists.                                                                | `expect <consent_checkbox> to exist`                    |
| `to have class`   | Check that the HTML element has the given CSS class.                                          | `expect <accept_button> to have class "primary"`        |
| `to have text`    | Check the text inside an HTML element.                                                        | `expect <welcome_message> to have text "Hello, Alice!"` |
| `to have value`   | Check the value of an HTML input.                                                             | `expect <username_field> to have value "Alice"`         |
