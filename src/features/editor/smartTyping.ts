import {
  deleteMarkupBackward,
  insertNewlineContinueMarkupCommand,
} from '@codemirror/lang-markdown';
import {
  EditorSelection,
  MapMode,
  Prec,
  StateEffect,
  StateField,
  type EditorState,
  type Extension,
  type StateCommand,
  type TransactionSpec,
} from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { parseLine } from '../../commands/lines';
import { enclosingNode } from '../../commands/tree';

/*
 * Smart typing (docs/editor-ux-spec.md §6):
 * - Enter continues lists, quotes and tasks; on an empty item it leaves the list (or moves up a level)
 *   instead of making the list loose. On an empty quote line it leaves the quote.
 * - Enter after an opening ``` fence adds the closing fence; after "---" under a paragraph it adds a
 *   blank line first, so the line stays a divider instead of turning the paragraph into a heading.
 * - "[] " (or "[ ] ", "[x] ") at the start of a line becomes a task.
 * - Typing ( [ ` * auto-closes; typing the closer steps over it; Backspace removes an empty pair.
 *   "**" opens bold as **‸**. Selected text is wrapped by * _ ~ ` $ ( [.
 *   $ only wraps for now; auto-closing it waits for math rendering (M5).
 */

const AUTO_CLOSE: Record<string, string> = { '(': ')', '[': ']', '`': '`', '*': '*' };
const WRAP: Record<string, string> = { ...AUTO_CLOSE, _: '_', '~': '~', $: '$' };
const STEP_OVER = new Set([')', ']', '`', '*']);
const WORD_CHAR = /[\p{L}\p{N}_]/u;
const BEFORE_CLOSER = /^$|[\s)\]}.,;:!?'"]/;

/** Closers this extension inserted, so stepping over never skips characters the person typed. */
const addClosers = StateEffect.define<number[]>();

export const autoClosers = StateField.define<readonly number[]>({
  create: () => [],
  update(positions, tr) {
    let next = positions;
    if (tr.docChanged) {
      next = next
        .map((pos) => tr.changes.mapPos(pos, 1, MapMode.TrackDel))
        .filter((pos): pos is number => pos !== null);
    }
    for (const effect of tr.effects) if (effect.is(addClosers)) next = [...next, ...effect.value];
    if (next.length && (tr.docChanged || tr.selection)) {
      // Forget closers once the cursor leaves their line.
      const line = tr.state.doc.lineAt(tr.state.selection.main.head);
      next = next.filter((pos) => pos >= line.from && pos <= line.to);
    }
    return next;
  },
});

function isAutoCloser(state: EditorState, pos: number, char: string) {
  return state.sliceDoc(pos, pos + 1) === char && state.field(autoClosers, false)?.includes(pos);
}

/** The edit for one typed character, or null to let it insert normally. */
export function smartInput(state: EditorState, text: string): TransactionSpec | null {
  if (text.length !== 1 || state.readOnly) return null;
  const ranges = state.selection.ranges;

  // Wrap selections: "word" + * → "*word*", selection kept on the text.
  if (WRAP[text] && ranges.some((r) => !r.empty)) {
    const close = WRAP[text];
    return {
      ...state.changeByRange((range) =>
        range.empty
          ? {
              changes: { from: range.from, insert: text },
              range: EditorSelection.cursor(range.from + 1),
            }
          : {
              changes: [
                { from: range.from, insert: text },
                { from: range.to, insert: close },
              ],
              range: EditorSelection.range(range.anchor + 1, range.head + 1),
            },
      ),
      userEvent: 'input.type',
    };
  }
  if (ranges.length > 1) return null;

  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);
  const before = state.sliceDoc(line.from, pos);
  const prev = state.sliceDoc(pos - 1, pos);
  const next = state.sliceDoc(pos, pos + 1);

  // "[] " at the start of a line (after a quote or bullet) → task.
  if (text === ' ' && line.to === pos) {
    const rule = /^([ \t]*(?:>[ \t]?)*)(?:([-*+])[ \t]+)?\[([ xX]?)\]$/.exec(before);
    if (rule) {
      const [, prefix = '', bullet = '-', mark = ''] = rule;
      const insert = `${prefix}${bullet} [${mark.toLowerCase() === 'x' ? 'x' : ' '}] `;
      return {
        changes: { from: line.from, to: pos, insert },
        selection: EditorSelection.cursor(line.from + insert.length),
        userEvent: 'input.type',
      };
    }
  }

  if (STEP_OVER.has(text) && isAutoCloser(state, pos, text)) {
    // "*‸*" + * → "**‸**": the second star opens bold rather than closing italic.
    // (Only right after an opening star, not after stepping over a closing one.)
    if (
      text === '*' &&
      prev === '*' &&
      state.sliceDoc(pos - 2, pos - 1) !== '*' &&
      !isAutoCloser(state, pos - 1, '*')
    ) {
      return {
        changes: { from: pos, insert: '**' },
        selection: EditorSelection.cursor(pos + 1),
        effects: addClosers.of([pos + 1]),
        userEvent: 'input.type',
      };
    }
    return { selection: EditorSelection.cursor(pos + 1), userEvent: 'select' };
  }

  const close = AUTO_CLOSE[text];
  if (!close || !BEFORE_CLOSER.test(next)) return null;
  const symmetric = close === text;
  if (symmetric && WORD_CHAR.test(prev)) return null; // snake*case, a`b
  if (text === '`' && prev === '`') return null; // building a ``` fence

  if (text === '*') {
    const linePrefix = /^[ \t]*(?:>[ \t]?)*$/;
    if (linePrefix.test(before)) return null; // could be a "* " bullet
    if (/^[ \t]*(?:>[ \t]?)*\*$/.test(before)) {
      // A lone star at the line start plus another: bold, "**‸**".
      return {
        changes: { from: pos, insert: '***' },
        selection: EditorSelection.cursor(pos + 1),
        effects: addClosers.of([pos + 1, pos + 2]),
        userEvent: 'input.type',
      };
    }
  }

  return {
    changes: { from: pos, insert: text + close },
    selection: EditorSelection.cursor(pos + 1),
    effects: addClosers.of([pos + 1]),
    userEvent: 'input.type',
  };
}

