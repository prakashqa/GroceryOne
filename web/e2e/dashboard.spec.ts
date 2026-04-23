import { test, expect } from './fixtures/test-base';

test.describe('Dashboard', () => {
  test('shows 4 metric cards', async ({ authenticatedPage: page }) => {
    // Dashboard should have 4 metric cards in the grid
    const metricGrid = page.locator('.grid.grid-cols-1');
    await expect(metricGrid).toBeVisible();

    const metricCards = metricGrid.locator('> div');
    await expect(metricCards).toHaveCount(4);
  });

  test('shows Recent Orders section', async ({ authenticatedPage: page }) => {
    // Look for the Recent Orders heading
    const recentOrdersHeading = page.locator('h2, h3').filter({ hasText: /Recent|Orders|ఇటీవలి/ });
    await expect(recentOrdersHeading.first()).toBeVisible();
  });

  test('shows empty state when no orders', async ({ authenticatedPage: page }) => {
    // With empty store, should show empty state text
    const emptyText = page.locator('main').getByText(/No recent|No orders|ఇటీవలి.*లేవు/);
    await expect(emptyText.first()).toBeVisible();
  });
});
