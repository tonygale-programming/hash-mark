export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'hash-mark:theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** Reads the saved theme; returns null when none is saved or storage is unavailable. */
export function readStoredTheme(storage: Pick<Storage, 'getItem'> | undefined): Theme | null {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(storage: Pick<Storage, 'setItem'> | undefined, theme: Theme) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this session.
  }
}

/** A saved choice wins; otherwise follow the system preference. */
export function resolveTheme(stored: Theme | null, prefersDark: boolean): Theme {
  return stored ?? (prefersDark ? 'dark' : 'light');
}
