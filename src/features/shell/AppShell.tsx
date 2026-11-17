import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { readString, writeString } from '../../lib/storage';
import { NARROW_QUERY, useMediaQuery } from '../../lib/useMediaQuery';
import { ConfirmDialog, Toast, useToast } from '../../ui';
import { focusEditor, forgetEditorState, replaceDocument } from '../editor/editorStateCache';
import { appCommand } from '../../commands/appCommands';
import type { AppCommandContext } from '../../commands/types';
import { effectiveMode, nextMode, type Mode } from '../editor/mode';
import {
  ACCEPT,
  downloadMarkdown,
  markdownFileName,
  openSummary,
  readMarkdownFile,
} from '../files/markdownFiles';
import { useFileDrop } from '../files/useFileDrop';
import { db, type Note } from '../notes/db';
import { createNote, deleteNote, neighborId } from '../notes/notesStore';
import sampleMarkdown from '../notes/sample.md?raw';
import { useAutosave } from '../notes/useAutosave';
import { documentStats } from '../notes/stats';
import { deriveTitle } from '../notes/title';
import { useNotes } from '../notes/useNotes';
import { useTheme } from '../theme/useTheme';
import { EditorPane } from './EditorPane';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';
import { useAppShortcuts } from './useAppShortcuts';
import { useDrawer } from './useDrawer';
import './shell.css';

const SELECTED_NOTE_KEY = 'hash-mark:selected-note';

