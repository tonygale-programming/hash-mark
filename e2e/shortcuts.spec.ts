import { expect, test } from '@playwright/test';

test.describe('Shortcuts dialog and file keys', () => {
  test('"?" opens the list outside the editor; Esc and outside clicks close it', async ({
    page,
  }) => {
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Note' });
    await page.getByRole('button', { name: 'New note' }).click();
    await expect(editor).toBeFocused();

    // In the editor, "?" is just a character.
    await page.keyboard.type('Why?');
    await expect(editor).toHaveText('Why?');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('button', { name: 'Shortcuts' }).focus();
    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('region', { name: 'Lists' })).toContainText('To-do list');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Shortcuts' })).toBeFocused();

    await page.getByRole('button', { name: 'Shortcuts' }).click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5); // the dimmed area outside the window
    await expect(dialog).toBeHidden();
  });

  test('Mod+O opens the file picker and Mod+S downloads the note', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('textbox', { name: 'Note' })).toBeVisible();

    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('ControlOrMeta+o');
    await chooser;

    const download = page.waitForEvent('download');
    await page.keyboard.press('ControlOrMeta+s');
    expect((await download).suggestedFilename()).toBe('Welcome to Hash Mark.md');
  });
});
