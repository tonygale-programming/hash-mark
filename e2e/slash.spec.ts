import { expect, test, type Page } from '@playwright/test';

async function lines(page: Page) {
  return page.locator('.cm-content .cm-line').allTextContents();
}

/** Types like a person (the menu ignores Enter in the first 75 ms after it opens). */
async function slash(page: Page, query: string, pick: string) {
  await page.keyboard.type(`/${query}`, { delay: 30 });
  const menu = page.getByRole('listbox', { name: 'Blocks' });
  await expect(menu.getByRole('option', { selected: true })).toContainText(pick);
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
}

test.describe('M2 slash menu', () => {
  test('lists blocks, filters, and inserts them', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New note' }).click();
    await expect(page.getByRole('textbox', { name: 'Note' })).toBeFocused();

    // "/" opens every block; Esc closes and leaves the slash as text.
    await page.keyboard.type('/');
    const menu = page.getByRole('listbox', { name: 'Blocks' });
    await expect(menu.getByRole('option')).toHaveCount(13);
    await expect(menu.getByRole('option').first()).toContainText('Heading 1');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await page.keyboard.press('Backspace');

    // Turns the line it is typed on into a heading.
    await page.keyboard.type('Weekend in Lisbon ');
    await slash(page, 'h1', 'Heading 1');
    await expect.poll(() => lines(page)).toEqual(['# Weekend in Lisbon']);

    // A table with Tab between the cells.
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await slash(page, 'table', 'Table');
    await page.keyboard.type('Day');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Plan');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Fri');
    await expect
      .poll(() => lines(page))
      .toEqual(['# Weekend in Lisbon', '', '| Day | Plan |', '| --- | --- |', '| Fri |  |']);

    // Arrow keys move the selection; a to-do from a keyword.
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('/');
    await expect(menu).toBeVisible();
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('option', { selected: true })).toContainText('Heading 2');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Backspace');
    await slash(page, 'todo', 'To-do list');
    await page.keyboard.type('Pack');
    await expect.poll(async () => (await lines(page)).slice(-1)).toEqual(['- [ ] Pack']);

    // Undo brings back the plain line.
    await page.keyboard.press('ControlOrMeta+z');
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(async () => (await lines(page)).slice(-1)).toEqual(['']);
  });

  test('stays closed inside code and words', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New note' }).click();
    await expect(page.getByRole('textbox', { name: 'Note' })).toBeFocused();
    await page.keyboard.type('and/or `cd /');
    await page.waitForTimeout(150);
    await expect(page.getByRole('listbox', { name: 'Blocks' })).toHaveCount(0);
  });
});
