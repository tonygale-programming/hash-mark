import Dexie, { type EntityTable } from 'dexie';
import welcomeMarkdown from './welcome.md?raw';
import { deriveTitle } from './title';

export type Note = {
  id: string;
  title: string;
  markdown: string;
  updatedAt: number;
};

export class HashMarkDB extends Dexie {
  notes!: EntityTable<Note, 'id'>;

  /** `seed` adds the welcome note when the database is first created (never again). */
  constructor(name = 'hash-mark', { seed = true }: { seed?: boolean } = {}) {
    super(name);
    this.version(1).stores({ notes: 'id, updatedAt' });
    if (seed) {
      this.on('populate', (tx) => {
        void tx.table<Note, string>('notes').add(makeNote(welcomeMarkdown));
      });
    }
  }
}

export function makeNote(markdown = '', now = Date.now()): Note {
  return { id: crypto.randomUUID(), title: deriveTitle(markdown), markdown, updatedAt: now };
}

export const db = new HashMarkDB();
