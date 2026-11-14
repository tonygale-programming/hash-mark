import { useRef, type KeyboardEvent } from 'react';
import './SegmentedControl.css';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  title?: string;
};

export type SegmentedControlProps<T extends string> = {
  /** Accessible name of the group, e.g. "Mode". */
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  'aria-describedby'?: string;
};

/** Single-choice pill group with radio semantics: arrow keys move and select. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  'aria-describedby': describedBy,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = options.length - 1;
    const target =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    const option = options[target];
    if (!option) return;
    onChange(option.value);
    refs.current[target]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-describedby={describedBy}
      className={['segmented', className].filter(Boolean).join(' ')}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            title={option.title}
            className="segmented__option"
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
