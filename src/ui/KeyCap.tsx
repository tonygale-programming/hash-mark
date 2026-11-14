import { formatShortcut, shortcutLabel } from '../lib/shortcut';
import './KeyCap.css';

export function KeyCap({ children }: { children: string }) {
  return <kbd className="keycap">{children}</kbd>;
}

/** Renders "Mod+Shift+M" as platform keycaps, with a plain-text accessible label. */
export function Shortcut({ shortcut }: { shortcut: string }) {
  return (
    <span className="shortcut" aria-label={shortcutLabel(shortcut)} role="img">
      {formatShortcut(shortcut).map((key, index) => (
        <KeyCap key={index}>{key}</KeyCap>
      ))}
    </span>
  );
}
