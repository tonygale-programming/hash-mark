import type { ComponentPropsWithRef, ReactNode } from 'react';
import './Toggle.css';

export type ToggleProps = Omit<ComponentPropsWithRef<'button'>, 'onChange'> & {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /** Short mono glyph before the label, e.g. "#". */
  glyph?: string;
  children: ReactNode;
};

/** On/off pill. ON uses the accent fill. */
export function Toggle({
  pressed,
  onPressedChange,
  glyph,
  children,
  className,
  ...rest
}: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={['btn', 'btn--outline', 'toggle', className].filter(Boolean).join(' ')}
      onClick={() => onPressedChange(!pressed)}
      {...rest}
    >
      {glyph && (
        <span className="toggle__glyph" aria-hidden="true">
          {glyph}
        </span>
      )}
      <span className="btn__label">{children}</span>
    </button>
  );
}
