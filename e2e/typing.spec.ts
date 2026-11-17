import { expect, test } from '@playwright/test';
import { lines, openNewNote } from './helpers';

test.describe('M2 smart typing', () => {
  test('continues and leaves lists, closes fences and pairs', async ({ page }) => {
    await openNewNote(page);

    // "[] " makes a task; Enter continues it; Enter on the empty item leaves the list.
    await page.keyboard.type('[] milk');
    await page.keyboard.press('Enter');
    await page.keyboard.type('eggs');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect.poll(() => lines(page)).toEqual(['- [ ] milk', '- [ ] eggs', '']);

    // Pairs close and step over; ** opens bold.
    await page.keyboard.type('See (docs) and **bold** and `code`');
    await expect
      .poll(() => lines(page))
      .toEqual(['- [ ] milk', '- [ ] eggs', 'See (docs) and **bold** and `code`']);

    // An opening fence gets its closing fence.
    await page.keyboard.press('Enter');
    await page.keyboard.type('```js');
    await page.keyboard.press('Enter');
    await page.keyboard.type('let a = 1;');
    await expect
      .poll(() => lines(page))
      .toEqual([
        '- [ ] milk',
        '- [ ] eggs',
        'See (docs) and **bold** and `code`',
        '```js',
        'let a = 1;',
        '```',
      ]);
  });

  test('wraps a selection and keeps $ for prices', async ({ page }) => {
    await openNewNote(page);

    await page.keyboard.type('It costs $5 today');
    for (let i = 0; i < 5; i++) await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.type('_');
    await expect.poll(() => lines(page)).toEqual(['It costs $5 _today_']);

    await page.keyboard.press('Backspace');
    await expect.poll(() => lines(page)).toEqual(['It costs $5 __']);
  });
});
