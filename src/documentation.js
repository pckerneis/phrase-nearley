const { actionsOnElement, actionsWithString } = require("./actions");
const path = require("path");
const fs = require("fs");

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

fs.writeFileSync(
  path.join(__dirname, "..", "language-doc.md"),
  docTemplateContent,
);
