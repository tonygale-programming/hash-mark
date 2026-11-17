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
  // Snippet placeholders (table cells, image alt/url): Tab moves between them.
  '.cm-snippetField': { backgroundColor: 'var(--accent-soft)', borderRadius: '2px' },

  // Slash menu (docs/editor-ux-spec.md §3), in the Brace style: surface, 1.5px ink outline, no shadow.
  '.cm-tooltip.cm-tooltip-autocomplete.slash-menu': {
    display: 'flex',
    flexDirection: 'column',
    width: '300px',
    maxWidth: 'calc(100vw - 32px)',
    border: 'var(--border-width) solid var(--border)',
    borderRadius: 'var(--radius-pane)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    overflow: 'hidden',
    font: 'var(--type-body)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete.slash-menu > ul': {
    fontFamily: 'var(--font-ui)',
    minWidth: '0',
    maxWidth: 'none',
    maxHeight: 'min(360px, 50vh)',
    padding: 'var(--space-4)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete.slash-menu > ul > li.slash-menu__option': {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-12)',
    minHeight: '40px',
    padding: 'var(--space-4) var(--space-8)',
    borderRadius: 'var(--radius-card)',
    lineHeight: '20px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete.slash-menu > ul > li.slash-menu__option:hover': {
    backgroundColor: 'var(--surface-hover)',
  },
  // Selected: accent fill + inset ink outline, as the segmented control.
  '.cm-tooltip.cm-tooltip-autocomplete.slash-menu > ul > li.slash-menu__option[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-text)',
    boxShadow: 'inset 0 0 0 var(--border-width) var(--border)',
  },
  '.slash-menu__tile': {
    display: 'inline-flex',
    flex: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: 'var(--border-width) solid var(--border-subtle)',
    borderRadius: 'var(--radius-small)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  },
  '.slash-menu__option[aria-selected] .slash-menu__tile': { borderColor: 'var(--border)' },
  '.slash-menu .cm-completionLabel': { flex: '1', minWidth: '0', font: 'var(--type-label)' },
  '.slash-menu .cm-completionMatchedText': { textDecoration: 'none', fontWeight: '600' },
  '.slash-menu .cm-completionDetail': {
    marginLeft: 'auto',
    fontStyle: 'normal',
    font: 'var(--type-kbd)',
    color: 'var(--text-faint)',
  },
  '.slash-menu__option[aria-selected] .cm-completionDetail': { color: 'var(--accent-text)' },
  '.slash-menu__footer': {
    order: '1',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-12)',
    padding: 'var(--space-8) var(--space-12)',
    borderTop: 'var(--border-width) solid var(--border-subtle)',
    font: 'var(--type-hint)',
    color: 'var(--text-muted)',
  },
  '.slash-menu__footer > span': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },

  '.cm-md-codeblock-last': {
    paddingBottom: '8px',
    borderBottomLeftRadius: 'var(--radius-card)',
    borderBottomRightRadius: 'var(--radius-card)',
  },
});
