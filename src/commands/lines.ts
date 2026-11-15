import {
  EditorSelection,
  type ChangeSpec,
  type EditorState,
  type Line,
  type StateCommand,
} from '@codemirror/state';
import { enclosingNode } from './tree';

/** A line split into its Markdown prefix parts and the content after them. */
export type ParsedLine = {
  indent: string;
  quote: string;
  inner: string;
  heading: number;
  list: string | null;
  task: ' ' | 'x' | null;
  content: string;
};

const LINE_RE =
  /^(?<indent>[ \t]*)(?<quote>(?:>[ \t]?)*)(?<inner>[ \t]*)(?:(?<heading>#{1,6})(?:[ \t]+|$))?(?:(?<list>[-*+]|\d{1,9}[.)])(?:[ \t]+|$))?(?:\[(?<task>[ xX])\](?:[ \t]+|$))?(?<content>.*)$/;

export function parseLine(text: string): ParsedLine {
  const g = LINE_RE.exec(text)?.groups ?? {};
  const list = g.list ?? null;
  return {
    indent: g.indent ?? '',
    quote: g.quote ?? '',
    inner: g.inner ?? '',
    heading: g.heading?.length ?? 0,
    list,
    // "[ ]" only counts as a task box after a list marker
    task: list && g.task ? (g.task === ' ' ? ' ' : 'x') : null,
    content:
      list || !g.task ? (g.content ?? '') : `[${g.task}]${text.slice(text.indexOf(']') + 1)}`,
  };
}

export function prefixOf(line: ParsedLine): string {
  return (
    line.indent +
    line.quote +
    line.inner +
    (line.heading ? '#'.repeat(line.heading) + ' ' : '') +
    (line.list ? line.list + ' ' : '') +
    (line.task ? `[${line.task}] ` : '')
  );
}

export type ListKind = 'bullet' | 'ordered' | 'task';

export function listKind(line: ParsedLine): ListKind | null {
  if (!line.list) return null;
  if (line.task) return 'task';
  return /\d/.test(line.list) ? 'ordered' : 'bullet';
}

/** Lines touched by the selection; a range ending at the start of a line does not include it. */
export function selectedLines(state: EditorState): Line[] {
  const seen = new Map<number, Line>();
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from);
    let last = state.doc.lineAt(range.to);
    if (range.to > range.from && range.to === last.from && last.number > first.number) {
      last = state.doc.line(last.number - 1);
    }
    for (let n = first.number; n <= last.number; n++) seen.set(n, state.doc.line(n));
  }
  return [...seen.values()].sort((a, b) => a.number - b.number);
}

/**
 * Rewrites the Markdown prefix of each selected line (the content after it is never touched, so the
 * cursor keeps its place in the text). `edit` returns the new parsed line, or null to leave it.
 */
export function editLinePrefixes(
  state: EditorState,
  edit: (line: ParsedLine, index: number, all: ParsedLine[]) => ParsedLine | null,
) {
  const lines = selectedLines(state);
  const parsed = lines.map((line) => parseLine(line.text));
  const changes: ChangeSpec[] = [];
  /** Old prefix end → new prefix end, per changed line, to keep cursors out of the new prefix. */
  const prefixes: { from: number; oldEnd: number; newLength: number }[] = [];
  lines.forEach((line, index) => {
    const before = parsed[index]!;
    const after = edit(before, index, parsed);
    if (!after) return;
    const oldPrefix = line.text.length - before.content.length;
    const newPrefix = prefixOf(after);
    if (line.text.slice(0, oldPrefix) === newPrefix) return;
    changes.push({ from: line.from, to: line.from + oldPrefix, insert: newPrefix });
    prefixes.push({ from: line.from, oldEnd: line.from + oldPrefix, newLength: newPrefix.length });
  });
  if (!changes.length) return null;

  const changeSet = state.changes(changes);
  const mapPos = (pos: number) => {
    const hit = prefixes.find((p) => pos >= p.from && pos <= p.oldEnd);
    if (hit) return changeSet.mapPos(hit.from, -1) + hit.newLength;
    return changeSet.mapPos(pos, 1);
  };
  const selection = EditorSelection.create(
    state.selection.ranges.map((r) =>
      r.empty
        ? EditorSelection.cursor(mapPos(r.head))
        : EditorSelection.range(mapPos(r.anchor), mapPos(r.head)),
    ),
    state.selection.mainIndex,
  );
  return state.update({
    changes: changeSet,
    selection,
    scrollIntoView: true,
    userEvent: 'input.format',
  });
}

function lineCommand(
  edit: (line: ParsedLine, index: number, all: ParsedLine[]) => ParsedLine | null,
): StateCommand {
  return ({ state, dispatch }) => {
    if (state.readOnly) return false;
    const tr = editLinePrefixes(state, edit);
    if (tr) dispatch(tr);
    return true;
  };
}

