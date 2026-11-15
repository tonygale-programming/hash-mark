import { act, render } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import { forgetEditorState } from './editorStateCache';
import { MarkdownEditor } from './MarkdownEditor';

const DOC = [
  '# Title',
  '',
  'Some **bold**, *em*, ~~gone~~ and `code`.',
  '',
  '> quoted',
  '',
  '- [x] done',
  '',
  '```js',
  'let a = 1;',
  '```',
].join('\n');

function viewOf(container: HTMLElement) {
  const content = container.querySelector<HTMLElement>('.cm-content');
  if (!content) throw new Error('no editor');
  const view = EditorView.findFromDOM(content);
  if (!view) throw new Error('no view');
  return view;
}

beforeEach(() => {
  forgetEditorState('a');
  forgetEditorState('b');
});

describe('MarkdownEditor', () => {
  it('renders the document as an accessible textbox', () => {
    const { getByRole } = render(
      <MarkdownEditor noteId="a" initialDoc={DOC} onChange={() => {}} />,
    );
    expect(getByRole('textbox', { name: 'Note' })).toHaveTextContent('# Title');
  });

  it('styles Markdown from the syntax tree, keeping markers visible', () => {
    const { container } = render(
      <MarkdownEditor noteId="a" initialDoc={DOC} onChange={() => {}} />,
    );
    const q = (selector: string) => container.querySelector(selector)?.textContent;
    expect(q('.cm-md-h1')).toBe('# Title');
    expect(q('.cm-md-strong')).toBe('**bold**');
    expect(q('.cm-md-em')).toBe('*em*');
    expect(q('.cm-md-strike')).toBe('~~gone~~');
    expect(q('.cm-md-code')).toBe('`code`');
    expect(q('.cm-md-quote')).toBe('> quoted');
    expect(container.querySelectorAll('.cm-md-codeblock')).toHaveLength(3);
    expect(q('.cm-md-codeblock-first')).toBe('```js');
    const marks = [...container.querySelectorAll('.cm-md-mark')].map((el) => el.textContent);
    expect(marks).toEqual(expect.arrayContaining(['#', '**', '~~', '`', '>', '-', '[x]', '```']));
  });

  it('reports edits with the note id', () => {
    const onChange = vi.fn();
    const { container } = render(<MarkdownEditor noteId="a" initialDoc="Hi" onChange={onChange} />);
    act(() => viewOf(container).dispatch({ changes: { from: 2, insert: ' there' } }));
    expect(onChange).toHaveBeenCalledWith('a', 'Hi there');
  });

  it('keeps each note’s text and cursor when switching notes', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <MarkdownEditor noteId="a" initialDoc="Alpha" onChange={onChange} />,
    );
    act(() =>
      viewOf(container).dispatch({ changes: { from: 5, insert: '!' }, selection: { anchor: 3 } }),
    );

    rerender(<MarkdownEditor noteId="b" initialDoc="Beta" onChange={onChange} />);
    expect(viewOf(container).state.doc.toString()).toBe('Beta');

    // The stored doc for "a" is stale ("Alpha"); the editor state wins.
    rerender(<MarkdownEditor noteId="a" initialDoc="Alpha" onChange={onChange} />);
    expect(viewOf(container).state.doc.toString()).toBe('Alpha!');
    expect(viewOf(container).state.selection.main.head).toBe(3);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('binds registry shortcuts instead of the clashing defaults', async () => {
    const { keymap } = await import('@codemirror/view');
    const { container } = render(<MarkdownEditor noteId="a" initialDoc="" onChange={() => {}} />);
    const bindings = viewOf(container).state.facet(keymap).flat();
    const keys = bindings.map((binding) => binding.key);
    expect(keys).not.toContain('Mod-/');
    expect(keys).not.toContain('Alt-A');
    // Mod-i and Mod-Enter belong to the registry (Italic, Toggle task), once each.
    expect(keys.filter((k) => k === 'Mod-i')).toHaveLength(1);
    expect(keys.filter((k) => k === 'Mod-Enter')).toHaveLength(1);
    expect(keys).toContain('Mod-z');
  });
});
