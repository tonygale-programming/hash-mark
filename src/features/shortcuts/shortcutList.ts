import { APP_COMMANDS } from '../../commands/appCommands';
import { EDITOR_COMMANDS } from '../../commands/editorCommands';
import { isApplePlatform } from '../../lib/shortcut';

export type ShortcutRow = { id: string; label: string; shortcut: string };
export type ShortcutGroup = { name: string; rows: ShortcutRow[] };

const GROUP_ORDER = ['Text', 'Blocks', 'Lists', 'Editing', 'Note', 'View'];

/**
 * Everything with a key, grouped for the Shortcuts dialog. Built from the command registry, so the
 * list cannot drift from the keys that actually work. Undo and Redo come from the editor's history
 * keymap and are listed for reference.
 */
export function shortcutGroups(apple = isApplePlatform()): ShortcutGroup[] {
  const rows: (ShortcutRow & { group: string })[] = [
    ...[...EDITOR_COMMANDS, ...APP_COMMANDS]
      .filter((command) => command.shortcut)
      .map(({ id, label, shortcut, group }) => ({ id, label, shortcut: shortcut!, group })),
    { id: 'editing.undo', label: 'Undo', shortcut: 'Mod+Z', group: 'Editing' },
    {
      id: 'editing.redo',
      label: 'Redo',
      shortcut: apple ? 'Mod+Shift+Z' : 'Mod+Y',
      group: 'Editing',
    },
  ];
  return GROUP_ORDER.map((name) => ({
    name,
    rows: rows
      .filter((row) => row.group === name)
      .map(({ id, label, shortcut }) => ({ id, label, shortcut })),
  })).filter((group) => group.rows.length > 0);
}

/**
 * Splits groups into two columns of near-equal height (a heading counts as 1.5 rows), keeping the
 * group order inside each column. Six groups means 64 splits: trying them all is instant.
 */
export function balanceColumns(groups: ShortcutGroup[]): [ShortcutGroup[], ShortcutGroup[]] {
  const height = (list: ShortcutGroup[]) => list.reduce((h, g) => h + g.rows.length + 1.5, 0);
  let best: [ShortcutGroup[], ShortcutGroup[]] = [groups, []];
  let bestDiff = Infinity;
  for (let mask = 0; mask < 1 << groups.length; mask++) {
    if (!(mask & 1)) continue; // the first group always starts the left column
    const left = groups.filter((_, i) => mask & (1 << i));
    const right = groups.filter((_, i) => !(mask & (1 << i)));
    const diff = Math.abs(height(left) - height(right));
    if (diff < bestDiff) [best, bestDiff] = [[left, right], diff];
  }
  return best;
}
