import { formatShortcut, isApplePlatform, shortcutLabel } from './shortcut';

describe('formatShortcut', () => {
  it('uses symbols on Apple platforms', () => {
    expect(formatShortcut('Mod+Shift+M', true)).toEqual(['⌘', '⇧', 'M']);
    expect(formatShortcut('Mod+Alt+1', true)).toEqual(['⌘', '⌥', '1']);
  });

  it('uses Ctrl names elsewhere', () => {
    expect(formatShortcut('Mod+Shift+M', false)).toEqual(['Ctrl', 'Shift', 'M']);
  });

  it('uppercases single letters and keeps symbols', () => {
    expect(formatShortcut('Mod+/', false)).toEqual(['Ctrl', '/']);
    expect(formatShortcut('Mod+b', true)).toEqual(['⌘', 'B']);
  });

  it('builds a plain label', () => {
    expect(shortcutLabel('Mod+/', true)).toBe('⌘/');
    expect(shortcutLabel('Mod+/', false)).toBe('Ctrl+/');
  });

  it('detects Apple platforms', () => {
    expect(isApplePlatform('MacIntel')).toBe(true);
    expect(isApplePlatform('iPhone')).toBe(true);
    expect(isApplePlatform('Win32')).toBe(false);
  });
});
