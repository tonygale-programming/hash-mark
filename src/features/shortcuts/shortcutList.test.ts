import { APP_COMMANDS } from '../../commands/appCommands';
import { EDITOR_COMMANDS } from '../../commands/editorCommands';
import { balanceColumns, shortcutGroups } from './shortcutList';

describe('shortcutGroups', () => {
  it('lists every registry command that has a key, in a fixed group order', () => {
    const groups = shortcutGroups(true);
    expect(groups.map((g) => g.name)).toEqual([
      'Text',
      'Blocks',
      'Lists',
      'Editing',
      'Note',
      'View',
    ]);
    const listed = new Set(groups.flatMap((g) => g.rows.map((r) => r.id)));
    for (const command of [...EDITOR_COMMANDS, ...APP_COMMANDS]) {
      expect(listed.has(command.id)).toBe(Boolean(command.shortcut));
    }
  });

  it('shows the platform redo key', () => {
    const redo = (apple: boolean) =>
      shortcutGroups(apple)
        .find((g) => g.name === 'Editing')!
        .rows.find((r) => r.label === 'Redo')!.shortcut;
    expect(redo(true)).toBe('Mod+Shift+Z');
    expect(redo(false)).toBe('Mod+Y');
  });
});

describe('balanceColumns', () => {
  it('splits the groups into two columns of near-equal height, keeping order', () => {
    const [left, right] = balanceColumns(shortcutGroups(true));
    const rows = (list: typeof left) => list.reduce((n, g) => n + g.rows.length, 0);
    expect(left[0]!.name).toBe('Text');
    expect(Math.abs(rows(left) - rows(right))).toBeLessThanOrEqual(2);
    expect([...left, ...right].map((g) => g.name).sort()).toEqual([
      'Blocks',
      'Editing',
      'Lists',
      'Note',
      'Text',
      'View',
    ]);
  });
});
