import {
  BOLD,
  INLINE_CODE,
  ITALIC,
  STRIKETHROUGH,
  isInlineActive,
  toggleInline,
  toggleLink,
} from './inline';
import {
  indentList,
  parseLine,
  toggleCodeBlock,
  toggleHeading,
  toggleList,
  toggleQuote,
  toggleTask,
} from './lines';
import { apply, run, stateFrom } from './testing';

describe('inline toggles', () => {
  const bold = toggleInline(BOLD);

  it('wraps the selection and keeps it on the text', () => {
    expect(run(bold, 'Say «hello» now')).toBe('Say **«hello»** now');
    expect(run(toggleInline(ITALIC), '«word»')).toBe('*«word»*');
    expect(run(toggleInline(STRIKETHROUGH), '«gone»')).toBe('~~«gone»~~');
    expect(run(toggleInline(INLINE_CODE), '«x»')).toBe('`«x»`');
  });

  it('trims spaces at the edges of the selection', () => {
    expect(run(bold, 'Say« hello »now')).toBe('Say **«hello»** now');
  });

  it('removes the markers when applied again', () => {
    expect(run(bold, 'Say **«hello»** now')).toBe('Say «hello» now');
    expect(run(bold, 'Say «**hello**» now')).toBe('Say «hello» now');
    expect(run(bold, 'Say **hel‸lo** now')).toBe('Say hel‸lo now');
    expect(run(toggleInline(INLINE_CODE), '`co‸de`')).toBe('co‸de');
  });

  it('tells bold and italic apart', () => {
    expect(run(toggleInline(ITALIC), '**«bold»**')).toBe('***«bold»***');
    expect(run(bold, '*«em»*')).toBe('***«em»***');
  });

  it('wraps the word under the cursor, or inserts an empty pair', () => {
    expect(run(bold, 'hel‸lo')).toBe('**hel‸lo**');
    expect(run(bold, 'hello ‸')).toBe('hello **‸**');
  });

  it('handles several selections', () => {
    expect(run(bold, '«a» and «b»')).toBe('**«a»** and **«b»**');
  });

  it('reports whether the selection is formatted', () => {
    expect(isInlineActive(stateFrom('**bo‸ld**'), BOLD)).toBe(true);
    expect(isInlineActive(stateFrom('bo‸ld'), BOLD)).toBe(false);
  });
});

describe('link', () => {
  it('turns text into a link with the URL ready to type', () => {
    expect(run(toggleLink, 'See «docs» here')).toBe('See [docs](«url») here');
  });

  it('turns a selected URL into a link with the cursor in the text', () => {
    expect(run(toggleLink, '«https://example.com»')).toBe('[‸](https://example.com)');
  });

  it('inserts an empty link at a cursor', () => {
    expect(run(toggleLink, 'x ‸')).toBe('x [‸](url)');
  });

  it('removes a link and keeps its text', () => {
    expect(run(toggleLink, 'See [do‸cs](https://a.b) here')).toBe('See «docs» here');
  });
});

describe('parseLine', () => {
  it('splits prefixes from content', () => {
    expect(parseLine('> - [x] Done')).toMatchObject({
      quote: '> ',
      list: '-',
      task: 'x',
      content: 'Done',
    });
    expect(parseLine('## Title')).toMatchObject({ heading: 2, content: 'Title' });
    expect(parseLine('12. Twelve')).toMatchObject({ list: '12.', content: 'Twelve' });
  });

  it('does not mistake text for markers', () => {
    expect(parseLine('#hashtag')).toMatchObject({ heading: 0, content: '#hashtag' });
    expect(parseLine('**bold**')).toMatchObject({ list: null, content: '**bold**' });
    expect(parseLine('1.5 million')).toMatchObject({ list: null, content: '1.5 million' });
    expect(parseLine('---')).toMatchObject({ list: null, content: '---' });
    expect(parseLine('[x] not a task')).toMatchObject({ task: null, content: '[x] not a task' });
  });
});

