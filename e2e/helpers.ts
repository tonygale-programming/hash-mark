import { expect, type Page } from '@playwright/test';

/** The editor's lines as text, top to bottom. */
export async function lines(page: Page) {
  return page.locator('.cm-content .cm-line').allTextContents();
}

/** Opens the app, makes a new note and waits until its editor has focus; returns the editor. */
export async function openNewNote(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'New note' }).click();
  const editor = page.getByRole('textbox', { name: 'Note' });
  await expect(editor).toBeFocused();
  return editor;
}
