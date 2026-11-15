import { useEffect, useRef, useState } from 'react';
import { readString, writeString } from '../../lib/storage';
import { NARROW_QUERY, useMediaQuery } from '../../lib/useMediaQuery';
import { ConfirmDialog } from '../../ui';
import { effectiveMode, type Mode } from '../editor/mode';
import { db, type Note } from '../notes/db';
import { createNote, deleteNote, neighborId } from '../notes/notesStore';
import { useNotes } from '../notes/useNotes';
import { useTheme } from '../theme/useTheme';
import { EditorPane } from './EditorPane';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';
import './shell.css';

const SELECTED_NOTE_KEY = 'hash-mark:selected-note';

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const narrow = useMediaQuery(NARROW_QUERY);
  const notes = useNotes();

  const [mode, setMode] = useState<Mode>('write');
  const [showSyntax, setShowSyntax] = useState(false);
  const [selectedId, setSelectedId] = useState(() => readString(SELECTED_NOTE_KEY) ?? undefined);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const drawerButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  /** After a delete, move focus to a note (or search) once the deleted note has left the list. */
  const afterDelete = useRef<{ deletedId: string; focusId: string | undefined } | null>(null);

  const shownMode = effectiveMode(mode, narrow);
  // A missing or stale selection falls back to the most recently edited note.
  const note = notes?.find((n) => n.id === selectedId) ?? notes?.[0];
  const drawer = narrow;
  const drawerVisible = drawer && drawerOpen;

  useEffect(() => {
    if (notes) writeString(SELECTED_NOTE_KEY, note?.id ?? null);
  }, [notes, note?.id]);

  useEffect(() => {
    const pending = afterDelete.current;
    if (!pending || !notes || notes.some((n) => n.id === pending.deletedId)) return;
    afterDelete.current = null;
    const item = pending.focusId
      ? document.querySelector<HTMLElement>(`[data-note-id="${CSS.escape(pending.focusId)}"]`)
      : null;
    (item ?? searchRef.current)?.focus();
  }, [notes]);

  // Drawer: focus search on open, close on Esc and return focus to the Notes button.
  useEffect(() => {
    if (!drawerVisible) return;
    searchRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      // Esc inside an open dialog belongs to the dialog.
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) {
        setDrawerOpen(false);
        drawerButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerVisible]);

  function closeDrawer() {
    setDrawerOpen(false);
    drawerButtonRef.current?.focus();
  }

  async function handleNewNote() {
    const created = await createNote(db);
    setSelectedId(created.id);
    setQuery('');
    if (drawer) setDrawerOpen(false);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete || !notes) return;
    const { id } = pendingDelete;
    const wasSelected = note?.id === id;
    const focusId = wasSelected ? neighborId(notes, id) : note?.id;
    if (wasSelected) setSelectedId(focusId);
    afterDelete.current = { deletedId: id, focusId };
    setPendingDelete(null);
    await deleteNote(db, id);
  }

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <Toolbar
        mode={shownMode}
        onModeChange={setMode}
        showSyntax={showSyntax}
        onShowSyntaxChange={setShowSyntax}
        narrow={narrow}
        drawerOpen={drawerVisible}
        onOpenDrawer={() => setDrawerOpen(true)}
        drawerButtonRef={drawerButtonRef}
        onNewNote={() => void handleNewNote()}
      />
      <div className="main">
        <Sidebar
          notes={notes}
          selectedId={note?.id}
          onSelect={(id) => {
            setSelectedId(id);
            if (drawer) closeDrawer();
          }}
          onRequestDelete={setPendingDelete}
          query={query}
          onQueryChange={setQuery}
          drawer={drawer}
          open={drawerOpen}
          onClose={closeDrawer}
          searchRef={searchRef}
        />
        {drawerVisible && <div className="scrim" aria-hidden="true" onClick={closeDrawer} />}
        <EditorPane mode={shownMode} note={notes ? note : undefined} />
      </div>
      <StatusBar />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete “${pendingDelete?.title ?? ''}”?`}
        confirmLabel="Delete note"
        tone="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      >
        <p>This note is stored only in this browser. Deleting it can’t be undone.</p>
      </ConfirmDialog>
    </div>
  );
}
