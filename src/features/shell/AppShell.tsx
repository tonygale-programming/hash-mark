import {
  lazy,
  Suspense,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { readString, writeString } from '../../lib/storage';
import { NARROW_QUERY, useMediaQuery } from '../../lib/useMediaQuery';
import { ConfirmDialog, Toast, useToast } from '../../ui';
import { focusEditor, forgetEditorState, replaceDocument } from '../editor/editorStateCache';
import { APP_COMMANDS, appCommand } from '../../commands/appCommands';
import { appCommandFor } from '../../commands/keymap';
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
import './shell.css';

const SELECTED_NOTE_KEY = 'hash-mark:selected-note';

// The dialog lists the editor's commands, so it loads with them on first open.
const ShortcutsDialog = lazy(() =>
  import('../shortcuts/ShortcutsDialog').then((module) => ({ default: module.ShortcutsDialog })),
);

/** The editor, a field or anything editable: single-key shortcuts such as "?" must not fire there. */
function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !==
      null
  );
}

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  /** Mount the shortcuts dialog after its first open, then keep it so focus returns properly. */
  const [shortcutsUsed, setShortcutsUsed] = useState(false);
  /** Latest editor text, ahead of IndexedDB while a save is pending. */
  const [draft, setDraft] = useState<{ id: string; markdown: string } | null>(null);
  /** Note whose editor should take focus (a freshly created note). */
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);

  const drawerButtonRef = useRef<HTMLButtonElement>(null);
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
  const drawer = narrow;
  const drawerVisible = drawer && drawerOpen;

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

  // App-level shortcuts from the registry (Mod+/ Show syntax, Mod+Shift+M cycle mode), anywhere on
  // the page. The editor handles its own; a dialog keeps its keys.
  const onAppShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || document.querySelector('dialog[open]')) {
      return;
    }
    const command = appCommandFor(event, APP_COMMANDS);
    if (!command) return;
    if (command.notWhileTyping && isTypingTarget(event.target)) return;
    event.preventDefault();
    command.run(appContext());
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => onAppShortcut(event);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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

  function handleChange(id: string, text: string) {
    setDraft({ id, markdown: text });
    saver.change(id, text);
  }

  function selectNote(id: string) {
    void saver.flush();
    setSelectedId(id);
    setFocusNoteId(null);
  }

  async function handleNewNote() {
    await saver.flush();
    const created = await createNote(db);
    setSelectedId(created.id);
    setFocusNoteId(created.id);
    setQuery('');
    if (drawer) setDrawerOpen(false);
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
    if (last) {
      setSelectedId(last.id);
      setFocusNoteId(null);
      setQuery('');
      if (drawer) setDrawerOpen(false);
    }
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
    setSelectedId(created.id);
    setFocusNoteId(null);
    setQuery('');
    if (drawer) setDrawerOpen(false);
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
      cycleMode: () => setMode((current) => nextMode(current, narrow)),
      toggleShowSyntax: () => setShowSyntax((on) => !on),
      loadSample: () => void loadSample(),
      clearNote,
      openFile: () => fileInputRef.current?.click(),
      download: handleDownload,
      showShortcuts: () => {
        setShortcutsUsed(true);
        setShortcutsOpen(true);
      },
    };
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
        onShowShortcuts={() => appCommand('app.showShortcuts').run(appContext())}
      />
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
        onOpenFile={() => fileInputRef.current?.click()}
        onSample={() => appCommand('app.sample').run(appContext())}
        onClear={() => appCommand('app.clear').run(appContext())}
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
        onDownload={note ? handleDownload : undefined}
        onCopy={note ? () => void handleCopy() : undefined}
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
