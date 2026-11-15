import { EditorView } from '@codemirror/view';

/** Document typography from design tokens; colors follow the active theme through CSS variables. */
export const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--text)',
    backgroundColor: 'transparent',
    font: 'var(--doc-body)',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    padding: 'var(--editor-pad-block) var(--editor-pad-inline)',
  },
  '.cm-content': {
    width: '100%',
    maxWidth: 'var(--doc-width)',
    margin: '0 auto',
    padding: '0',
    caretColor: 'var(--text)',
  },
  '.cm-line': { padding: '0' },
  '.cm-cursor, .cm-dropCursor': { borderLeft: '2px solid var(--text)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'var(--accent-soft)' },
  '.cm-placeholder': { color: 'var(--text-faint)' },

  '.cm-md-h1': { font: 'var(--doc-h1)', paddingBottom: '8px' },
  '.cm-md-h2': { font: 'var(--doc-h2)', paddingTop: '16px', paddingBottom: '4px' },
  '.cm-md-h3': { font: 'var(--doc-h3)', paddingTop: '12px' },
  '.cm-md-h4': { fontWeight: '600' },
  '.cm-md-strong': { fontWeight: '600' },
  '.cm-md-em': { fontStyle: 'italic' },
  '.cm-md-strike': { textDecoration: 'line-through' },
  '.cm-md-link': { textDecoration: 'underline', textUnderlineOffset: '3px' },
  '.cm-md-url': { color: 'var(--text-muted)', textDecoration: 'none' },
  '.cm-md-code': {
    font: 'var(--doc-code)',
    padding: '1px 4px',
    borderRadius: 'var(--radius-small)',
    backgroundColor: 'var(--surface-sunken)',
  },
  '.cm-md-mark': {
    color: 'var(--text-faint)',
    fontFamily: 'var(--font-code)',
    fontWeight: '400',
    fontStyle: 'normal',
    textDecoration: 'none',
  },
  '.cm-md-quote': {
    color: 'var(--text-muted)',
    borderLeft: '3px solid var(--border-subtle)',
    paddingLeft: '16px',
  },
  '.cm-md-table': { font: 'var(--doc-code)' },
  '.cm-md-codeblock': {
    font: 'var(--doc-code)',
    padding: '0 16px',
    backgroundColor: 'var(--surface-sunken)',
  },
  '.cm-md-codeblock .cm-md-code': { padding: '0', backgroundColor: 'transparent' },
  '.cm-md-codeblock-first': {
    paddingTop: '8px',
    borderTopLeftRadius: 'var(--radius-card)',
    borderTopRightRadius: 'var(--radius-card)',
  },
  '.cm-md-codeblock-last': {
    paddingBottom: '8px',
    borderBottomLeftRadius: 'var(--radius-card)',
    borderBottomRightRadius: 'var(--radius-card)',
  },
});
