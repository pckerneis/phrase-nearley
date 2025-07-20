# Phrase-DSL

A natural language-like E2E testing DSL that bridges the gap between design and testing. The DSL focuses on readability while maintaining direct executability without glue code.

## Features

- Natural language-like syntax for common testing operations
- Parameterized macro definitions for custom actions
- Direct integration with underlying test frameworks (Cypress/Playwright)
- VSCode language server support (coming soon)

## Example

```
in order to login as {user}:
  click <Username_field>
  type "{user}"
  click <Password_field>
  type "secret"
  click <Login_button>

in order to check $element greets {username}:
  expect $element to have text "Hello, {username}!"

visit "http://localhost:8080"
login as "bob"
check <greetings_message> greets "bob"
```

## TODO

- [] Add assertions
- [] Custom assertions
- [] Add Playwright runner
- [] Add playground (editor and parse result)
