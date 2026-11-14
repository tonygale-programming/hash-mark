import { expect, test } from '@playwright/test';

test.describe('M0 smoke', () => {
  test('renders the shell without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByRole('banner')).toContainText('Hash Mark');
    await expect(page.getByRole('radio', { name: 'Write' })).toBeChecked();
    await expect(page.getByRole('complementary', { name: 'Notes' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Saved');

    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('16px "Roboto Variable"');
    });
    expect(fontsLoaded).toBe(true);
    expect(errors).toEqual([]);
  });

  test('switches modes and theme, and keeps the theme after reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('radio', { name: 'Split' }).click();
    await expect(page.getByRole('main')).toHaveAttribute('data-mode', 'split');

    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('collapses to a drawer on narrow screens without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('radio', { name: 'Split' })).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Notes' })).toBeHidden();

    await page.getByRole('button', { name: 'Notes' }).click();
    await expect(page.getByRole('complementary', { name: 'Notes' })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
