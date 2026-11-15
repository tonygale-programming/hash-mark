import { HashMarkDB } from './db';
import {
  createNote,
  deleteNote,
  filterNotes,
  listNotes,
  neighborId,
  updateNote,
} from './notesStore';

let db: HashMarkDB;

beforeEach(async () => {
  db = new HashMarkDB(`test-${crypto.randomUUID()}`, { seed: false });
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('notes store', () => {
  it('creates a note with a derived title', async () => {
    const note = await createNote(db, '# Groceries\n\n- milk', 1000);
    expect(note).toMatchObject({
      title: 'Groceries',
      markdown: '# Groceries\n\n- milk',
      updatedAt: 1000,
    });
    expect(await db.notes.get(note.id)).toEqual(note);
  });

  it('creates an empty note as Untitled', async () => {
    expect((await createNote(db)).title).toBe('Untitled');
  });

  it('lists notes newest first', async () => {
    await createNote(db, 'old', 1);
    await createNote(db, 'newest', 3);
    await createNote(db, 'middle', 2);
    expect((await listNotes(db)).map((note) => note.title)).toEqual(['newest', 'middle', 'old']);
  });

  it('updates content, title and time', async () => {
    const note = await createNote(db, 'draft', 1);
    await updateNote(db, note.id, '# Final', 5);
    expect(await db.notes.get(note.id)).toMatchObject({
      title: 'Final',
      markdown: '# Final',
      updatedAt: 5,
    });
  });

  it('deletes a note', async () => {
    const keep = await createNote(db, 'keep');
    const drop = await createNote(db, 'drop');
    await deleteNote(db, drop.id);
    expect((await listNotes(db)).map((note) => note.id)).toEqual([keep.id]);
  });

  it('seeds the welcome note only when the database is first created', async () => {
    const name = `seed-${crypto.randomUUID()}`;
    const first = new HashMarkDB(name);
    const seeded = await listNotes(first);
    expect(seeded.map((note) => note.title)).toEqual(['Welcome to Hash Mark']);

    await deleteNote(first, seeded[0]!.id);
    first.close();

    const reopened = new HashMarkDB(name);
    expect(await listNotes(reopened)).toEqual([]);
    await reopened.delete();
  });
});

describe('filterNotes', () => {
  const notes = [
    {
      id: 'a',
      title: 'Project README',
      markdown: '# Project README\nInstall with npm',
      updatedAt: 2,
    },
    { id: 'b', title: 'Groceries', markdown: '- Milk\n- Bread', updatedAt: 1 },
  ];

  it('returns all notes for a blank query', () => {
    expect(filterNotes(notes, '  ')).toBe(notes);
  });

  it('matches titles and content case-insensitively', () => {
    expect(filterNotes(notes, 'readme').map((note) => note.id)).toEqual(['a']);
    expect(filterNotes(notes, 'BREAD').map((note) => note.id)).toEqual(['b']);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterNotes(notes, 'zzz')).toEqual([]);
  });
});

describe('neighborId', () => {
  const notes = ['a', 'b', 'c'].map((id, index) => ({
    id,
    title: id,
    markdown: id,
    updatedAt: index,
  }));

  it('picks the next note, or the previous one at the end', () => {
    expect(neighborId(notes, 'a')).toBe('b');
    expect(neighborId(notes, 'b')).toBe('c');
    expect(neighborId(notes, 'c')).toBe('b');
  });

  it('returns undefined when the last note goes', () => {
    expect(neighborId(notes.slice(0, 1), 'a')).toBeUndefined();
  });
});