// The dialog lists the editor's commands, so it loads with them on first open.
const ShortcutsDialog = lazy(() =>
  import('../shortcuts/ShortcutsDialog').then((module) => ({ default: module.ShortcutsDialog })),
);

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const narrow = useMediaQuery(NARROW_QUERY);
  const notes = useNotes();
  const { status: saveStatus, saver } = useAutosave();
  const { toast, show: showToast } = useToast();

  const [mode, setMode] = useState<Mode>('write');
  const [showSyntax, setShowSyntax] = useState(false);
  const [selectedId, setSelectedId] = useState(() => readString(SELECTED_NOTE_KEY) ?? undefined);
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  /** Mount the shortcuts dialog after its first open, then keep it so focus returns properly. */
  const [shortcutsUsed, setShortcutsUsed] = useState(false);
  /** Latest editor text, ahead of IndexedDB while a save is pending. */
  const [draft, setDraft] = useState<{ id: string; markdown: string } | null>(null);
  /** Note whose editor should take focus (a freshly created note). */
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** After a delete, move focus to a note (or search) once the deleted note has left the list. */
  const afterDelete = useRef<{ deletedId: string; focusId: string | undefined } | null>(null);

  const shownMode = effectiveMode(mode, narrow);
  // A missing or stale selection falls back to the most recently edited note.
  const note = notes?.find((n) => n.id === selectedId) ?? notes?.[0];
  const markdown = note && draft?.id === note.id ? draft.markdown : (note?.markdown ?? '');
  // Deferred so counting never delays typing on long notes.
  const deferredMarkdown = useDeferredValue(markdown);
  const stats = useMemo(() => documentStats(deferredMarkdown), [deferredMarkdown]);
  const drawer = useDrawer(narrow, searchRef);

  useEffect(() => {
    if (notes) writeString(SELECTED_NOTE_KEY, note?.id ?? null);
  }, [notes, note?.id]);

  useEffect(() => {
    const pending = afterDelete.current;
    if (!pending || !notes || notes.some((n) => n.id === pending.deletedId)) return;
    afterDelete.current = null;
    // Here, not in the delete handler: the editor parks the note's state when it switches away.
    forgetEditorState(pending.deletedId);
    const item = pending.focusId
      ? document.querySelector<HTMLElement>(`[data-note-id="${CSS.escape(pending.focusId)}"]`)
      : null;
    (item ?? searchRef.current)?.focus();
  }, [notes]);

  useAppShortcuts((command) => command.run(appContext()));

  function handleChange(id: string, text: string) {
    setDraft({ id, markdown: text });
    saver.change(id, text);
  }

  /** A note picked in the list: the search stays, so the next result is one click away. */
  function selectNote(id: string) {
    void saver.flush();
    setSelectedId(id);
    setFocusNoteId(null);
  }

  /** A note the app just made or opened: clear the search so it is listed, close the drawer. */
  function showNote(id: string, { focus = false } = {}) {
    setSelectedId(id);
    setFocusNoteId(focus ? id : null);
    setQuery('');
    drawer.hide();
  }

  async function handleNewNote() {
    await saver.flush();
    const created = await createNote(db);
    showNote(created.id, { focus: true });
  }

  async function openFiles(files: File[]) {
    const results = await Promise.all(files.map(readMarkdownFile));
    const opened = results.filter((result) => result.ok);
    await saver.flush();
    const now = Date.now();
    let last: Note | undefined;
    // Later files get later times, so the last one opened ends up on top and selected.
    for (const [index, result] of opened.entries()) {
      last = await createNote(db, result.text, now + index);
    }
    if (last) showNote(last.id);
    const failed = results.length - opened.length;
    showToast(
      openSummary(results, opened.length === 1 ? last?.title : undefined),
      failed ? 'danger' : 'default',
    );
  }

  const dragging = useFileDrop((files) => void openFiles(files));

  function handleDownload() {
    if (!note) return;
    // Title from the live text: the stored title lags while a save is pending.
    downloadMarkdown(markdownFileName(deriveTitle(markdown)), markdown);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      showToast('Copied Markdown');
    } catch {
      showToast('Couldn’t copy. Select the text and copy it manually.', 'danger');
    }
  }

  /** Replaces the note's text as one undoable edit, and saves it. */
  function replaceNoteText(id: string, text: string) {
    // The open editor reports its own change; otherwise save it here.
    if (!replaceDocument(id, text)) handleChange(id, text);
  }

  /**
   * Sample (as in Curly Brace): an empty note gets the sample; a note with text keeps it and the
   * sample opens as a new note, so one click never overwrites writing.
   */
  async function loadSample() {
    if (note && !markdown.trim()) {
      replaceNoteText(note.id, sampleMarkdown);
      showToast('Sample loaded');
      return;
    }
    await saver.flush();
    const created = await createNote(db, sampleMarkdown);
    showNote(created.id);
    showToast('Sample opened as a new note');
  }

  /** Clear (as in Curly Brace): empties the note; Mod+Z brings the text back. */
  function clearNote() {
    if (!note || !markdown.trim()) return;
    replaceNoteText(note.id, '');
    showToast('Cleared');
    focusEditor(note.id);
  }

  function appContext(): AppCommandContext {
    return {
      newNote: () => void handleNewNote(),
      cycleMode: () => setMode((current) => nextMode(current, narrow)),
      toggleShowSyntax: () => setShowSyntax((on) => !on),
      loadSample: () => void loadSample(),
      clearNote,
      openFile: () => fileInputRef.current?.click(),
      download: handleDownload,
      copy: () => void handleCopy(),
      showShortcuts: () => {
        setShortcutsUsed(true);
        setShortcutsOpen(true);
      },
    };
  }

  /** Every button that has a registry command runs it here, as its shortcut would. */
  function runCommand(id: string) {
    appCommand(id).run(appContext());
  }

  async function handleConfirmDelete() {
    if (!pendingDelete || !notes) return;
    const { id } = pendingDelete;
    const wasSelected = note?.id === id;
    const focusId = wasSelected ? neighborId(notes, id) : note?.id;
    if (wasSelected) setSelectedId(focusId);
    saver.cancel(id);
    afterDelete.current = { deletedId: id, focusId };
    setPendingDelete(null);
    await deleteNote(db, id);
  }

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowShortcuts={() => runCommand('app.showShortcuts')}
      />
      <Toolbar
        mode={shownMode}
        onModeChange={setMode}
        showSyntax={showSyntax}
        onShowSyntaxChange={setShowSyntax}
        narrow={narrow}
        drawerOpen={drawer.visible}
        onOpenDrawer={drawer.show}
        drawerButtonRef={drawer.buttonRef}
        onCommand={runCommand}
        canClear={note !== undefined && markdown.trim() !== ''}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        aria-label="Open Markdown files"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = ''; // allow opening the same file again
          if (files.length) void openFiles(files);
        }}
      />
      <div className="main">
        <Sidebar
          notes={notes}
          selectedId={note?.id}
          onSelect={(id) => {
            selectNote(id);
            if (drawer.visible) drawer.close();
          }}
          onRequestDelete={setPendingDelete}
          query={query}
          onQueryChange={setQuery}
          drawer={narrow}
          open={drawer.open}
          onClose={drawer.close}
          searchRef={searchRef}
        />
        {drawer.visible && <div className="scrim" aria-hidden="true" onClick={drawer.close} />}
        <EditorPane
          mode={shownMode}
          note={notes ? note : undefined}
          markdown={markdown}
          onChange={handleChange}
          autoFocus={note !== undefined && focusNoteId === note.id}
          dragging={dragging}
        />
      </div>
      <StatusBar
        saveStatus={note ? saveStatus : undefined}
        stats={note ? stats : undefined}
        onCommand={note ? runCommand : undefined}
      />
      <Toast toast={toast} />
      {shortcutsUsed && (
        <Suspense fallback={null}>
          <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        </Suspense>
      )}

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
