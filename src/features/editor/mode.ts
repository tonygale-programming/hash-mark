export type Mode = 'write' | 'split' | 'read';

export const MODE_OPTIONS = [
  { value: 'write', label: 'Write' },
  { value: 'split', label: 'Split' },
  { value: 'read', label: 'Read' },
] as const satisfies readonly { value: Mode; label: string }[];

/** Split is desktop-only: on narrow screens it falls back to Write without losing the choice. */
export function effectiveMode(mode: Mode, narrow: boolean): Mode {
  return narrow && mode === 'split' ? 'write' : mode;
}

export function availableModes(narrow: boolean) {
  return narrow ? MODE_OPTIONS.filter((option) => option.value !== 'split') : MODE_OPTIONS;
}
