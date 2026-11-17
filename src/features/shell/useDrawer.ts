import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/**
 * The notes drawer on narrow screens: `initialFocus` gets focus on open; Esc closes it and returns
 * focus to the button that opened it. `visible` is false on wide screens, whatever `open` says.
 */
export function useDrawer(enabled: boolean, initialFocus: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visible = enabled && open;

  const show = useCallback(() => setOpen(true), []);
  /** Closes without moving focus (the next thing to focus is decided elsewhere). */
  const hide = useCallback(() => setOpen(false), []);
  /** Closes and returns focus to the Notes button. */
  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!visible) return;
    initialFocus.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      // Esc inside an open dialog belongs to the dialog.
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [visible, initialFocus, close]);

  return { open, visible, buttonRef, show, hide, close };
}
