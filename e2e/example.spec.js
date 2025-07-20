// @ts-check
import { test, expect } from "@playwright/test";
import { PlaywrightRunner } from "../src/runner/playwright-runner";

test("has title", async ({ page }) => {
  const runner = new PlaywrightRunner(page, expect);
  await runner.run(`
visit "https://playwright.dev/"
expect page title to contain text "Playwright"
`);
});

test("get started link", async ({ page }) => {
  const runner = new PlaywrightRunner(page, expect, {
    GetStartedLink: (parent) =>
      parent.getByRole("link", { name: "Get started" }),
    InstallationHeading: (parent) =>
      parent.getByRole("heading", { name: "Installation" }),
  });

  await runner.run(`
visit "https://playwright.dev/"
click <GetStartedLink>
expect <InstallationHeading> to be visible
`);
});