const isBlank = (line: ParsedLine) => !prefixOf(line).trim() && !line.content.trim();

/** Heading 1–3: sets the level (dropping list markers), or removes it if all lines already have it. */
export function toggleHeading(level: number): StateCommand {
  return lineCommand((line, _i, all) => {
    const content = all.filter((l) => !isBlank(l));
    const allAtLevel = content.length > 0 && content.every((l) => l.heading === level);
    if (allAtLevel) return { ...line, heading: 0 };
    if (isBlank(line) && all.length > 1) return null;
    return { ...line, indent: '', inner: '', heading: level, list: null, task: null };
  });
}

/** Bulleted / numbered / task list: applies the kind (numbering 1…n), or removes it if all have it. */
export function toggleList(kind: ListKind): StateCommand {
  return lineCommand((line, index, all) => {
    const content = all.filter((l) => !isBlank(l));
    const allOfKind = content.length > 0 && content.every((l) => listKind(l) === kind);
    if (allOfKind) return { ...line, list: null, task: null };
    if (isBlank(line) && all.length > 1) return null;
    const number = Math.max(1, all.slice(0, index + 1).filter((l) => !isBlank(l)).length);
    return {
      ...line,
      heading: 0,
      list: kind === 'ordered' ? `${number}.` : listKind(line) === 'bullet' ? line.list : '-',
      task: kind === 'task' ? (line.task ?? ' ') : null,
    };
  });
}

/** Quote: adds "> " to every line, or removes one level if every non-blank line is quoted. */
export const toggleQuote: StateCommand = lineCommand((line, _i, all) => {
  const content = all.filter((l) => !isBlank(l));
  const allQuoted = content.length > 0 && content.every((l) => l.quote.trim());
  if (allQuoted) return { ...line, quote: line.quote.replace(/^>[ \t]?/, '') };
  return { ...line, indent: '', quote: '> ' + line.quote, inner: line.quote ? line.inner : '' };
});

/** Toggle task: checks/unchecks a task; turns a list item or a plain line into an open task. */
export const toggleTask: StateCommand = lineCommand((line, _i, all) => {
  if (isBlank(line) && all.length > 1) return null;
  if (line.task) return { ...line, task: line.task === 'x' ? ' ' : 'x' };
  return {
    ...line,
    heading: 0,
    list: line.list && !/\d/.test(line.list) ? line.list : '-',
    task: ' ',
  };
});

/** Tab / Shift+Tab: indent or outdent list items by their marker width. Not in a list: not handled. */
export function indentList(direction: 1 | -1): StateCommand {
  return ({ state, dispatch }) => {
    if (state.readOnly) return false;
    const lines = selectedLines(state).map((l) => parseLine(l.text));
    if (!lines.some((l) => l.list)) return false;
    const tr = editLinePrefixes(state, (line) => {
      if (!line.list) return null;
      const width = line.list.length + 1;
      if (direction === 1) return { ...line, indent: line.indent + ' '.repeat(width) };
      const remove = Math.min(width, line.indent.length - line.indent.trimStart().length);
      return remove ? { ...line, indent: line.indent.slice(remove) } : null;
    });
    if (tr) dispatch(tr);
    return true;
  };
}

/**
 * Code block: wraps the selected lines in ``` fences (an empty line gets an empty block with the
 * cursor inside), or removes the fences of the block the cursor is in.
 */
export const toggleCodeBlock: StateCommand = ({ state, dispatch }) => {
  if (state.readOnly) return false;
  const { from, to } = state.selection.main;
  const block = enclosingNode(state, from, to, 'FencedCode');
  if (block) {
    const open = state.doc.lineAt(block.from);
    const close = state.doc.lineAt(block.to);
    const closed = close.number > open.number && /^\s*(`{3,}|~{3,})\s*$/.test(close.text);
    const changes: ChangeSpec[] = [
      { from: open.from, to: Math.min(open.to + 1, state.doc.length) },
    ];
    if (closed) changes.push({ from: Math.max(close.from - 1, open.to), to: close.to });
    dispatch(state.update({ changes, scrollIntoView: true, userEvent: 'input.format' }));
    return true;
  }
  const lines = selectedLines(state);
  const first = lines[0]!;
  const last = lines[lines.length - 1]!;
  if (lines.length === 1 && !first.text.trim()) {
    dispatch(
      state.update({
        changes: { from: first.from, to: first.to, insert: '```\n\n```' },
        selection: EditorSelection.cursor(first.from + 4),
        scrollIntoView: true,
        userEvent: 'input.format',
      }),
    );
    return true;
  }
  dispatch(
    state.update({
      changes: [
        { from: first.from, insert: '```\n' },
        { from: last.to, insert: '\n```' },
      ],
      scrollIntoView: true,
      userEvent: 'input.format',
    }),
  );
  return true;
};
