import { CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { marked, stateFrom } from '../../commands/testing';
import { SLASH_ITEM_IDS, slashCompletions } from './slashMenu';

function complete(doc: string): CompletionResult | null {
  const state = stateFrom(doc);
  return slashCompletions(
    new CompletionContext(state, state.selection.main.head, false),
  ) as CompletionResult | null;
}

const labels = (doc: string) => complete(doc)?.options.map((o) => o.label) ?? null;

/** Picks the first item for `doc` in a real view and returns the document in ‸ notation. */
function pickFirst(doc: string): string {
  const view = new EditorView({ state: stateFrom(doc) });
  const result = complete(doc)!;
  const option = result.options[0]!;
  const apply = option.apply as (v: EditorView, c: typeof option, f: number, t: number) => void;
  apply(view, option, result.from, view.state.selection.main.head);
  const out = marked(view.state);
  view.destroy();
  return out;
}

describe('slash menu', () => {
  it('opens at the start of a line, after a space and after a list marker', () => {
    expect(labels('/‸')).toHaveLength(SLASH_ITEM_IDS.length);
    expect(labels('Plans /‸')).toHaveLength(SLASH_ITEM_IDS.length);
    expect(labels('- /‸')).toHaveLength(SLASH_ITEM_IDS.length);
    expect(labels('> /‸')).toHaveLength(SLASH_ITEM_IDS.length);
  });

  it('lists the spec items in order', () => {
    expect(labels('/‸')).toEqual([
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Bulleted list',
      'Numbered list',
      'To-do list',
      'Quote',
      'Code block',
      'Table',
      'Divider',
      'Image',
      'Link',
      'Callout',
    ]);
  });

  it('does not open inside words, URLs or code', () => {
    expect(labels('and/‸')).toBeNull();
    expect(labels('see https://example.com/‸')).toBeNull();
    expect(labels('`a /‸`')).toBeNull();
    expect(labels('```\ncd /‸\n```')).toBeNull();
  });

  it('filters by label and keywords, and closes when nothing matches', () => {
    expect(labels('/h2‸')).toEqual(['Heading 2']);
    expect(labels('/hr‸')?.[0]).toBe('Divider');
    expect(labels('/todo‸')).toEqual(['To-do list']);
    expect(labels('/list‸')).toEqual(['Bulleted list', 'Numbered list', 'To-do list']);
    expect(labels('/zzz‸')).toBeNull();
  });

  it('replaces the typed /query with the block', () => {
    expect(pickFirst('/h1‸')).toBe('# ‸');
    expect(pickFirst('Plans /h2‸')).toBe('## Plans‸');
    expect(pickFirst('/todo‸')).toBe('- [ ] ‸');
    expect(pickFirst('/hr‸')).toBe('---\n‸');
    expect(pickFirst('See /image‸')).toBe('See ![«alt text»](url)');
  });
});
