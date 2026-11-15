import { useCallback, useEffect, useRef, useState } from 'react';
import './Toast.css';

export type ToastTone = 'default' | 'danger';
export type ToastMessage = { id: number; text: string; tone: ToastTone };

const DURATION_MS = 4000;
const ERROR_DURATION_MS = 7000;

/** One toast at a time; a new message replaces the current one. */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((text: string, tone: ToastTone = 'default') => {
    window.clearTimeout(timer.current);
    nextId.current += 1;
    setToast({ id: nextId.current, text, tone });
    timer.current = window.setTimeout(
      () => setToast(null),
      tone === 'danger' ? ERROR_DURATION_MS : DURATION_MS,
    );
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, show, dismiss };
}

/** Polite live region: the region stays mounted so screen readers announce each message. */
export function Toast({ toast }: { toast: ToastMessage | null }) {
  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toast && (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
