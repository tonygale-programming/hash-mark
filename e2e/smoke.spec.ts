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

    // The mono face is first used by the Markdown markers in the lazy-loaded editor.
    await expect(page.locator('.cm-md-mark').first()).toBeVisible();
    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return (
        document.fonts.check('16px "IBM Plex Sans"') && document.fonts.check('14px "IBM Plex Mono"')
      );
    });
    expect(fontsLoaded).toBe(true);
    expect(errors).toEqual([]);
  });

  test('switches modes and theme, and keeps the theme after reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    // No saved choice: no data-theme, colours follow the system.
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(227, 228, 232)');

    await page.getByRole('radio', { name: 'Split' }).click();
    await expect(page.getByRole('main')).toHaveAttribute('data-mode', 'split');

    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 24, 28)');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('follows a dark system theme without a saved choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 24, 28)');
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Write' })).toHaveCSS(
      'background-color',
      'rgb(0, 76, 102)',
    );
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
