import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { listNotes } from './notesStore';

/** Live list of notes, newest first; undefined while the first query loads. */
export function useNotes() {
  return useLiveQuery(() => listNotes(db), []);
}
