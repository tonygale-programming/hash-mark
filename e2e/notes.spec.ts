import { expect, test } from '@playwright/test';

test.describe('M1 notes', () => {
  test('creates, persists and deletes notes in IndexedDB', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('complementary', { name: 'Notes' });
    const titles = sidebar.locator('.note-list__title');

    await expect(titles).toHaveText(['Welcome to Hash Mark']);

    await page.getByRole('button', { name: 'New note' }).click();
    await expect(titles).toHaveText(['Untitled', 'Welcome to Hash Mark']);
    await expect(sidebar.getByRole('button', { name: /^Untitled/ })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // Survives a reload, with the selection remembered.
    await page.reload();
    await expect(titles).toHaveText(['Untitled', 'Welcome to Hash Mark']);
    await expect(sidebar.getByRole('button', { name: /^Untitled/ })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // Esc cancels the confirmation.
    await sidebar.getByRole('button', { name: 'Delete note “Untitled”' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete “Untitled”?' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(titles).toHaveCount(2);

    await sidebar.getByRole('button', { name: 'Delete note “Untitled”' }).click();
    await dialog.getByRole('button', { name: 'Delete note' }).click();
    await expect(titles).toHaveText(['Welcome to Hash Mark']);
    await expect(sidebar.getByRole('button', { name: /^Welcome to Hash Mark/ })).toBeFocused();

    await page.reload();
    await expect(titles).toHaveText(['Welcome to Hash Mark']);
  });

  test('does not re-seed the welcome note after it is deleted', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('complementary', { name: 'Notes' });
    await sidebar.getByRole('button', { name: 'Delete note “Welcome to Hash Mark”' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete note' }).click();
    await expect(sidebar.getByText('No notes yet')).toBeVisible();

    await page.reload();
    await expect(sidebar.getByText('No notes yet')).toBeVisible();
  });
});
