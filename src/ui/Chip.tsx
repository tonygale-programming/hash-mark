import type { ReactNode } from 'react';
import './Chip.css';

export type ChipTone = 'neutral' | 'success' | 'danger';

export function Chip({
  tone = 'neutral',
  dot = false,
  children,
}: {
  tone?: ChipTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`chip chip--${tone}`}>
      {dot && <span className="chip__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
