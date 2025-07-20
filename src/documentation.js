const { actionsOnElement, actionsWithString } = require("./parser/actions");
const path = require("path");
const fs = require("fs");
const {
  assertionsOnElementWithString,
  assertionsOnElement, assertionsWithString,
} = require("./parser/assertions");

const docTemplateFile = path.join(__dirname, "language-doc-template.md");
let docTemplateContent = fs.readFileSync(docTemplateFile, "utf-8");

const allActions = [...actionsWithString, ...actionsOnElement];

allActions.sort((a, b) => {
  return a.action.localeCompare(b.action);
});

const actionRows = allActions
  .map((action) => {
    return `| \`${action.action}\` | ${action.description} | \`${action.example}\` |`;
  })
  .join("\n");

docTemplateContent = docTemplateContent.replace("{{actionRows}}", actionRows);

const allAssertions = [...assertionsWithString, ...assertionsOnElementWithString, ...assertionsOnElement];

allAssertions.sort((a, b) => {
  return a.assertion.localeCompare(b.assertion);
});

const assertionRows = allAssertions
  .map((assertion) => {
    return `| \`${assertion.assertion}\` | ${assertion.description} | \`${assertion.example}\` |`;
  })
  .join("\n");

docTemplateContent = docTemplateContent.replace(
  "{{assertionRows}}",
  assertionRows,
);

fs.writeFileSync(
  path.join(__dirname, "..", "language-doc.md"),
  docTemplateContent,
);
