import { lazy, Suspense } from 'react';
import type { Mode } from '../editor/mode';
import type { Note } from '../notes/db';

// CodeMirror (with the HTML/CSS/JS grammars lang-markdown embeds) is loaded on demand.
const MarkdownEditor = lazy(() =>
  import('../editor/MarkdownEditor').then((module) => ({ default: module.MarkdownEditor })),
);
// The unified pipeline is loaded on demand too; Write mode never needs it.
const ReadView = lazy(() =>
  import('../read/ReadView').then((module) => ({ default: module.ReadView })),
);

export type EditorPaneProps = {
  mode: Mode;
  note: Note | undefined;
  /** Live text of the note, including edits not yet saved. */
  markdown: string;
  onChange: (noteId: string, markdown: string) => void;
  autoFocus: boolean;
  /** Files are being dragged over the window. */
  dragging?: boolean;
};

export function EditorPane({
  mode,
  note,
  markdown,
  onChange,
  autoFocus,
  dragging = false,
}: EditorPaneProps) {
  const className = `pane editor-pane${dragging ? ' is-dragging' : ''}`;
  if (note === undefined) {
    return (
      <main className={className} aria-label="Document">
        <div className="doc">
          <p className="doc__placeholder">Create a note to start writing</p>
        </div>
      </main>
    );
  }

  const editor = (
    <Suspense fallback={<div className="editor-host" aria-busy="true" />}>
      <MarkdownEditor
        noteId={note.id}
        initialDoc={note.markdown}
        onChange={onChange}
        autoFocus={autoFocus}
      />
    </Suspense>
  );

  return (
    <main className={className} data-mode={mode} aria-label="Document">
      {mode === 'write' && editor}
      {mode === 'split' && (
        <div className="split">
          <div className="split__col split__col--editor">{editor}</div>
          <div className="split__col">
            <Preview markdown={markdown} />
          </div>
        </div>
      )}
      {mode === 'read' && <Preview markdown={markdown} />}
    </main>
  );
}

function Preview({ markdown }: { markdown: string }) {
  return (
    <Suspense fallback={<div className="doc" aria-busy="true" />}>
      <ReadView markdown={markdown} />
    </Suspense>
  );
}
