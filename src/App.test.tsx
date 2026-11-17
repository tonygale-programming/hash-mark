import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { undo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { editorStateCache } from './features/editor/editorStateCache';
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
    // Not built yet (M3): shown, but off rather than silently doing nothing.
    expect(screen.getByRole('button', { name: 'Share link' })).toBeDisabled();
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
    // No saved choice: no data-theme, the CSS follows the system; the button reflects it.
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();

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
    const welcomeId = (await db.notes.toArray()).find((n) => n.title.startsWith('Welcome'))!.id;
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
    // The deleted note's editor state (text and undo history) is not kept.
    expect(editorStateCache.has(welcomeId)).toBe(false);
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
    expect(await within(screen.getByRole('main')).findByText('Fresh words')).toBeInTheDocument();
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

describe('Read mode', () => {
  it('renders the note as a document', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('radio', { name: 'Read' }));
    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { level: 1, name: 'Welcome to Hash Mark' }),
    ).toBeInTheDocument();
    expect(within(main).getByRole('table')).toBeInTheDocument();
    expect(within(main).getAllByRole('checkbox')).toHaveLength(2);
    expect(within(main).queryByRole('textbox')).not.toBeInTheDocument();
    expect(main).not.toHaveTextContent('# Welcome');
  });

  it('shows the editor and the rendered preview side by side in Split', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('radio', { name: 'Split' }));
    const main = screen.getByRole('main');
    expect(await within(main).findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(within(main).getByRole('textbox', { name: 'Note' })).toBeInTheDocument();

    replaceDoc('## Live preview');
    expect(
      await within(main).findByRole('heading', { level: 2, name: 'Live preview' }),
    ).toBeInTheDocument();
  });
});

describe('Status bar stats', () => {
  function statusBar() {
    return screen.getByRole('contentinfo', { name: 'Document status' });
  }

  it('shows words, reading time and headings for the note', async () => {
    await renderWithNotes();
    // Stats come from a deferred copy of the text, so they can trail the first render.
    await waitFor(() => expect(statusBar()).toHaveTextContent('80 words'));
    expect(statusBar()).toHaveTextContent('1 min read');
    expect(statusBar()).toHaveTextContent('Headings 4');
  });

  it('updates live as the note changes, before it is saved', async () => {
    await renderWithNotes();
    replaceDoc('# Hello\n\nJust one');
    await waitFor(() => expect(statusBar()).toHaveTextContent('3 words'));
    expect(statusBar()).toHaveTextContent('Headings 1');

    replaceDoc('Solo');
    await waitFor(() => expect(statusBar()).toHaveTextContent('1 word1 min read'));
  });

  it('keeps the counts out of the live region', async () => {
    await renderWithNotes();
    expect(screen.getByRole('status')).toHaveTextContent(/^Saved$/);
  });

  it('hides stats when there is no note', async () => {
    await db.notes.clear();
    render(<App />);
    expect(
      await within(screen.getByRole('complementary')).findByText('No notes yet'),
    ).toBeVisible();
    expect(statusBar()).not.toHaveTextContent('words');
  });
});

