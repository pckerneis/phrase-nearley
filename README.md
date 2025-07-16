# Phrase-Nearley

A natural language-like E2E testing DSL that bridges the gap between design and testing. The DSL focuses on readability while maintaining direct executability without glue code.

## Features

- Natural language-like syntax for common testing operations
- Parameterized macro definitions for custom actions
- Direct integration with underlying test frameworks (Cypress/Playwright)
- VSCode language server support (coming soon)

## Example

```
in order to login as {user}:
  fill Username field with "{user}"
  fill Password field with "secret"
  click Login button

visit "http://localhost:8080"
login as bob
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the grammar:
```bash
npm run build
```

## Development

The grammar is defined in `src/grammar.ne` using the Nearley syntax. After making changes to the grammar, rebuild using `npm run build`.
