import { expect, test } from '@playwright/test';

test.describe('M1 editor', () => {
  test('types Markdown, autosaves, and restores after reload', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('complementary', { name: 'Notes' });
    const editor = page.getByRole('textbox', { name: 'Note' });
    const status = page.getByRole('status');

    await page.getByRole('button', { name: 'New note' }).click();
    await expect(editor).toBeFocused();

    await page.keyboard.type('# Shopping list');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- milk');
    await page.keyboard.press('Enter'); // list continues: "- "
    await page.keyboard.type('eggs');

    await expect(editor.locator('.cm-md-h1')).toHaveText('# Shopping list');
    await expect(sidebar.locator('.note-list__title').first()).toHaveText('Shopping list');
    await expect(status).toContainText('Saved');
    const statusBar = page.getByRole('contentinfo', { name: 'Document status' });
    await expect(statusBar).toContainText('4 words');
    await expect(statusBar).toContainText('Headings 1');

    await page.reload();
    await expect(sidebar.locator('.note-list__title').first()).toHaveText('Shopping list');
    await expect(editor).toContainText('- eggs');
  });

  test('undo works and Mod+/ is left free for Show syntax', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'New note' }).click();
    const editor = page.getByRole('textbox', { name: 'Note' });
    await expect(editor).toBeFocused();

    await page.keyboard.type('Hello');
    await page.keyboard.press('ControlOrMeta+/');
    await expect(editor).toHaveText('Hello');

    await page.keyboard.press('ControlOrMeta+z');
    await expect(editor).not.toContainText('Hello');
  });
});
