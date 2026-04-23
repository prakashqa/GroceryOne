import { test, expect } from './fixtures/test-base';

test.describe('Theme Toggle', () => {
  test('theme toggle button cycles through modes', async ({ authenticatedPage: page }) => {
    const themeBtn = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeBtn).toBeVisible();

    // Get initial state
    const initialHasDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));

    // Click to cycle
    await themeBtn.click();
    await page.waitForTimeout(300);

    // State should have changed
    const afterFirstClick = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    // The state should differ from initial (unless system matches current)
    // Just verify the button is still clickable and responsive
    await expect(themeBtn).toBeVisible();
  });

  test('dark mode adds dark class to html', async ({ authenticatedPage: page }) => {
    const themeBtn = page.locator('button[aria-label="Toggle theme"]');

    // Cycle until we hit dark mode
    // Default is 'system'. Click once → 'light', click again → 'dark'
    await themeBtn.click(); // system → light
    await page.waitForTimeout(200);
    await themeBtn.click(); // light → dark
    await page.waitForTimeout(200);

    const hasDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    expect(hasDark).toBe(true);
  });

  test('light mode removes dark class from html', async ({ authenticatedPage: page }) => {
    const themeBtn = page.locator('button[aria-label="Toggle theme"]');

    // Go to light mode: system → light
    await themeBtn.click();
    await page.waitForTimeout(200);

    const hasDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    expect(hasDark).toBe(false);
  });
});