describe('headings', () => {
  it('sets, changes and removes a level, keeping the cursor in the text', () => {
    expect(run(toggleHeading(1), 'Ti‸tle')).toBe('# Ti‸tle');
    expect(run(toggleHeading(2), '# Ti‸tle')).toBe('## Ti‸tle');
    expect(run(toggleHeading(2), '## Ti‸tle')).toBe('Ti‸tle');
  });

  it('drops list markers and keeps a quote', () => {
    expect(run(toggleHeading(3), '- [ ] It‸em')).toBe('### It‸em');
    expect(run(toggleHeading(1), '> Quo‸te')).toBe('> # Quo‸te');
  });

  it('puts a cursor at the line start after the new marker', () => {
    expect(run(toggleHeading(1), '‸')).toBe('# ‸');
  });
});

describe('lists', () => {
  it('makes and removes bulleted lists over several lines, skipping blank ones', () => {
    expect(run(toggleList('bullet'), '«one\n\ntwo»')).toBe('- «one\n\n- two»');
    expect(run(toggleList('bullet'), '«- one\n- two»')).toBe('«one\ntwo»');
  });

  it('numbers ordered lists from 1', () => {
    expect(run(toggleList('ordered'), '«a\nb\nc»')).toBe('1. «a\n2. b\n3. c»');
  });

  it('converts between list kinds', () => {
    expect(run(toggleList('task'), '- it‸em')).toBe('- [ ] it‸em');
    expect(run(toggleList('ordered'), '- [x] it‸em')).toBe('1. it‸em');
    expect(run(toggleList('bullet'), '# Ti‸tle')).toBe('- Ti‸tle');
  });

  it('keeps quotes and indentation', () => {
    expect(run(toggleList('bullet'), '> it‸em')).toBe('> - it‸em');
    expect(run(toggleList('bullet'), '  it‸em')).toBe('  - it‸em');
  });

  it('starts a list on an empty line', () => {
    expect(run(toggleList('bullet'), '‸')).toBe('- ‸');
  });
});

describe('quote', () => {
  it('quotes and unquotes lines', () => {
    expect(run(toggleQuote, '«a\nb»')).toBe('> «a\n> b»');
    expect(run(toggleQuote, '«> a\n> b»')).toBe('«a\nb»');
  });
});

describe('toggle task', () => {
  it('checks and unchecks', () => {
    expect(run(toggleTask, '- [ ] Buy mi‸lk')).toBe('- [x] Buy mi‸lk');
    expect(run(toggleTask, '- [x] Buy mi‸lk')).toBe('- [ ] Buy mi‸lk');
  });

  it('turns list items and plain lines into tasks', () => {
    expect(run(toggleTask, '* Buy mi‸lk')).toBe('* [ ] Buy mi‸lk');
    expect(run(toggleTask, '1. Step‸')).toBe('- [ ] Step‸');
    expect(run(toggleTask, 'Buy mi‸lk')).toBe('- [ ] Buy mi‸lk');
  });
});

describe('indent and outdent', () => {
  it('indents list items by their marker width', () => {
    expect(run(indentList(1), '- a\n- b‸')).toBe('- a\n  - b‸');
    expect(run(indentList(1), '1. a\n2. b‸')).toBe('1. a\n   2. b‸');
    expect(run(indentList(-1), '- a\n  - b‸')).toBe('- a\n- b‸');
  });

  it('leaves Tab alone outside lists, so focus can move on', () => {
    expect(apply(indentList(1), 'plain‸').handled).toBe(false);
    expect(apply(indentList(-1), '- top‸').handled).toBe(true);
  });
});

describe('code block', () => {
  it('fences the selected lines', () => {
    expect(run(toggleCodeBlock, '«let a\nlet b»')).toBe('```\n«let a\nlet b»\n```');
  });

  it('inserts an empty block on an empty line', () => {
    expect(run(toggleCodeBlock, 'Intro\n‸')).toBe('Intro\n```\n‸\n```');
  });

  it('removes the fences of the block the cursor is in', () => {
    expect(run(toggleCodeBlock, 'Intro\n```js\nlet ‸a\n```\nEnd')).toBe('Intro\nlet ‸a\nEnd');
  });
});
