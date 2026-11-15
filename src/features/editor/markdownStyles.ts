import { syntaxTree } from '@codemirror/language';
import type { Range } from '@codemirror/state';
import {
  Decoration,
  ViewPlugin,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view';

/**
 * Styles Markdown in place from the Lezer syntax tree: line classes for blocks
 * (headings, code blocks, quotes, tables) and mark classes for inline syntax.
 * Markers stay visible here; hiding them (live preview) is a later layer.
 */

const LINE_CLASS: Record<string, string> = {
  ATXHeading1: 'cm-md-h1',
  SetextHeading1: 'cm-md-h1',
  ATXHeading2: 'cm-md-h2',
  SetextHeading2: 'cm-md-h2',
  ATXHeading3: 'cm-md-h3',
  ATXHeading4: 'cm-md-h4',
  ATXHeading5: 'cm-md-h4',
  ATXHeading6: 'cm-md-h4',
  Blockquote: 'cm-md-quote',
  Table: 'cm-md-table',
};

const CODE_BLOCKS = new Set(['FencedCode', 'CodeBlock']);

const MARK_CLASS: Record<string, string> = {
  StrongEmphasis: 'cm-md-strong',
  Emphasis: 'cm-md-em',
  Strikethrough: 'cm-md-strike',
  InlineCode: 'cm-md-code',
  Link: 'cm-md-link',
  URL: 'cm-md-url',
  HeaderMark: 'cm-md-mark',
  EmphasisMark: 'cm-md-mark',
  CodeMark: 'cm-md-mark',
  CodeInfo: 'cm-md-mark',
  LinkMark: 'cm-md-mark',
  QuoteMark: 'cm-md-mark',
  ListMark: 'cm-md-mark',
  StrikethroughMark: 'cm-md-mark',
  TaskMarker: 'cm-md-mark',
  TableDelimiter: 'cm-md-mark',
  HorizontalRule: 'cm-md-mark',
};

const lineDecos = new Map<string, Decoration>();
const markDecos = new Map<string, Decoration>();

function lineDeco(cls: string) {
  let deco = lineDecos.get(cls);
  if (!deco) lineDecos.set(cls, (deco = Decoration.line({ class: cls })));
  return deco;
}

function markDeco(cls: string) {
  let deco = markDecos.get(cls);
  if (!deco) markDecos.set(cls, (deco = Decoration.mark({ class: cls })));
  return deco;
}

export function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const ranges: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter(node) {
        const { name } = node;
        const lineClass = LINE_CLASS[name];
        const isCode = CODE_BLOCKS.has(name);
        if (lineClass || isCode) {
          const first = state.doc.lineAt(node.from).number;
          const last = state.doc.lineAt(Math.max(node.from, node.to - 1)).number;
          const start = state.doc.lineAt(Math.max(node.from, from)).number;
          const end = state.doc.lineAt(Math.min(node.to, to)).number;
          for (let n = start; n <= end; n++) {
            const line = state.doc.line(n);
            if (lineClass) ranges.push(lineDeco(lineClass).range(line.from));
            if (isCode) {
              const cls = [
                'cm-md-codeblock',
                n === first && 'cm-md-codeblock-first',
                n === last && 'cm-md-codeblock-last',
              ]
                .filter(Boolean)
                .join(' ');
              ranges.push(lineDeco(cls).range(line.from));
            }
          }
        }
        const markClass = MARK_CLASS[name];
        if (markClass && node.to > node.from) {
          ranges.push(markDeco(markClass).range(node.from, node.to));
        }
      },
    });
  }

  return Decoration.set(ranges, true);
}

export const markdownStyles = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
