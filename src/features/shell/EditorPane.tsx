import type { Mode } from '../editor/mode';
import type { NoteSummary } from '../notes/sampleNotes';

/** Placeholder until the CodeMirror editor (M1). Shows the document column and layout per mode. */
export function EditorPane({ mode, note }: { mode: Mode; note: NoteSummary | undefined }) {
  const title = note?.title ?? 'Untitled';
  return (
    <main className="pane editor-pane" data-mode={mode} aria-label="Document">
      {mode === 'split' ? (
        <div className="split">
          <div className="split__col">
            <pre className="doc doc--source"># {title}</pre>
          </div>
          <div className="split__col">
            <article className="doc">
              <h1>{title}</h1>
            </article>
          </div>
        </div>
      ) : (
        <article className="doc">
          <h1>{title}</h1>
          {mode === 'write' && (
            <p className="doc__placeholder">Type / for blocks, or just start writing</p>
          )}
        </article>
      )}
    </main>
  );
}
