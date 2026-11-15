import { deleteMarkupBackward } from '@codemirror/lang-markdown';
import { ensureSyntaxTree } from '@codemirror/language';
import { EditorSelection, type EditorState } from '@codemirror/state';
import { marked, stateFrom } from '../../commands/testing';
import { autoClosers, deleteEmptyPair, smartEnter, smartInput } from './smartTyping';

/**
 * Replays keys like a person typing: characters go through smartInput (or insert plainly),
 * "⏎" is Enter (smartEnter, else a plain newline), "⌫" is Backspace.
 */
function typeKeys(start: string, keys: string): string {
  let state: EditorState = stateFrom(start, [autoClosers]);
  const dispatch = (tr: { state: EditorState }) => (state = tr.state);
  for (const key of keys) {
    ensureSyntaxTree(state, state.doc.length, 5000);
    if (key === '⏎') {
      if (!smartEnter({ state, dispatch }))
        state = state.update(state.replaceSelection('\n')).state;
    } else if (key === '⌫') {
      if (!deleteEmptyPair({ state, dispatch }) && !deleteMarkupBackward({ state, dispatch })) {
        const pos = state.selection.main.head;
        state = state.update({
          changes: { from: pos - 1, to: pos },
          selection: EditorSelection.cursor(pos - 1),
        }).state;
      }
    } else {
      const spec = smartInput(state, key);
      state = state.update(spec ?? state.replaceSelection(key)).state;
    }
  }
  return marked(state);
}

describe('Enter in lists, tasks and quotes', () => {
  it('continues bullets, numbers and tasks', () => {
    expect(typeKeys('- one‸', '⏎')).toBe('- one\n- ‸');
    expect(typeKeys('1. one‸', '⏎')).toBe('1. one\n2. ‸');
    expect(typeKeys('- [x] done‸', '⏎')).toBe('- [x] done\n- [ ] ‸');
    expect(typeKeys('> quoted‸', '⏎')).toBe('> quoted\n> ‸');
  });

  it('leaves the list on an empty item, with no stray blank or spaces', () => {
    expect(typeKeys('- one\n- two‸', '⏎⏎')).toBe('- one\n- two\n‸');
    expect(typeKeys('- one‸', '⏎⏎')).toBe('- one\n‸');
  });

  it('moves an empty nested item up one level', () => {
    expect(typeKeys('- [x] milk\n  - [ ] oat‸', '⏎⏎')).toBe('- [x] milk\n  - [ ] oat\n- [ ] ‸');
    expect(typeKeys('- a\n  - b‸', '⏎⏎')).toBe('- a\n  - b\n- ‸');
  });

  it('leaves a quote on an empty quote line', () => {
    expect(typeKeys('> quoted‸', '⏎⏎')).toBe('> quoted\n‸');
    expect(typeKeys('> > deep‸', '⏎⏎')).toBe('> > deep\n>‸');
  });

  it('is a plain new line outside markup', () => {
    expect(typeKeys('plain‸', '⏎')).toBe('plain\n‸');
  });
});

describe('input rules', () => {
  it('turns "[] " into a task', () => {
    expect(typeKeys('‸', '[] Buy')).toBe('- [ ] Buy‸');
    expect(typeKeys('- ‸', '[x] Done')).toBe('- [x] Done‸');
    expect(typeKeys('> ‸', '[ ] Quoted')).toBe('> - [ ] Quoted‸');
  });

  it('closes a code fence on Enter', () => {
    expect(typeKeys('‸', '```js⏎')).toBe('```js\n‸\n```');
    expect(typeKeys('  ~~~‸', '⏎')).toBe('  ~~~\n  ‸\n  ~~~');
  });

  it('does not add a fence when closing an existing block', () => {
    expect(typeKeys('```\ncode\n```‸', '⏎')).toBe('```\ncode\n```\n‸');
  });

  it('keeps "---" a divider under a paragraph', () => {
    expect(typeKeys('Some text\n---‸', '⏎')).toBe('Some text\n\n---\n‸');
  });

  it('leaves "---" alone where it is already a divider or part of a table', () => {
    expect(typeKeys('Some text\n\n---‸', '⏎')).toBe('Some text\n\n---\n‸');
    expect(typeKeys('a | b\n---‸', '⏎')).toBe('a | b\n---\n‸');
    expect(typeKeys('- item\n---‸', '⏎')).toBe('- item\n---\n‸');
  });
});

describe('auto-close pairs', () => {
  it('closes brackets and steps over the closer', () => {
    expect(typeKeys('‸', '(a)')).toBe('(a)‸');
    expect(typeKeys('‸', '[a]')).toBe('[a]‸');
    expect(typeKeys('see ‸', '`x`')).toBe('see `x`‸');
  });

  it('writes links naturally', () => {
    expect(typeKeys('‸', '[docs](url) ok')).toBe('[docs](url) ok‸');
  });

  it('opens bold with two stars', () => {
    expect(typeKeys('a ‸', '**bold**')).toBe('a **bold**‸');
    expect(typeKeys('‸', '**bold**')).toBe('**bold**‸');
    expect(typeKeys('a ‸', '*em*')).toBe('a *em*‸');
  });

  it('keeps a "* " bullet a bullet', () => {
    expect(typeKeys('‸', '* item')).toBe('* item‸');
  });

  it('builds code fences without doubling backticks', () => {
    expect(typeKeys('‸', '```')).toBe('```‸');
  });

  it('does not close in the middle of words or before text', () => {
    expect(typeKeys('snake‸', '*case')).toBe('snake*case‸');
    expect(typeKeys('‸word', '(')).toBe('(‸word');
  });

  it('only steps over closers it inserted', () => {
    expect(typeKeys('f(‸)', ')')).toBe('f()‸)');
  });

  it('leaves $ alone until math rendering exists', () => {
    expect(typeKeys('costs ‸', '$5')).toBe('costs $5‸');
  });

  it('removes an empty pair with Backspace', () => {
    expect(typeKeys('‸', '(⌫')).toBe('‸');
    expect(typeKeys('a ‸', '`⌫')).toBe('a ‸');
  });
});

describe('wrapping a selection', () => {
  it('wraps with any pair character and keeps the selection', () => {
    expect(typeKeys('«word»', '*')).toBe('*«word»*');
    expect(typeKeys('«word»', '**')).toBe('**«word»**');
    expect(typeKeys('«x»', '$')).toBe('$«x»$');
    expect(typeKeys('«x»', '~~')).toBe('~~«x»~~');
    expect(typeKeys('«x»', '(')).toBe('(«x»)');
  });
});
