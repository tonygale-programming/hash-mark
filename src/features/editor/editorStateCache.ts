import type { EditorState } from '@codemirror/state';

/**
 * Editor states by note id, so switching notes or modes keeps each note's cursor
 * and undo history for the session. Kept apart from the editor so callers don't
 * pull CodeMirror into the main bundle.
 */
export const editorStateCache = new Map<string, EditorState>();

export function forgetEditorState(noteId: string) {
  editorStateCache.delete(noteId);
}