/** Backspace between an empty auto-closed pair removes both characters. */
export const deleteEmptyPair: StateCommand = ({ state, dispatch }) => {
  const ranges = state.selection.ranges;
  if (!ranges.every((r) => r.empty)) return false;
  const pairs = ranges.map((r) => {
    const open = state.sliceDoc(r.head - 1, r.head);
    const close = AUTO_CLOSE[open];
    return close && isAutoCloser(state, r.head, close) ? r.head : -1;
  });
  if (pairs.some((p) => p < 0)) return false;
  dispatch(
    state.update({
      changes: pairs.map((p) => ({ from: p - 1, to: p + 1 })),
      userEvent: 'delete.backward',
      scrollIntoView: true,
    }),
  );
  return true;
};

const FENCE_LINE = /^([ \t]*)(`{3,}|~{3,})([^`]*)$/;
const DASH_BREAK = /^ {0,3}-(?:[ \t]*-){2,}[ \t]*$/;
const continueMarkup = insertNewlineContinueMarkupCommand({ nonTightLists: false });

/** Enter: the special cases above, then list/quote continuation, else a plain new line. */
export const smartEnter: StateCommand = (target) => {
  const { state, dispatch } = target;
  const range = state.selection.main;
  if (state.readOnly || state.selection.ranges.length > 1 || !range.empty) {
    return continueMarkup(target);
  }
  const pos = range.head;
  const line = state.doc.lineAt(pos);
  const atEnd = pos === line.to;

  // Opening fence with no closing fence yet: add one, cursor inside.
  const fence = atEnd ? FENCE_LINE.exec(line.text) : null;
  if (fence) {
    const [, indent = '', marker = ''] = fence;
    const fenceStart = line.from + indent.length;
    const block = enclosingNode(state, fenceStart, fenceStart, 'FencedCode');
    const opensHere = block !== null && block.from === fenceStart;
    const last = block ? state.doc.lineAt(block.to) : null;
    const closed =
      block &&
      last &&
      last.number > line.number &&
      new RegExp(`^[ \\t]*${marker[0] === '`' ? '`' : '~'}{${marker.length},}[ \\t]*$`).test(
        last.text,
      );
    if (opensHere && !closed) {
      dispatch(
        state.update({
          changes: { from: pos, insert: `\n${indent}\n${indent}${marker}` },
          selection: EditorSelection.cursor(pos + 1 + indent.length),
          scrollIntoView: true,
          userEvent: 'input',
        }),
      );
      return true;
    }
  }

  // "---" right under a paragraph would make it a heading: keep it a divider.
  if (atEnd && line.number > 1 && DASH_BREAK.test(line.text)) {
    const previous = state.doc.line(line.number - 1);
    const p = parseLine(previous.text);
    const paragraph =
      p.content.trim() && !p.quote && !p.list && !p.heading && !previous.text.includes('|');
    if (paragraph) {
      dispatch(
        state.update({
          changes: [
            { from: line.from, insert: '\n' },
            { from: pos, insert: '\n' },
          ],
          selection: EditorSelection.cursor(pos + 2),
          scrollIntoView: true,
          userEvent: 'input',
        }),
      );
      return true;
    }
  }

  // Empty quote line: leave the quote (one level) instead of continuing it.
  if (atEnd && /^[ \t]*(?:>[ \t]?)+$/.test(line.text)) {
    const insert = line.text.replace(/>[ \t]?$/, '').replace(/[ \t]+$/, '');
    dispatch(
      state.update({
        changes: { from: line.from, to: line.to, insert },
        selection: EditorSelection.cursor(line.from + insert.length),
        userEvent: 'delete',
      }),
    );
    return true;
  }

  return continueMarkup(target);
};

export function smartTyping(): Extension {
  return [
    autoClosers,
    EditorView.inputHandler.of((view, from, to, text) => {
      if (
        view.composing ||
        from !== view.state.selection.main.from ||
        to !== view.state.selection.main.to
      ) {
        return false;
      }
      const spec = smartInput(view.state, text);
      if (!spec) return false;
      view.dispatch(spec);
      return true;
    }),
    Prec.high(
      keymap.of([
        { key: 'Enter', run: smartEnter },
        {
          key: 'Backspace',
          run: (target) => deleteEmptyPair(target) || deleteMarkupBackward(target),
        },
      ]),
    ),
  ];
}
