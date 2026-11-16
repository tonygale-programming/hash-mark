import { expect, test } from '@playwright/test';

test.describe('Sample and Clear', () => {
  test('sample opens beside existing writing; clear is undoable', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('complementary', { name: 'Notes' });
    const titles = sidebar.locator('.note-list__title');
    const editor = page.getByRole('textbox', { name: 'Note' });
    await expect(titles).toHaveText(['Welcome to Hash Mark']);

    await page.getByRole('button', { name: 'Sample' }).click();
    await expect(page.getByText('Sample opened as a new note')).toBeVisible();
    await expect(titles).toHaveText(['Weekend in Lisbon', 'Welcome to Hash Mark']);
    await expect(editor).toContainText('Weekend in Lisbon');

    const clear = page.getByRole('button', { name: 'Clear' });
    await clear.click();
    await expect(page.getByText('Cleared')).toBeVisible();
    await expect(editor).toBeFocused();
    await expect(clear).toBeDisabled();
    await expect(titles.first()).toHaveText('Untitled');

    await page.keyboard.press('ControlOrMeta+z');
    await expect(editor).toContainText('Weekend in Lisbon');
    await expect(clear).toBeEnabled();
    await expect(titles.first()).toHaveText('Weekend in Lisbon');

    // An empty note takes the sample in place.
    await page.getByRole('button', { name: 'New note' }).click();
    await page.getByRole('button', { name: 'Sample' }).click();
    await expect(page.getByText('Sample loaded')).toBeVisible();
    await expect(titles).toHaveText([
      'Weekend in Lisbon',
      'Weekend in Lisbon',
      'Welcome to Hash Mark',
    ]);
  });
});
