import { test, expect } from './fixtures/test-base';

test.describe('Responsive Layout', () => {
  test('mobile: sidebar hidden, hamburger visible', async ({ page, loginViaPin }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaPin(page);

    // Hamburger button should be visible on mobile
    const hamburger = page.locator('button[aria-label="Open menu"]');
    await expect(hamburger).toBeVisible();

    // Sidebar should be off-screen (has -translate-x-full)
    const sidebar = page.locator('aside');
    const transform = await sidebar.evaluate(el => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');
  });

  test('desktop: sidebar visible, hamburger hidden', async ({ page, loginViaPin }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginViaPin(page);

    // Sidebar should be visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Hamburger should be hidden on desktop (md:hidden)
    const hamburger = page.locator('button[aria-label="Open menu"]');
    await expect(hamburger).not.toBeVisible();
  });

  test('mobile hamburger click opens sidebar drawer', async ({ page, loginViaPin }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaPin(page);

    const hamburger = page.locator('button[aria-label="Open menu"]');
    await hamburger.click();
    await page.waitForTimeout(300);

    // Sidebar should now show nav items
    const sidebar = page.locator('aside');
    const navLink = sidebar.locator('a').first();
    await expect(navLink).toBeVisible();

    // Backdrop should be visible
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50');
    await expect(backdrop).toBeVisible();
  });
});
