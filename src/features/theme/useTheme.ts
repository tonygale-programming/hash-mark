import { useCallback, useEffect, useState } from 'react';
import { DARK_QUERY, readStoredTheme, resolveTheme, writeStoredTheme, type Theme } from './theme';

function systemPrefersDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    resolveTheme(readStoredTheme(safeLocalStorage()), systemPrefersDark()),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Follow system changes until the person picks a theme explicitly.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (readStoredTheme(safeLocalStorage()) === null) setTheme(event.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      writeStoredTheme(safeLocalStorage(), next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
