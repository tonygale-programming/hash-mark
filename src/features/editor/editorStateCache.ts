import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

/**
 * Editor states by note id, so switching notes or modes keeps each note's cursor
 * and undo history for the session. Kept apart from the editor (type-only imports)
 * so the app shell can use it without pulling CodeMirror into the main bundle.
 */
export const editorStateCache = new Map<string, EditorState>();

export function forgetEditorState(noteId: string) {
  editorStateCache.delete(noteId);
}

/** The mounted editor and the note it shows (Write and Split modes). */
let activeEditor: { noteId: string; view: EditorView } | null = null;

export function setActiveEditor(noteId: string, view: EditorView) {
  activeEditor = { noteId, view };
}

export function clearActiveEditor(view: EditorView) {
  if (activeEditor?.view === view) activeEditor = null;
}

/**
 * Replaces a note's whole text as one undoable edit (Mod+Z brings the old text back), as Curly
 * Brace's Sample and Clear do. Returns true when the open editor took it (and so reported the change
 * itself); otherwise the cached editor state is updated, if any, and the caller saves the text.
 */
export function replaceDocument(noteId: string, text: string): boolean {
  if (activeEditor?.noteId === noteId) {
    const { view } = activeEditor;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
      selection: { anchor: 0 },
      scrollIntoView: true,
      userEvent: 'input.replace',
    });
    return true;
  }
  const cached = editorStateCache.get(noteId);
  if (cached) {
    editorStateCache.set(
      noteId,
      cached.update({
        changes: { from: 0, to: cached.doc.length, insert: text },
        selection: { anchor: 0 },
        userEvent: 'input.replace',
      }).state,
    );
  }
  return false;
}

export function focusEditor(noteId: string) {
  if (activeEditor?.noteId === noteId) activeEditor.view.focus();
}
