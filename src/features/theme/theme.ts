import { readString, writeString } from '../../lib/storage';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'hash-mark:theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** The saved theme; null when none is saved, it is not a theme, or storage is blocked. */
export function readStoredTheme(): Theme | null {
  const value = readString(THEME_STORAGE_KEY);
  return isTheme(value) ? value : null;
}

/** Saves the choice; with storage blocked (private mode) it still applies for this session. */
export function writeStoredTheme(theme: Theme) {
  writeString(THEME_STORAGE_KEY, theme);
}

/** A saved choice wins; otherwise follow the system preference. */
export function resolveTheme(stored: Theme | null, prefersDark: boolean): Theme {
  return stored ?? (prefersDark ? 'dark' : 'light');
}
