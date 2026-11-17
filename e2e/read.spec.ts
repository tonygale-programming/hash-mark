import { expect, test } from '@playwright/test';
import { openNewNote } from './helpers';

test.describe('M1 read mode', () => {
  test('renders the note, sanitized, without touching the URL fragment', async ({ page }) => {
    await openNewNote(page);
    await page.keyboard.insertText(
      [
        '# Trip plan',
        '',
        'Pack light[^1] and read [the guide](https://example.com).',
        '',
        '<img src=x onerror="window.__xss = true">',
        '',
        '[^1]: One bag only.',
      ].join('\n'),
    );

    await page.getByRole('radio', { name: 'Read' }).click();
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Trip plan' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'the guide' })).toHaveAttribute('target', '_blank');
    await expect(main.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => (window as { __xss?: boolean }).__xss)).toBeUndefined();

    const urlBefore = page.url();
    await main.locator('a[data-footnote-ref]').click();
    await expect(main.locator('#user-content-fn-1')).toBeFocused();
    expect(page.url()).toBe(urlBefore);
  });
});
