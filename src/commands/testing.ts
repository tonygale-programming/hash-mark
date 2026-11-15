import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { ensureSyntaxTree } from '@codemirror/language';
import { EditorSelection, EditorState, type Extension, type StateCommand } from '@codemirror/state';

/**
 * Test helper: a document with "‸" for a cursor or "«…»" for a selection
 * (several allowed), run a command, and get the document back in the same notation.
 */
export function stateFrom(marked: string, extensions: Extension[] = []): EditorState {
  const ranges: { anchor: number; head: number }[] = [];
  let doc = '';
  let open = -1;
  for (const ch of marked) {
    if (ch === '‸') ranges.push({ anchor: doc.length, head: doc.length });
    else if (ch === '«') open = doc.length;
    else if (ch === '»') {
      ranges.push({ anchor: open, head: doc.length });
      open = -1;
    } else doc += ch;
  }
  const state = EditorState.create({
    doc,
    selection: EditorSelection.create(
      (ranges.length ? ranges : [{ anchor: 0, head: 0 }]).map((r) =>
        EditorSelection.range(r.anchor, r.head),
      ),
    ),
    extensions: [
      markdown({ base: markdownLanguage }),
      EditorState.allowMultipleSelections.of(true),
      ...extensions,
    ],
  });
  ensureSyntaxTree(state, state.doc.length, 5000);
  return state;
}

export function marked(state: EditorState): string {
  const points: { pos: number; text: string }[] = [];
  for (const range of state.selection.ranges) {
    if (range.empty) points.push({ pos: range.head, text: '‸' });
    else points.push({ pos: range.from, text: '«' }, { pos: range.to, text: '»' });
  }
  points.sort((a, b) => b.pos - a.pos || (a.text === '«' ? 1 : -1));
  let doc = state.doc.toString();
  for (const p of points) doc = doc.slice(0, p.pos) + p.text + doc.slice(p.pos);
  return doc;
}

export function apply(command: StateCommand, input: string): { out: string; handled: boolean } {
  let state = stateFrom(input);
  const handled = command({ state, dispatch: (tr) => (state = tr.state) });
  return { out: marked(state), handled };
}

export function run(command: StateCommand, input: string): string {
  return apply(command, input).out;
}
