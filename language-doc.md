## Built-in Actions

| keyword        | description                             | example                       |
| -------------- | --------------------------------------- | ----------------------------- |
| `click`        | Click an element.                       | `click <login_button>`        |
| `double-click` | Double click an element.                | `double-click <login_button>` |
| `hover`        | Move the mouse over an element.         | `hover <info_icon>`           |
| `press key`    | Press a key.                            | `press key "Enter"`           |
| `right-click`  | Right click an element.                 | `right-click <login_button>`  |
| `type`         | Type some text with the keyboard.       | `type "foo"`                  |
| `visit`        | Trigger navigation to the provided URL. | `visit "https://example.com"` |

## Built-in Assertions

| keyword         | description                           | example                                                 |
| --------------- | ------------------------------------- | ------------------------------------------------------- |
| `to have text`  | Check the text inside a HTML element. | `expect <welcome_message> to have text "Hello, Alice!"` |
| `to have value` | Check the value of a HTML input.      | `expect <username_field> to have value "Alice"`         |
