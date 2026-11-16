import { snippet } from '@codemirror/autocomplete';
import type { EditorState, Transaction } from '@codemirror/state';

/** What an insert needs: a view, or a state + dispatch in tests. */
export type InsertTarget = { state: EditorState; dispatch: (tr: Transaction) => void };

/**
 * Templates use CodeMirror snippet fields: `${name}` is a placeholder to type over, Tab moves to the
 * next one, and an empty `${}` is where the cursor ends up.
 */
export const TABLE_TEMPLATE = '| ${Column 1} | ${Column 2} |\n| --- | --- |\n| ${} |  |';
export const DIVIDER_TEMPLATE = '---\n${}';
export const CALLOUT_TEMPLATE = '> [!NOTE]\n> ${}';
export const IMAGE_TEMPLATE = '![${alt text}](${url})';

const blank = (text: string) => !text.trim();

/**
 * Inserts a block of lines at the cursor: on a blank line it takes that line, otherwise it goes
 * after the current line. Blank lines are added around it where Markdown needs them, so a table
 * or callout never swallows the next paragraph and a divider never turns the line above into a
 * heading.
 */
export function insertBlock(template: string) {
  return (target: InsertTarget): boolean => {
    const { state } = target;
    if (state.readOnly) return false;
    const line = state.doc.lineAt(state.selection.main.head);
    const takesLine = blank(line.text);
    const lineAbove = takesLine && line.number > 1 ? state.doc.line(line.number - 1).text : '';
    const lineBelow = line.number < state.doc.lines ? state.doc.line(line.number + 1).text : '';
    const lead = takesLine ? (blank(lineAbove) ? '' : '\n') : '\n\n';
    const trail = blank(lineBelow) ? '' : '\n';
    snippet(lead + template + trail)(target, null, takesLine ? line.from : line.to, line.to);
    return true;
  };
}

/** Inserts inline text at the cursor (over the selection). */
export function insertInline(template: string) {
  return (target: InsertTarget): boolean => {
    if (target.state.readOnly) return false;
    const { from, to } = target.state.selection.main;
    snippet(template)(target, null, from, to);
    return true;
  };
}
