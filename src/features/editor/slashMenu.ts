import {
  autocompletion,
  completionStatus,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { editorCommand } from '../../commands/editorCommands';
import { parseLine, prefixOf } from '../../commands/lines';
import { searchCommands } from '../../commands/search';
import { markdownTree, type SyntaxNode } from '../../commands/tree';
import type { EditorCommand } from '../../commands/types';
import { iconElement } from '../../ui/iconElement';

/** The slash menu's items, in the spec's order (docs/editor-ux-spec.md §3). Math and Diagram come with KaTeX and Mermaid (M7). */
export const SLASH_ITEM_IDS = [
  'block.heading1',
  'block.heading2',
  'block.heading3',
  'list.bullet',
  'list.ordered',
  'list.task',
  'block.quote',
  'block.codeBlock',
  'block.table',
  'block.divider',
  'block.image',
  'text.link',
  'block.callout',
] as const;

/** Items that insert text where the cursor is; the others act on the whole line. */
const INLINE_ITEMS = new Set<string>(['block.image', 'text.link']);

const SLASH_COMMANDS: EditorCommand[] = SLASH_ITEM_IDS.map((id) => editorCommand(id));

/** No menu inside code, raw HTML or URLs: a "/" there is just a character. */
const NO_MENU_IN = new Set([
  'FencedCode',
  'CodeBlock',
  'InlineCode',
  'HTMLBlock',
  'HTMLTag',
  'CommentBlock',
  'Comment',
  'URL',
  'Autolink',
]);

type SlashOption = Completion & { command: EditorCommand; ranges: [number, number][] };

/** Removes the typed "/query", then runs the command, as two steps so Undo restores the plain line. */
function pick(command: EditorCommand) {
  return (view: EditorView, _completion: Completion, from: number, to: number) => {
    let start = from;
    if (!INLINE_ITEMS.has(command.id)) {
      // "Hello /h1" becomes "# Hello", not "# Hello ": drop the space before the slash too.
      const line = view.state.doc.lineAt(from);
      const prefixEnd = line.from + prefixOf(parseLine(line.text)).length;
      if (from > prefixEnd && /[ \t]/.test(view.state.sliceDoc(from - 1, from))) start = from - 1;
    }
    view.dispatch({
      changes: { from: start, to },
      selection: { anchor: start },
      userEvent: 'delete.slash',
    });
    command.run(view);
  };
}

/**
 * Completion source: "/" at the start of a line or after a space (after a list or quote marker too),
 * followed by letters that filter the items.
 */
export function slashCompletions(context: CompletionContext): CompletionResult | null {
  const typed = context.matchBefore(/\/[\p{L}\p{N}-]*$/u);
  if (!typed) return null;
  const { state } = context;
  const line = state.doc.lineAt(typed.from);
  if (typed.from > line.from && !/\s/.test(state.sliceDoc(typed.from - 1, typed.from))) {
    return null;
  }
  let node: SyntaxNode | null = markdownTree(state, typed.from).resolveInner(typed.from, 1);
  for (; node; node = node.parent) if (NO_MENU_IN.has(node.name)) return null;
  const matches = searchCommands(SLASH_COMMANDS, typed.text.slice(1));
  if (!matches.length) return null;
  const options: SlashOption[] = matches.map(({ command, ranges }) => ({
    label: command.label,
    detail: command.syntaxHint,
    apply: pick(command),
    command,
    ranges,
  }));
  return {
    from: typed.from,
    options,
    // We rank ourselves (keywords such as "h2" or "hr" count), so keep our order and highlights.
    filter: false,
    getMatch: (completion) => (completion as SlashOption).ranges.flat(),
    // Re-rank on every key in the same update, so a quick "/table" + Enter picks Table.
    update: (_current, _from, _to, next) => slashCompletions(next),
  };
}

function iconTile(completion: Completion): Node {
  const tile = document.createElement('span');
  tile.className = 'slash-menu__tile';
  tile.setAttribute('aria-hidden', 'true');
  tile.append(iconElement((completion as SlashOption).command.icon));
  return tile;
}

function keyHint(keys: string, label: string): HTMLElement {
  const hint = document.createElement('span');
  for (const key of keys.split(' ')) {
    const cap = document.createElement('kbd');
    cap.className = 'keycap';
    cap.textContent = key;
    hint.append(cap);
  }
  hint.append(` ${label}`);
  return hint;
}

/** "↑↓ Navigate · ↵ Insert · Esc Close" under the list (autocomplete has no footer of its own). */
const footer = ViewPlugin.fromClass(
  class {
    /** One measure request per frame, however many updates come in. */
    readonly measure = { key: this, read: () => null, write: () => this.add() };

    view: EditorView;

    constructor(view: EditorView) {
      this.view = view;
    }

    update(update: ViewUpdate) {
      if (completionStatus(update.state) !== 'active') return;
      this.view.requestMeasure(this.measure);
    }

    add() {
      const menu = this.view.dom.querySelector('.cm-tooltip-autocomplete.slash-menu');
      if (!menu || menu.querySelector('.slash-menu__footer')) return;
      const bar = document.createElement('div');
      bar.className = 'slash-menu__footer';
      bar.setAttribute('aria-hidden', 'true');
      bar.append(keyHint('↑ ↓', 'Navigate'), keyHint('↵', 'Insert'), keyHint('Esc', 'Close'));
      // Clicking the hints must not take focus from the editor (that would close the menu).
      bar.addEventListener('mousedown', (event) => event.preventDefault());
      menu.append(bar);
    }
  },
);

export function slashMenu(): Extension {
  return [
    autocompletion({
      // Only the slash menu: no HTML tag completion from lang-markdown.
      override: [slashCompletions],
      // The source is instant, so open on the "/" itself instead of after a pause in typing.
      activateOnTypingDelay: 0,
      icons: false,
      tooltipClass: () => 'slash-menu',
      optionClass: () => 'slash-menu__option',
      addToOptions: [{ render: iconTile, position: 20 }],
    }),
    // Screen readers announce the list as "Blocks".
    EditorState.phrases.of({ Completions: 'Blocks' }),
    footer,
  ];
}
