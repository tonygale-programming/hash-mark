import { useEffect, useLayoutEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { editorStateCache as stateCache } from './editorStateCache';
import { editorExtensions } from './extensions';
import './MarkdownEditor.css';

const extensions = editorExtensions();

function stateFor(noteId: string, doc: string) {
  return stateCache.get(noteId) ?? EditorState.create({ doc, extensions });
}

export type MarkdownEditorProps = {
  noteId: string;
  /** Used only when this note has no cached editor state yet. */
  initialDoc: string;
  onChange: (noteId: string, markdown: string) => void;
  autoFocus?: boolean;
};

export function MarkdownEditor({ noteId, initialDoc, onChange, autoFocus }: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const idRef = useRef(noteId);
  const initialDocRef = useRef(initialDoc);
  const onChangeRef = useRef(onChange);

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  // Create the view once; it lives as long as this component.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const view = new EditorView({
      parent: host,
      state: stateFor(idRef.current, initialDocRef.current),
      dispatchTransactions(transactions, view) {
        view.update(transactions);
        if (transactions.some((tr) => tr.docChanged)) {
          onChangeRef.current(idRef.current, view.state.doc.toString());
        }
      },
    });
    viewRef.current = view;
    return () => {
      stateCache.set(idRef.current, view.state);
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Another note selected: park the current state and load the next one.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || idRef.current === noteId) return;
    stateCache.set(idRef.current, view.state);
    idRef.current = noteId;
    view.setState(stateFor(noteId, initialDoc));
  }, [noteId, initialDoc]);

  useEffect(() => {
    if (autoFocus) viewRef.current?.focus();
  }, [noteId, autoFocus]);

  return <div ref={hostRef} className="editor-host" />;
}
