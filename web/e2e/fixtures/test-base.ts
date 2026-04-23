import { test as base, expect, Page } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: Page;
  loginViaPin: (page: Page) => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  loginViaPin: async ({}, use) => {
    await use(async (page: Page) => {
      await page.goto('/pin-login');
      await page.waitForSelector('button:has-text("1")', { timeout: 15000 });
      // Enter PIN: 1111 (any 4-digit PIN works currently)
      for (const digit of ['1', '1', '1', '1']) {
        await page.locator(`button:has-text("${digit}")`).first().click();
        await page.waitForTimeout(100);
      }
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });
  },

  authenticatedPage: async ({ page, loginViaPin }, use) => {
    await loginViaPin(page);
    await use(page);
  },
});

export { expect };
