import { useEffect, useEffectEvent } from 'react';
import { APP_COMMANDS } from '../../commands/appCommands';
import { appCommandFor } from '../../commands/keymap';
import type { AppCommand } from '../../commands/types';

/** The editor, a field or anything editable: single-key shortcuts such as "?" must not fire there. */
function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !==
      null
  );
}

/**
 * App-level shortcuts from the registry (Mod+/ Show syntax, Mod+Shift+M cycle mode, Mod+O …),
 * anywhere on the page. The editor handles its own keys first; an open dialog keeps its keys.
 */
export function useAppShortcuts(run: (command: AppCommand) => void) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || document.querySelector('dialog[open]')) {
      return;
    }
    const command = appCommandFor(event, APP_COMMANDS);
    if (!command) return;
    if (command.notWhileTyping && isTypingTarget(event.target)) return;
    event.preventDefault();
    run(command);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}
