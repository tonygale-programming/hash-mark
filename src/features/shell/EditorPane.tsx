import type { Mode } from '../editor/mode';
import type { Note } from '../notes/db';

/**
 * Placeholder until the CodeMirror editor and Read rendering (rest of M1):
 * shows the note's Markdown source in the document column.
 */
export function EditorPane({ mode, note }: { mode: Mode; note: Note | undefined }) {
  return (
    <main className="pane editor-pane" data-mode={mode} aria-label="Document">
      {note === undefined ? (
        <div className="doc">
          <p className="doc__placeholder">Create a note to start writing</p>
        </div>
      ) : mode === 'split' ? (
        <div className="split">
          <div className="split__col">
            <Source note={note} />
          </div>
          <div className="split__col">
            <Source note={note} />
          </div>
        </div>
      ) : (
        <Source note={note} />
      )}
    </main>
  );
}

function Source({ note }: { note: Note }) {
  return note.markdown ? (
    <pre className="doc doc--source">{note.markdown}</pre>
  ) : (
    <div className="doc">
      <p className="doc__placeholder">Type / for blocks, or just start writing</p>
    </div>
  );
}
