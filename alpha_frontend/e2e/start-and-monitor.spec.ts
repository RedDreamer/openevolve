import { test, expect } from '@playwright/test';

test('unlock tabs then start evolution → monitor', async ({ page }) => {
  await page.goto('/project-hub');
  await expect(page.getByTestId('nav-tabs').locator('button')).toHaveCount(0);
  await page.getByTestId('hero-start').click();
  await page.waitForSelector('#hub');
  await expect(page.getByTestId('nav-tabs').locator('button')).toHaveCount(4);
  await Promise.all([
    page.waitForURL('**/monitor'),
    page.getByTestId('start-evolution').click(),
  ]);
  await expect(page.getByTestId('chart-overall')).toBeVisible();
});