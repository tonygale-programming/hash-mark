/** Shortcuts are written as "Mod+Shift+M"; Mod is Cmd on Apple platforms and Ctrl elsewhere. */

const MAC_KEYS: Record<string, string> = {
  Mod: '⌘',
  Shift: '⇧',
  Alt: '⌥',
  Ctrl: '⌃',
  Enter: '↩',
};

const OTHER_KEYS: Record<string, string> = {
  Mod: 'Ctrl',
};

export function isApplePlatform(
  platform = typeof navigator === 'undefined' ? '' : navigator.platform,
) {
  return /Mac|iPhone|iPad|iPod/.test(platform);
}

export function formatShortcut(shortcut: string, apple = isApplePlatform()): string[] {
  const map = apple ? MAC_KEYS : OTHER_KEYS;
  return shortcut
    .split('+')
    .filter(Boolean)
    .map((key) => map[key] ?? (key.length === 1 ? key.toUpperCase() : key));
}

/** Plain-text form for tooltips and aria-keyshortcuts-like labels. */
export function shortcutLabel(shortcut: string, apple = isApplePlatform()): string {
  return formatShortcut(shortcut, apple).join(apple ? '' : '+');
}
