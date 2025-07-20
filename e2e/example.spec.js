// @ts-check
import { test, expect } from '@playwright/test';
import {Parser} from '../src/parser/parser';

class PlaywrightRunner {
  constructor(page, locators) {
    this.page = page;
    this.locators = locators;
  }

  async runAction(step) {
    switch (step.action) {
      case "visit":
        await this.page.goto(step.text);
        break;
      case "click":
        await this.getLocator(step.target).click();
        break;
      default:
        throw new Error(`No handler found for action ${step.action}`);
    }
  }

  async runAssertion(step) {
    switch (step.assertion) {
      case "page title to contain text":
        await expect(this.page).toHaveTitle(new RegExp(step.text));
        break;
      case "page title to have text":
        await expect(this.page).toHaveTitle(step.text);
        break;
      case "to be visible":
        await expect(this.getLocator(step.target)).toBeVisible();
        break;
      default:
        throw new Error(`No handler found for assertion: ${step.assertion}`);
    }
  }

  async runStep(step) {
    switch (step.type) {
      case 'action': await this.runAction(step); break;
      case 'assertion': await this.runAssertion(step); break;
      default:
        throw new Error(`Unexpected step type: ${step.type}`);
    }
  }

  async run(test) {
    const steps = new Parser().parse(test).expanded;

    for (const step of steps) {
      await this.runStep(step);
    }
  }

  getLocator(id) {
    if (id in this.locators) return this.locators[id]();
    throw new Error(`Unable to find locator '${id}'`);
  }
}

test('has title', async ({ page }) => {
  const runner = new Runner(page);
  await runner.run(`
visit "https://playwright.dev/"
expect page title to contain text "Playwright"
`);
});

test('get started link', async ({ page }) => {
  const runner = new Runner(page, {
    GetStartedLink: () => page.getByRole('link', { name: 'Get started' }),
    InstallationHeading: () => page.getByRole('heading', { name: 'Installation' }),
  });

  await runner.run(`
visit "https://playwright.dev/"
click <GetStartedLink>
expect <InstallationHeading> to be visible
`);
});
