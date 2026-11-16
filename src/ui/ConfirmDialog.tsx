import { useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

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

/** A yes/no question. Cancel has focus first: the safer default for destructive prompts. */
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
  const cancelRef = useRef<HTMLButtonElement>(null);
  const bodyId = useId();
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onCancel}
      initialFocus={cancelRef}
      describedBy={children ? bodyId : undefined}
      actions={
        <>
          <Button ref={cancelRef} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'outline'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children && (
        <div id={bodyId} className="dialog__body">
          {children}
        </div>
      )}
    </Dialog>
  );
}