describe('Shortcuts', () => {
  it('cycles modes with Mod+Shift+M from anywhere', async () => {
    await renderWithNotes();
    const main = screen.getByRole('main');
    fireEvent.keyDown(window, { key: 'M', code: 'KeyM', ctrlKey: true, shiftKey: true });
    expect(main).toHaveAttribute('data-mode', 'split');
    fireEvent.keyDown(window, { key: 'M', code: 'KeyM', ctrlKey: true, shiftKey: true });
    expect(main).toHaveAttribute('data-mode', 'read');
    fireEvent.keyDown(window, { key: 'M', code: 'KeyM', ctrlKey: true, shiftKey: true });
    expect(main).toHaveAttribute('data-mode', 'write');
  });

  it('toggles Show syntax with Mod+/', async () => {
    await renderWithNotes();
    const toggle = screen.getByRole('button', { name: 'Show syntax' });
    fireEvent.keyDown(window, { key: '/', code: 'Slash', ctrlKey: true });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(window, { key: '/', code: 'Slash', ctrlKey: true });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('leaves app shortcuts alone while a dialog is open', async () => {
    await renderWithNotes();
    await userEvent.click(
      within(sidebar()).getByRole('button', { name: 'Delete note “Welcome to Hash Mark”' }),
    );
    fireEvent.keyDown(window, { key: 'M', code: 'KeyM', ctrlKey: true, shiftKey: true });
    expect(screen.getByRole('main')).toHaveAttribute('data-mode', 'write');
  });

  it('formats text in the editor with Mod+B', async () => {
    await renderWithNotes();
    replaceDoc('make this bold');
    const view = editorView();
    act(() => view.dispatch({ selection: { anchor: 10, head: 14 } }));
    fireEvent.keyDown(view.contentDOM, { key: 'b', code: 'KeyB', keyCode: 66, ctrlKey: true });
    expect(view.state.doc.toString()).toBe('make this **bold**');
  });
});

describe('Shortcuts dialog', () => {
  it('opens from the header and lists the shortcuts by group', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'Shortcuts' }));
    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
    for (const group of ['Text', 'Blocks', 'Lists', 'Editing', 'Note', 'View']) {
      expect(within(dialog).getByRole('region', { name: group })).toBeInTheDocument();
    }
    const text = within(dialog).getByRole('region', { name: 'Text' });
    expect(within(text).getByText('Bold')).toBeInTheDocument();
    expect(within(text).getByRole('img', { name: 'Ctrl+B' })).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with "?" outside the editor, but not while typing', async () => {
    await renderWithNotes();
    fireEvent.keyDown(editorView().contentDOM, { key: '?', code: 'Slash', shiftKey: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: '?', code: 'Slash', shiftKey: true });
    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });

    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a file with Mod+O and downloads with Mod+S', async () => {
    Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download);
    });
    await renderWithNotes();
    const input = screen.getByLabelText<HTMLInputElement>('Open Markdown files');
    const pick = vi.spyOn(input, 'click').mockImplementation(() => {});

    fireEvent.keyDown(window, { key: 'o', code: 'KeyO', ctrlKey: true });
    expect(pick).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 's', code: 'KeyS', ctrlKey: true });
    expect(downloads).toEqual(['Welcome to Hash Mark.md']);
    click.mockRestore();
  });
});

