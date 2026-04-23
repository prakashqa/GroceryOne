import { test, expect } from './fixtures/test-base';

test.describe('Navigation & Sidebar', () => {
  test('all sidebar nav links navigate correctly', async ({ authenticatedPage: page }) => {
    const navRoutes = [
      { text: /Dashboard|డాష్/, url: '/dashboard' },
      { text: /Picking|ఆర్డర్ తీయండి/, url: '/picking' },
      { text: /Orders|ఆర్డర్‌లు/, url: '/orders' },
      { text: /Items|ఐటెమ్లు/, url: '/items' },
      { text: /Reports|రిపోర్ట్స్/, url: '/reports' },
      { text: /Inventory|ఇన్వెంటరీ/, url: '/inventory' },
    ];

    for (const { text, url } of navRoutes) {
      const link = page.locator('aside a').filter({ hasText: text }).first();
      await link.click();
      await page.waitForURL(`**${url}`, { timeout: 10000 });
      await expect(page).toHaveURL(new RegExp(url));
    }
  });

  test('sidebar collapse toggle works', async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Click collapse button (hidden md:block)
    const collapseBtn = sidebar.locator('button').filter({ has: page.locator('svg') }).first();
    await collapseBtn.click();

    // After collapse, sidebar should have w-16 class on md+
    await expect(sidebar).toHaveClass(/md:w-16/);

    // Click again to expand
    await collapseBtn.click();
    await expect(sidebar).toHaveClass(/md:w-60/);
  });

  test('settings and logout visible in sidebar footer', async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside');
    const settingsLink = sidebar.locator('a[href="/settings"]');
    const logoutButton = sidebar.locator('button').filter({ hasText: /Logout|లాగ్ అవుట్/ });

    await expect(settingsLink).toBeVisible();
    await expect(logoutButton).toBeVisible();
  });

  test('mobile: hamburger opens sidebar drawer', async ({ page, loginViaPin }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await loginViaPin(page);

    // Hamburger should be visible
    const hamburger = page.locator('button[aria-label="Open menu"]');
    await expect(hamburger).toBeVisible();

    // Click hamburger to open sidebar
    await hamburger.click();
    await page.waitForTimeout(300);

    // Sidebar should now show nav items
    const sidebar = page.locator('aside');
    const navLinks = sidebar.locator('a');
    await expect(navLinks.first()).toBeVisible();
  });
});
