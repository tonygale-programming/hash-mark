import { useCallback, useEffect, useState } from 'react';
import { DARK_QUERY, readStoredTheme, resolveTheme, writeStoredTheme, type Theme } from './theme';

function systemPrefersDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

/**
 * As in Curly Brace: with no saved choice there is no data-theme and the CSS follows the system
 * (color-scheme + light-dark()); pressing the theme button saves a choice and sets data-theme.
 * `theme` is the theme in effect, for the button's icon and label.
 */
export function useTheme() {
  const [saved, setSaved] = useState<Theme | null>(() => readStoredTheme());
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const theme = resolveTheme(saved, systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (saved) root.dataset.theme = saved;
    else delete root.dataset.theme;
  }, [saved]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    writeStoredTheme(next);
    setSaved(next);
  }, [theme]);

  return { theme, toggleTheme };
}
