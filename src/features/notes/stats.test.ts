import { countWords, documentStats } from './stats';
import welcome from './welcome.md?raw';

describe('documentStats', () => {
  it('counts an empty note as nothing', () => {
    expect(documentStats('')).toEqual({ words: 0, readMinutes: 0, headings: 0 });
    expect(documentStats('\n  \n')).toEqual({ words: 0, readMinutes: 0, headings: 0 });
  });

  it('counts words without Markdown syntax', () => {
    expect(documentStats('Some **bold** and *em* and `code` and ~~gone~~.').words).toBe(8);
    expect(documentStats('- [x] Buy milk\n- [ ] Call Sam\n> Quoted words').words).toBe(6);
    expect(documentStats('1. First step\n2) Second step').words).toBe(4);
  });

  it('counts link text but not URLs', () => {
    expect(documentStats('Read [the guide](https://example.com/a/b) today').words).toBe(4);
    expect(documentStats('![A cat](cat.png)').words).toBe(2);
    expect(documentStats('See [docs][ref].\n\n[ref]: https://example.com').words).toBe(2);
  });

  it('counts code inside fences, but not the fences', () => {
    expect(documentStats('```js\nconst total = 1;\n```').words).toBe(3);
  });

  it('ignores table syntax', () => {
    expect(documentStats('| Mode | Use |\n| --- | :-: |\n| Write | Notes |').words).toBe(4);
  });

  it('counts ATX and setext headings outside code', () => {
    const md = [
      '# One',
      '## Two ##',
      'Three',
      '=====',
      'Four',
      '---',
      '',
      '---',
      '```',
      '# not a heading',
      '```',
      '#hashtag is text',
      '- item',
      '---',
    ].join('\n');
    expect(documentStats(md).headings).toBe(4);
  });

  it('rounds reading time up to whole minutes at 200 words per minute', () => {
    expect(documentStats('word').readMinutes).toBe(1);
    expect(documentStats('word '.repeat(200)).readMinutes).toBe(1);
    expect(documentStats('word '.repeat(201)).readMinutes).toBe(2);
  });

  it('handles the welcome note', () => {
    // Counted by hand: 78 prose words + 2 in the code block ("console.log('Hello," and "Markdown');").
    expect(documentStats(welcome)).toEqual({ words: 80, readMinutes: 1, headings: 4 });
  });

  it('handles an unclosed fence by counting the rest as code', () => {
    expect(documentStats('Intro\n```\ncode here\n# still code').headings).toBe(0);
  });
});

describe('countWords', () => {
  it('handles contractions, numbers and hyphens', () => {
    expect(countWords("It's 2026 and well-known")).toBe(4);
  });

  it('ignores lone punctuation', () => {
    expect(countWords('Yes — no , maybe')).toBe(3);
  });

  it('segments languages without spaces', () => {
    expect(countWords('日本語の文章です')).toBeGreaterThan(1);
  });
});
