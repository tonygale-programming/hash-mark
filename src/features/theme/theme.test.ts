import { readStoredTheme, resolveTheme, THEME_STORAGE_KEY, writeStoredTheme } from './theme';

describe('theme', () => {
  it('prefers a saved theme over the system preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('falls back to the system preference', () => {
    expect(resolveTheme(null, true)).toBe('dark');
    expect(resolveTheme(null, false)).toBe('light');
  });

  it('ignores unknown stored values', () => {
    expect(readStoredTheme({ getItem: () => 'sepia' })).toBeNull();
    expect(readStoredTheme({ getItem: () => null })).toBeNull();
    expect(readStoredTheme(undefined)).toBeNull();
  });

  it('survives storage that throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readStoredTheme(throwing)).toBeNull();
    expect(() => writeStoredTheme(throwing, 'dark')).not.toThrow();
  });

  it('round-trips through storage', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
    };
    writeStoredTheme(storage, 'dark');
    expect(map.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredTheme(storage)).toBe('dark');
  });
});
