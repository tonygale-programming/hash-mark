import { expect, test } from '@playwright/test';

test.describe('M1 files', () => {
  test('opens a file from the picker, downloads and copies it', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const sidebar = page.getByRole('complementary', { name: 'Notes' });

    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Open file' }).click();
    await (
      await chooser
    ).setFiles({
      name: 'meeting.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Meeting notes\r\n\r\n- Ship it\r\n'),
    });

    await expect(sidebar.locator('.note-list__title').first()).toHaveText('Meeting notes');
    await expect(page.getByText('Opened “Meeting notes”.')).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('Meeting notes.md');
    const saved = await file.createReadStream();
    let text = '';
    for await (const chunk of saved) text += chunk;
    expect(text).toBe('# Meeting notes\n\n- Ship it\n');

    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(page.getByText('Copied Markdown')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      '# Meeting notes\n\n- Ship it\n',
    );
  });

  test('opens a file dropped on the editor as a new note', async ({ page }) => {
    await page.goto('/');
    const editor = page.getByRole('textbox', { name: 'Note' });
    await expect(editor).toContainText('Welcome to Hash Mark');

    const dataTransfer = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['# Dropped note'], 'dropped.md', { type: 'text/markdown' }));
      return dt;
    });
    await editor.dispatchEvent('dragenter', { dataTransfer });
    await expect(page.getByRole('main')).toHaveClass(/is-dragging/);
    await editor.dispatchEvent('drop', { dataTransfer });

    const sidebar = page.getByRole('complementary', { name: 'Notes' });
    await expect(sidebar.locator('.note-list__title')).toHaveText([
      'Dropped note',
      'Welcome to Hash Mark',
    ]);
    // The welcome note was not modified by the drop.
    await sidebar.getByRole('button', { name: /^Welcome to Hash Mark/ }).click();
    await expect(editor).not.toContainText('Dropped note');
  });
});
