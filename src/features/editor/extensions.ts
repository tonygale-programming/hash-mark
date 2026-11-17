import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import type { Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder, tooltips } from '@codemirror/view';
import { editorTheme } from './editorTheme';
import { markdownStyles } from './markdownStyles';
import { slashMenu } from './slashMenu';
import { smartTyping } from './smartTyping';
import { EDITOR_COMMANDS } from '../../commands/editorCommands';
import { editorKeyBindings } from '../../commands/keymap';

/** Default bindings that clash with shortcuts the spec reserves (docs/editor-ux-spec.md §5). */
const RESERVED_KEYS = new Set(['Mod-/', 'Alt-A', 'Mod-i', 'Mod-Enter']);

export const EDITOR_PLACEHOLDER = 'Type / for blocks, or just start writing';

/** Keeps every editor tooltip inside the page gutter (16px on phones), never flush with the screen edge. */
export const editorTooltips: Extension = tooltips({
  tooltipSpace: (view) => {
    const { innerWidth, innerHeight } = view.dom.ownerDocument.defaultView ?? window;
    return { top: 0, left: 16, right: innerWidth - 16, bottom: innerHeight };
  },
});

export function editorExtensions(): Extension[] {
  return [
    // GFM: tables, strikethrough, task lists, autolinks. Its Enter/Backspace keymap is replaced by
    // smartTyping (same continuation, plus the spec's input rules and auto-close pairs).
    markdown({ base: markdownLanguage, addKeymap: false }),
    smartTyping(),
    // Its keys (arrows, Enter, Esc) take precedence while the menu is open.
    slashMenu(),
    editorTooltips,
    history(),
    // Registry shortcuts first; a command that does not apply falls through to the defaults.
    keymap.of(editorKeyBindings(EDITOR_COMMANDS)),
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
