import type { KeyBinding } from '@codemirror/view';
import { isApplePlatform } from '../lib/shortcut';
import type { AppCommand, EditorCommand } from './types';

/**
 * "Mod+Shift+X" → CodeMirror's "Mod-Shift-x". Letters must be lowercase: CodeMirror matches the
 * key's case, so "Mod-I" would only fire with Shift held.
 */
export function toCodeMirrorKey(shortcut: string): string {
  const parts = shortcut.split('+');
  const key = parts.pop()!;
  return [...parts, /^[A-Z]$/.test(key) ? key.toLowerCase() : key].join('-');
}

/** Editor key bindings generated from the registry (commands returning false fall through). */
export function editorKeyBindings(commands: EditorCommand[]): KeyBinding[] {
  return commands
    .filter((command) => command.shortcut)
    .map((command) => ({
      key: toCodeMirrorKey(command.shortcut!),
      run: command.run,
      preventDefault: command.shortcut !== 'Tab' && command.shortcut !== 'Shift+Tab',
    }));
}

const CODES: Record<string, string> = { '/': 'Slash', Enter: 'Enter', Tab: 'Tab' };

/**
 * Whether a keydown matches a registry shortcut, by physical key (event.code), so letters work on
 * any keyboard layout: Mod+Shift+M is the same key on a Russian layout.
 */
export function matchesShortcut(
  event: Pick<KeyboardEvent, 'code' | 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
  shortcut: string,
  apple = isApplePlatform(),
): boolean {
  const parts = shortcut.split('+');
  const key = parts.pop()!;
  const mods = new Set(parts);
  const wantMeta = (mods.has('Mod') && apple) || mods.has('Meta');
  const wantCtrl = (mods.has('Mod') && !apple) || mods.has('Ctrl');
  if (event.metaKey !== wantMeta || event.ctrlKey !== wantCtrl) return false;
  if (event.altKey !== mods.has('Alt') || event.shiftKey !== mods.has('Shift')) return false;
  if (/^[a-z]$/i.test(key)) return event.code === `Key${key.toUpperCase()}`;
  if (/^\d$/.test(key)) return event.code === `Digit${key}`;
  if (CODES[key]) return event.code === CODES[key] || event.key === key;
  return event.key === key;
}

/** The app command for a keydown, if any. */
export function appCommandFor(
  event: KeyboardEvent,
  commands: AppCommand[],
  apple = isApplePlatform(),
): AppCommand | undefined {
  return commands.find((c) => c.shortcut && matchesShortcut(event, c.shortcut, apple));
}
