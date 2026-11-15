import { act, render, screen, waitFor, within } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { db } from './features/notes/db';
import { createNote } from './features/notes/notesStore';
import { THEME_STORAGE_KEY } from './features/theme/theme';
import { NARROW_QUERY } from './lib/useMediaQuery';
import { setMediaMatches } from './test/setup';

beforeEach(async () => {
  // Fresh database for each test; first open seeds the welcome note.
  await db.delete();
  await db.open();
});

function sidebar() {
  return screen.getByRole('complementary', { name: 'Notes' });
}

function editorView() {
  const view = EditorView.findFromDOM(screen.getByRole('textbox', { name: 'Note' }));
  if (!view) throw new Error('editor not found');
  return view;
}

function replaceDoc(text: string) {
  const view = editorView();
  act(() => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }));
}

async function renderWithNotes() {
  render(<App />);
  await screen.findByRole('button', { name: /^Welcome to Hash Mark/ });
  await screen.findByRole('textbox', { name: 'Note' }); // editor is lazy-loaded
}

describe('App shell', () => {
  it('renders header, toolbar, sidebar, editor and status bar', async () => {
    await renderWithNotes();
    expect(screen.getByRole('banner')).toHaveTextContent('Hash Mark');
    expect(screen.getByRole('button', { name: 'New note' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('main', { name: 'Document' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('starts in Write mode and switches modes', async () => {
    await renderWithNotes();
    expect(screen.getByRole('radio', { name: 'Write' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Read' }));
    expect(screen.getByRole('main')).toHaveAttribute('data-mode', 'read');
  });

  it('follows the system theme and saves an explicit choice', async () => {
    setMediaMatches(['(prefers-color-scheme: dark)']);
    await renderWithNotes();
    expect(document.documentElement.dataset.theme).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('uses a saved theme over the system preference', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    await renderWithNotes();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('Notes', () => {
  it('seeds the welcome note and shows it selected', async () => {
    await renderWithNotes();
    const item = within(sidebar()).getByRole('button', { name: /^Welcome to Hash Mark/ });
    expect(item).toHaveAttribute('aria-current', 'true');
    expect(item).toHaveTextContent('Edited just now');
    expect(screen.getByRole('main')).toHaveTextContent('# Welcome to Hash Mark');
  });

  it('creates a new note at the top and selects it', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'New note' }));
    const items = await within(sidebar()).findAllByRole('button', { current: true });
    expect(items[0]).toHaveTextContent('Untitled');
    const titles = within(sidebar())
      .getAllByRole('listitem')
      .map((li) => li.querySelector('.note-list__title')?.textContent);
    expect(titles).toEqual(['Untitled', 'Welcome to Hash Mark']);
    expect(screen.getByRole('main')).toHaveTextContent('Type / for blocks, or just start writing');
  });

  it('selects a note and remembers the selection', async () => {
    await createNote(db, '# Groceries\n\n- milk', Date.now() - 60_000);
    await renderWithNotes();
    await userEvent.click(within(sidebar()).getByRole('button', { name: /^Groceries/ }));
    expect(screen.getByRole('main')).toHaveTextContent('- milk');
    await waitFor(() => expect(localStorage.getItem('hash-mark:selected-note')).not.toBeNull());
  });

  it('searches titles and content', async () => {
    await createNote(db, '# Groceries\n\n- oat milk');
    await renderWithNotes();
    const search = within(sidebar()).getByRole('searchbox', { name: 'Search notes' });

    await userEvent.type(search, 'oat');
    expect(within(sidebar()).getAllByRole('listitem')).toHaveLength(1);
    expect(within(sidebar()).getByText('Groceries')).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(within(sidebar()).getByText('No notes match “zzz”')).toBeInTheDocument();
  });

  it('asks before deleting and keeps the note on cancel', async () => {
    await renderWithNotes();
    await userEvent.click(
      within(sidebar()).getByRole('button', { name: 'Delete note “Welcome to Hash Mark”' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Delete “Welcome to Hash Mark”?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await db.notes.count()).toBe(1);
  });

  it('deletes after confirming and selects the next note', async () => {
    await createNote(db, '# Older note', Date.now() - 60_000);
    await renderWithNotes();
    await userEvent.click(
      within(sidebar()).getByRole('button', { name: 'Delete note “Welcome to Hash Mark”' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete note' }));

    await waitFor(() =>
      expect(within(sidebar()).queryByText('Welcome to Hash Mark')).not.toBeInTheDocument(),
    );
    const next = within(sidebar()).getByRole('button', { name: /^Older note/ });
    expect(next).toHaveAttribute('aria-current', 'true');
    await waitFor(() => expect(next).toHaveFocus());
  });

  it('shows empty states when the last note is deleted', async () => {
    await renderWithNotes();
    await userEvent.click(
      within(sidebar()).getByRole('button', { name: 'Delete note “Welcome to Hash Mark”' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(await within(sidebar()).findByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Create a note to start writing');
  });
});

describe('Editing', () => {
  it('autosaves edits and updates the title', async () => {
    await renderWithNotes();
    replaceDoc('# Shopping list\n\n- milk');
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');

    expect(
      await within(sidebar()).findByRole('button', { name: /^Shopping list/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    const stored = await db.notes.toArray();
    expect(stored.map((note) => note.markdown)).toEqual(['# Shopping list\n\n- milk']);
  });

  it('focuses the editor for a new note', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'New note' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus());
  });

  it('shows unsaved edits in Read mode straight away', async () => {
    await renderWithNotes();
    replaceDoc('Fresh words');
    await userEvent.click(screen.getByRole('radio', { name: 'Read' }));
    expect(screen.getByRole('main')).toHaveTextContent('Fresh words');
  });

  it('keeps edits when switching notes before the save fires', async () => {
    await createNote(db, '# Other', Date.now() - 60_000);
    await renderWithNotes();
    replaceDoc('# Welcome edited');
    await userEvent.click(within(sidebar()).getByRole('button', { name: /^Other/ }));
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveTextContent('# Other');

    await waitFor(async () =>
      expect((await db.notes.toArray()).map((note) => note.title).sort()).toEqual([
        'Other',
        'Welcome edited',
      ]),
    );
  });
});

describe('under 1000px', () => {
  beforeEach(() => setMediaMatches([NARROW_QUERY]));

  it('hides Split and collapses the sidebar into a drawer', async () => {
    render(<App />);
    expect(screen.queryByRole('radio', { name: 'Split' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Notes' })).not.toBeInTheDocument();

    const notesButton = screen.getByRole('button', { name: 'Notes' });
    await userEvent.click(notesButton);
    expect(notesButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(sidebar()).getByRole('searchbox')).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('complementary', { name: 'Notes' })).not.toBeInTheDocument();
    expect(notesButton).toHaveFocus();
  });
});
