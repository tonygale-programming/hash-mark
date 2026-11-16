import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import './Dialog.css';

export type DialogProps = {
  open: boolean;
  title: string;
  /** Esc, a click outside, or a close button. */
  onClose: () => void;
  children?: ReactNode;
  /** Buttons along the bottom, right-aligned. */
  actions?: ReactNode;
  /** Gets focus on open (default: the browser's first focusable element). */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Id of the element that describes the dialog, if any. */
  describedBy?: string;
  className?: string;
};

/**
 * Modal on the native <dialog> (focus is kept inside, the page behind is inert), as in Curly Brace:
 * Esc and a click on the dimmed area close it; focus returns to where it was.
 */
export function Dialog({
  open,
  title,
  onClose,
  children,
  actions,
  initialFocus,
  describedBy,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocus?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus]);

  return (
    <dialog
      ref={ref}
      className={['dialog', className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog__card">
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {children}
        {actions && <div className="dialog__actions">{actions}</div>}
      </div>
    </dialog>
  );
}
