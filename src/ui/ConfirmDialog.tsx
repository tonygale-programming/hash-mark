import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import './ConfirmDialog.css';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` styles the confirm button for destructive actions. */
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

/** Modal confirmation on the native <dialog>: focus is trapped, Esc and the backdrop cancel. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Safer default for destructive prompts: focus Cancel.
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={children ? bodyId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="dialog__card">
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {children && (
          <div id={bodyId} className="dialog__body">
            {children}
          </div>
        )}
        <div className="dialog__actions">
          <Button ref={cancelRef} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'outline'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
