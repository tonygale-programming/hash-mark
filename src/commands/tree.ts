import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';

export type SyntaxNode = ReturnType<ReturnType<typeof syntaxTree>['resolveInner']>;

/** The Markdown tree, parsed up to `upto` if that is quick; otherwise whatever is ready. */
export function markdownTree(state: EditorState, upto = state.doc.length) {
  return ensureSyntaxTree(state, upto, 50) ?? syntaxTree(state);
}

/** Innermost node named `name` that contains from..to (looking from both ends of the range). */
export function enclosingNode(
  state: EditorState,
  from: number,
  to: number,
  name: string,
): SyntaxNode | null {
  const tree = markdownTree(state, to);
  const starts: [number, -1 | 1][] = [[from, 1]];
  if (to > from) starts.push([to, -1]);
  for (const [pos, side] of starts) {
    for (let node: SyntaxNode | null = tree.resolveInner(pos, side); node; node = node.parent) {
      if (node.name === name && node.from <= from && node.to >= to) return node;
    }
  }
  return null;
}