describe('Sample and Clear', () => {
  function titles() {
    return within(sidebar())
      .getAllByRole('listitem')
      .map((li) => li.querySelector('.note-list__title')?.textContent);
  }

  it('puts the sample into an empty note', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'New note' }));
    await screen.findByRole('button', { name: /^Untitled/, current: true });
    await userEvent.click(screen.getByRole('button', { name: 'Sample' }));

    expect(await screen.findByText('Sample loaded')).toBeInTheDocument();
    expect(editorView().state.doc.toString()).toMatch(/^# Weekend in Lisbon/);
    await waitFor(() => expect(titles()).toEqual(['Weekend in Lisbon', 'Welcome to Hash Mark']));
  });

  it('opens the sample as a new note instead of replacing writing', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'Sample' }));

    expect(await screen.findByText('Sample opened as a new note')).toBeInTheDocument();
    await waitFor(() => expect(titles()).toEqual(['Weekend in Lisbon', 'Welcome to Hash Mark']));
    expect(within(sidebar()).getByRole('button', { name: /^Weekend in Lisbon/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    const welcome = (await db.notes.toArray()).find((n) => n.title === 'Welcome to Hash Mark');
    expect(welcome?.markdown).toMatch(/^# Welcome to Hash Mark/);
  });

  it('clears the note, and Mod+Z brings the text back', async () => {
    await renderWithNotes();
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear).toBeEnabled();
    await userEvent.click(clear);

    expect(await screen.findByText('Cleared')).toBeInTheDocument();
    expect(editorView().state.doc.toString()).toBe('');
    expect(clear).toBeDisabled();
    expect(editorView().hasFocus).toBe(true);

    act(() => void undo(editorView()));
    expect(editorView().state.doc.toString()).toMatch(/^# Welcome to Hash Mark/);
    expect(clear).toBeEnabled();
  });

  it('saves a cleared note', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(async () => expect((await db.notes.toArray())[0]?.markdown).toBe(''));
  });

  it('shows the cleared text when switching to Write before the save', async () => {
    await createNote(db, '# Other note', Date.now() - 60_000);
    await renderWithNotes();
    await userEvent.click(screen.getByRole('radio', { name: 'Read' }));
    // Never opened in the editor, so it has no editor state yet.
    await userEvent.click(within(sidebar()).getByRole('button', { name: /^Other note/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Write' }));

    await screen.findByRole('textbox', { name: 'Note' });
    expect(editorView().state.doc.toString()).toBe('');
  });

  it('clears from Read mode too', async () => {
    await renderWithNotes();
    await userEvent.click(screen.getByRole('radio', { name: 'Read' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(
      await within(screen.getByRole('main')).findByText('Nothing to read yet'),
    ).toBeInTheDocument();
    await waitFor(async () => expect((await db.notes.toArray())[0]?.markdown).toBe(''));

    // The edit went into the note's editor history: back in Write, Mod+Z restores it.
    await userEvent.click(screen.getByRole('radio', { name: 'Write' }));
    const view = editorView();
    expect(view.state.doc.toString()).toBe('');
    act(() => void undo(view));
    expect(view.state.doc.toString()).toMatch(/^# Welcome to Hash Mark/);
  });
});

describe('Files', () => {
  function titles() {
    return within(sidebar())
      .getAllByRole('listitem')
      .map((li) => li.querySelector('.note-list__title')?.textContent);
  }

  it('opens the file picker from the toolbar', async () => {
    await renderWithNotes();
    const input = screen.getByLabelText<HTMLInputElement>('Open Markdown files');
    const click = vi.spyOn(input, 'click');
    await userEvent.click(screen.getByRole('button', { name: 'Open file' }));
    expect(click).toHaveBeenCalled();
    expect(input).toHaveAttribute('accept', expect.stringContaining('.md'));
  });

  it('opens picked files as new notes and selects the last one', async () => {
    await renderWithNotes();
    await userEvent.upload(screen.getByLabelText('Open Markdown files'), [
      new File(['# First file'], 'first.md', { type: 'text/markdown' }),
      new File(['# Second file\n\nBody'], 'second.md', { type: 'text/markdown' }),
    ]);

    await waitFor(() =>
      expect(titles()).toEqual(['Second file', 'First file', 'Welcome to Hash Mark']),
    );
    expect(within(sidebar()).getByRole('button', { name: /^Second file/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(await screen.findByText('Opened 2 files.')).toBeInTheDocument();
  });

  it('opens dropped files and skips ones that are not text', async () => {
    await renderWithNotes();
    const dataTransfer = {
      types: ['Files'],
      files: [
        new File(['# Dropped'], 'dropped.md', { type: 'text/markdown' }),
        new File(['x'], 'photo.png', { type: 'image/png' }),
      ],
    };
    fireEvent.dragEnter(window, { dataTransfer });
    expect(screen.getByRole('main')).toHaveClass('is-dragging');
    fireEvent.drop(window, { dataTransfer });

    expect(
      await screen.findByText(
        'Opened “Dropped”. Couldn’t open “photo.png”: not a Markdown or text file.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).not.toHaveClass('is-dragging');
    expect(titles()).toEqual(['Dropped', 'Welcome to Hash Mark']);
  });

  it('downloads the current note as a .md file', async () => {
    const create = vi.fn<(blob: Blob) => string>(() => 'blob:note');
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const downloads: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download);
    });

    await renderWithNotes();
    replaceDoc('# Trip: day 1\n\nUnsaved text');
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => expect(downloads).toEqual(['Trip- day 1.md']));
    expect(await create.mock.calls[0]![0].text()).toBe('# Trip: day 1\n\nUnsaved text');
    click.mockRestore();
  });

  it('copies the Markdown and confirms', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('# Welcome to Hash Mark'));
    expect(await screen.findByText('Copied Markdown')).toBeInTheDocument();
  });

  it('explains when copying fails', async () => {
    const writeText = vi.fn(async () => {
      throw new Error('denied');
    });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await renderWithNotes();
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(
      await screen.findByText('Couldn’t copy. Select the text and copy it manually.'),
    ).toBeInTheDocument();
  });

  it('disables Download and Copy without a note', async () => {
    await db.notes.clear();
    render(<App />);
    expect(
      await within(screen.getByRole('complementary')).findByText('No notes yet'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
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
