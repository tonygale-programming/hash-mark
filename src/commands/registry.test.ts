import { APP_COMMANDS, appCommand } from './appCommands';
import { EDITOR_COMMANDS } from './editorCommands';
import { appCommandFor, editorKeyBindings, matchesShortcut, toCodeMirrorKey } from './keymap';

const key = (init: Partial<KeyboardEvent>) =>
  ({
    code: '',
    key: '',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...init,
  }) as KeyboardEvent;

describe('registry', () => {
  const all = [...EDITOR_COMMANDS, ...APP_COMMANDS];

  it('has unique ids and unique shortcuts', () => {
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const shortcuts = all.flatMap((c) => (c.shortcut ? [c.shortcut] : []));
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
  });

  it('covers every shortcut in the spec (docs/editor-ux-spec.md §5)', () => {
    const shortcuts = new Set(all.map((c) => c.shortcut));
    for (const s of [
      'Mod+B',
      'Mod+I',
      'Mod+Shift+X',
      'Mod+K',
      'Mod+Alt+1',
      'Mod+Alt+2',
      'Mod+Alt+3',
      'Mod+Shift+8',
      'Mod+Shift+7',
      'Mod+Shift+9',
      'Mod+E',
      'Mod+Shift+E',
      'Tab',
      'Shift+Tab',
      'Mod+Enter',
      'Mod+/',
      'Mod+Shift+M',
    ]) {
      expect(shortcuts).toContain(s);
    }
  });

  it('gives every command a sentence-case label, an icon and keywords', () => {
    for (const command of all) {
      expect(command.label).toBe(
        command.label[0]!.toUpperCase() + command.label.slice(1).toLowerCase(),
      );
      expect(command.icon).toBeTruthy();
      expect(Array.isArray(command.keywords)).toBe(true);
    }
  });

  it('looks up app commands by id', () => {
    expect(appCommand('app.cycleMode').shortcut).toBe('Mod+Shift+M');
    expect(() => appCommand('nope')).toThrow();
  });
});

describe('keymap', () => {
  it('converts to CodeMirror key names with lowercase letters', () => {
    expect(toCodeMirrorKey('Mod+B')).toBe('Mod-b');
    expect(toCodeMirrorKey('Mod+Shift+X')).toBe('Mod-Shift-x');
    expect(toCodeMirrorKey('Mod+Shift+8')).toBe('Mod-Shift-8');
    expect(toCodeMirrorKey('Shift+Tab')).toBe('Shift-Tab');
    expect(toCodeMirrorKey('Mod+Enter')).toBe('Mod-Enter');
  });

  it('lets Tab fall through to focus moves, and prevents defaults for the rest', () => {
    const bindings = editorKeyBindings(EDITOR_COMMANDS);
    expect(bindings.find((b) => b.key === 'Tab')?.preventDefault).toBe(false);
    expect(bindings.find((b) => b.key === 'Mod-b')?.preventDefault).toBe(true);
  });

  it('matches app shortcuts by physical key on any layout', () => {
    // Ctrl+Shift+M on a Russian layout: key is "Ь", code is still KeyM.
    expect(
      matchesShortcut(
        key({ code: 'KeyM', key: 'Ь', ctrlKey: true, shiftKey: true }),
        'Mod+Shift+M',
        false,
      ),
    ).toBe(true);
    expect(
      matchesShortcut(
        key({ code: 'KeyM', key: 'm', metaKey: true, shiftKey: true }),
        'Mod+Shift+M',
        true,
      ),
    ).toBe(true);
    expect(matchesShortcut(key({ code: 'Slash', key: '/', ctrlKey: true }), 'Mod+/', false)).toBe(
      true,
    );
  });

  it('requires the exact modifiers', () => {
    expect(matchesShortcut(key({ code: 'KeyM', ctrlKey: true }), 'Mod+Shift+M', false)).toBe(false);
    expect(
      matchesShortcut(
        key({ code: 'KeyM', ctrlKey: true, shiftKey: true, altKey: true }),
        'Mod+Shift+M',
        false,
      ),
    ).toBe(false);
    expect(
      matchesShortcut(key({ code: 'KeyM', metaKey: true, shiftKey: true }), 'Mod+Shift+M', false),
    ).toBe(false);
  });

  it('matches "?" by the character typed, with or without Shift', () => {
    expect(matchesShortcut(key({ key: '?', code: 'Slash', shiftKey: true }), '?', true)).toBe(true);
    expect(matchesShortcut(key({ key: '?', code: 'Comma', shiftKey: true }), '?', false)).toBe(
      true,
    );
    expect(matchesShortcut(key({ key: '?', code: 'Minus' }), '?', false)).toBe(true);
    expect(
      matchesShortcut(key({ key: '?', code: 'Slash', ctrlKey: true, shiftKey: true }), '?', false),
    ).toBe(false);
    expect(matchesShortcut(key({ key: '/', code: 'Slash' }), '?', false)).toBe(false);
  });

  it('finds the app command for a key', () => {
    expect(
      appCommandFor(key({ code: 'Slash', key: '/', metaKey: true }), APP_COMMANDS, true)?.id,
    ).toBe('app.showSyntax');
    expect(
      appCommandFor(key({ code: 'KeyQ', ctrlKey: true }), APP_COMMANDS, false),
    ).toBeUndefined();
  });
});
