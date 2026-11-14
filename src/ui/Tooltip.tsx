import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { Shortcut } from './KeyCap';
import './Tooltip.css';

const HOVER_DELAY_MS = 400;

export type TooltipProps = {
  label: string;
  shortcut?: string;
  align?: 'center' | 'start' | 'end';
  /** Set false when the label already is the control's accessible name (icon-only buttons). */
  describe?: boolean;
  children: ReactElement<{ 'aria-describedby'?: string }>;
};

/** Dark tooltip under a control, on hover (delayed) or keyboard focus. Esc hides it. */
export function Tooltip({
  label,
  shortcut,
  align = 'center',
  describe = true,
  children,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // Focus caused by a pointer press should not open the tooltip; keyboard focus should.
  const pointerDown = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function show(delay: number) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  }

  function hide() {
    window.clearTimeout(timer.current);
    setOpen(false);
  }

  return (
    <span
      className="tooltip-anchor"
      onPointerEnter={(event) => event.pointerType === 'mouse' && show(HOVER_DELAY_MS)}
      onPointerLeave={hide}
      onPointerDown={() => {
        pointerDown.current = true;
      }}
      onPointerUp={() => {
        pointerDown.current = false;
      }}
      onFocus={() => {
        if (!pointerDown.current) show(0);
      }}
      onBlur={() => {
        pointerDown.current = false;
        hide();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide();
      }}
      onClick={hide}
    >
      {describe ? cloneElement(children, { 'aria-describedby': id }) : children}
      <span id={id} role="tooltip" className={`tooltip tooltip--${align}`} hidden={!open}>
        {label}
        {shortcut && <Shortcut shortcut={shortcut} />}
      </span>
    </span>
  );
}
