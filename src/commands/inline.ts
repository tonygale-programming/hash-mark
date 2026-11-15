import { EditorSelection, type EditorState, type StateCommand } from '@codemirror/state';
import { enclosingNode } from './tree';

/** Inline syntax a command toggles, by its Lezer node names. */
export type InlineFormat = {
  /** Marker written when wrapping, e.g. "**". */
  mark: string;
  /** Node for the formatted span, e.g. "StrongEmphasis". */
  node: string;
};

export const BOLD: InlineFormat = { mark: '**', node: 'StrongEmphasis' };
export const ITALIC: InlineFormat = { mark: '*', node: 'Emphasis' };
export const STRIKETHROUGH: InlineFormat = { mark: '~~', node: 'Strikethrough' };
export const INLINE_CODE: InlineFormat = { mark: '`', node: 'InlineCode' };

/** True when the main selection sits inside this format (for toolbar "pressed" states). */
export function isInlineActive(state: EditorState, format: InlineFormat): boolean {
  const { from, to } = state.selection.main;
  return enclosingNode(state, from, to, format.node) !== null;
}

/**
 * Bold, italic, strikethrough, inline code: wraps the selection, or removes the markers when the
 * selection (or cursor) is already inside that format. Selections are trimmed of edge spaces, which
 * Markdown would not accept inside markers. An empty cursor inside a word wraps the word; elsewhere
 * it inserts an empty pair with the cursor between.
 */
export function toggleInline(format: InlineFormat): StateCommand {
  return ({ state, dispatch }) => {
    if (state.readOnly) return false;
    const { mark } = format;
    const spec = state.changeByRange((range) => {
      const existing = enclosingNode(state, range.from, range.to, format.node);
      if (existing) {
        const open = existing.firstChild;
        const close = existing.lastChild;
        if (open && close && open.from !== close.from) {
          const changes = [
            { from: open.from, to: open.to },
            { from: close.from, to: close.to },
          ];
          const openLength = open.to - open.from;
          const clamp = (pos: number) => Math.min(Math.max(pos, open.to), close.from) - openLength;
          return {
            changes,
            range: EditorSelection.range(clamp(range.anchor), clamp(range.head)),
          };
        }
      }

      let { from, to } = range;
      if (from === to) {
        const word = state.wordAt(from);
        if (word && word.from < from && from < word.to) ({ from, to } = word);
      } else {
        const text = state.sliceDoc(from, to);
        from += text.length - text.trimStart().length;
        to -= text.length - text.trimEnd().length;
        if (from >= to) ({ from, to } = range);
      }

      if (from === to) {
        return {
          changes: { from, insert: mark + mark },
          range: EditorSelection.cursor(from + mark.length),
        };
      }
      const wasCursor = range.empty;
      return {
        changes: [
          { from, insert: mark },
          { from: to, insert: mark },
        ],
        range: wasCursor
          ? EditorSelection.cursor(range.head + mark.length)
          : EditorSelection.range(from + mark.length, to + mark.length),
      };
    });
    dispatch(state.update(spec, { scrollIntoView: true, userEvent: 'input.format' }));
    return true;
  };
}

const URL_RE = /^(https?:\/\/|mailto:|www\.)\S+$/i;
export const LINK_PLACEHOLDER = 'url';

export function isUrl(text: string): boolean {
  return URL_RE.test(text.trim());
}

/**
 * Link: inside a link, removes it (keeps the text). A selected URL becomes [](url) with the cursor in
 * the brackets; other selected text becomes [text](url) with "url" selected to type over.
 */
export const toggleLink: StateCommand = ({ state, dispatch }) => {
  if (state.readOnly) return false;
  const spec = state.changeByRange((range) => {
    const link = enclosingNode(state, range.from, range.to, 'Link');
    if (link) {
      const marks: { from: number; to: number }[] = [];
      for (let child = link.firstChild; child; child = child.nextSibling) {
        if (child.name === 'LinkMark') marks.push({ from: child.from, to: child.to });
      }
      const [open, close] = marks;
      if (open && close) {
        const text = state.sliceDoc(open.to, close.from);
        return {
          changes: { from: link.from, to: link.to, insert: text },
          range: EditorSelection.range(link.from, link.from + text.length),
        };
      }
    }
    const selected = state.sliceDoc(range.from, range.to);
    if (selected && isUrl(selected)) {
      const insert = `[](${selected.trim()})`;
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.cursor(range.from + 1),
      };
    }
    const insert = `[${selected}](${LINK_PLACEHOLDER})`;
    const urlFrom = range.from + selected.length + 3;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: selected
        ? EditorSelection.range(urlFrom, urlFrom + LINK_PLACEHOLDER.length)
        : EditorSelection.cursor(range.from + 1),
    };
  });
  dispatch(state.update(spec, { scrollIntoView: true, userEvent: 'input.format' }));
  return true;
};
