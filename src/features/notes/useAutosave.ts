import { useEffect, useState } from 'react';
import { Autosaver, type SaveStatus } from './autosave';
import { db } from './db';
import { updateNote } from './notesStore';

/** Autosave to IndexedDB; flushes when the page is hidden or closed. */
export function useAutosave() {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [saver] = useState(
    () => new Autosaver((id, markdown) => updateNote(db, id, markdown), setStatus),
  );

  useEffect(() => {
    const flush = () => void saver.flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [saver]);

  return { status, saver };
}
