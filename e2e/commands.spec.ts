import { expect, test } from '@playwright/test';
import { lines, openNewNote } from './helpers';

test.describe('M2 shortcuts', () => {
  test('formats with the registry shortcuts', async ({ page }) => {
    const editor = await openNewNote(page);

    await page.keyboard.type('Shopping');
    await page.keyboard.press('ControlOrMeta+Alt+1');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('milk');
    await page.keyboard.press('ControlOrMeta+Shift+9');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect.poll(() => lines(page)).toEqual(['# Shopping', '- [x] milk']);

    // Enter continues the task list; Tab nests the item.
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('oat');
    await page.keyboard.press('Tab');
    await expect.poll(() => lines(page)).toEqual(['# Shopping', '- [x] milk', '  - [ ] oat']);
    await expect(editor).toBeFocused();

    // Bold the word before the cursor.
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('ControlOrMeta+b');
    await expect.poll(() => lines(page)).toEqual(['# Shopping', '- [x] milk', '  - [ ] **oat**']);
    await page.keyboard.press('ControlOrMeta+b');
    await expect.poll(() => lines(page)).toEqual(['# Shopping', '- [x] milk', '  - [ ] oat']);

    // Outside a list, Tab moves focus on instead of trapping it.
    await page.getByRole('button', { name: 'New note' }).click();
    await expect(editor).toBeFocused();
    await page.keyboard.type('plain');
    await page.keyboard.press('Tab');
    await expect(editor).not.toBeFocused();
    await expect.poll(() => lines(page)).toEqual(['plain']);
  });

  test('switches modes and Show syntax from the keyboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: 'Note' })).toBeVisible();
    await page.keyboard.press('ControlOrMeta+Shift+M');
    await expect(page.getByRole('main')).toHaveAttribute('data-mode', 'split');
    await page.keyboard.press('ControlOrMeta+Shift+M');
    await expect(page.getByRole('main')).toHaveAttribute('data-mode', 'read');

    await page.keyboard.press('ControlOrMeta+/');
    await expect(page.getByRole('button', { name: 'Show syntax' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
