import {
  CALLOUT_TEMPLATE,
  DIVIDER_TEMPLATE,
  IMAGE_TEMPLATE,
  TABLE_TEMPLATE,
  insertBlock,
  insertInline,
} from './insert';
import { run } from './testing';

describe('insert commands', () => {
  const table = insertBlock(TABLE_TEMPLATE);
  const divider = insertBlock(DIVIDER_TEMPLATE);
  const callout = insertBlock(CALLOUT_TEMPLATE);

  it('takes a blank line and selects the first placeholder', () => {
    expect(run(table, '‸')).toBe('| «Column 1» | Column 2 |\n| --- | --- |\n|  |  |');
    expect(run(callout, '‸')).toBe('> [!NOTE]\n> ‸');
    expect(run(divider, '‸')).toBe('---\n‸');
  });

  it('goes after a line with text, with a blank line between', () => {
    expect(run(divider, 'Intro‸')).toBe('Intro\n\n---\n‸');
    expect(run(callout, 'Packing‸')).toBe('Packing\n\n> [!NOTE]\n> ‸');
  });

  it('keeps a blank line before, so a divider never makes the line above a heading', () => {
    expect(run(divider, 'Intro\n‸')).toBe('Intro\n\n---\n‸');
  });

  it('keeps a blank line after, so the next paragraph stays out of the block', () => {
    expect(run(callout, '‸\nNext')).toBe('> [!NOTE]\n> ‸\n\nNext');
    expect(run(table, '‸\nNext')).toBe('| «Column 1» | Column 2 |\n| --- | --- |\n|  |  |\n\nNext');
  });

  it('inserts an image at the cursor', () => {
    expect(run(insertInline(IMAGE_TEMPLATE), 'See ‸ here')).toBe('See ![«alt text»](url) here');
  });
});
