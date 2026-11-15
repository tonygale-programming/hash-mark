import { makeNote, type HashMarkDB, type Note } from './db';
import { deriveTitle } from './title';

/** Most recently edited first. */
export function listNotes(db: HashMarkDB): Promise<Note[]> {
  return db.notes.orderBy('updatedAt').reverse().toArray();
}

export async function createNote(db: HashMarkDB, markdown = '', now = Date.now()): Promise<Note> {
  const note = makeNote(markdown, now);
  await db.notes.add(note);
  return note;
}

export async function updateNote(
  db: HashMarkDB,
  id: string,
  markdown: string,
  now = Date.now(),
): Promise<void> {
  await db.notes.update(id, { markdown, title: deriveTitle(markdown), updatedAt: now });
}

export function deleteNote(db: HashMarkDB, id: string): Promise<void> {
  return db.notes.delete(id);
}

/** Case-insensitive match on title and content. */
export function filterNotes(notes: Note[], query: string): Note[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return notes;
  return notes.filter(
    (note) =>
      note.title.toLocaleLowerCase().includes(needle) ||
      note.markdown.toLocaleLowerCase().includes(needle),
  );
}

/** The note to select after removing `id`: the next one in the list, else the previous one. */
export function neighborId(notes: Note[], id: string): string | undefined {
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return notes[0]?.id;
  return (notes[index + 1] ?? notes[index - 1])?.id;
}
