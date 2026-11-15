import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import type { Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { editorTheme } from './editorTheme';
import { markdownStyles } from './markdownStyles';

/** Default bindings that clash with shortcuts the spec reserves (docs/editor-ux-spec.md §5). */
const RESERVED_KEYS = new Set(['Mod-/', 'Alt-A', 'Mod-i', 'Mod-Enter']);

export const EDITOR_PLACEHOLDER = 'Type / for blocks, or just start writing';

export function editorExtensions(): Extension[] {
  return [
    // GFM: tables, strikethrough, task lists, autolinks. Its keymap continues lists on Enter.
    markdown({ base: markdownLanguage }),
    history(),
    keymap.of([
      ...defaultKeymap.filter((b) => !b.key || !RESERVED_KEYS.has(b.key)),
      ...historyKeymap,
    ]),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ 'aria-label': 'Note', spellcheck: 'true' }),
    placeholder(EDITOR_PLACEHOLDER),
    markdownStyles,
    editorTheme,
  ];
}
