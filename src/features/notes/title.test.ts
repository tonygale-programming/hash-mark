import { deriveTitle } from './title';

describe('deriveTitle', () => {
  it.each([
    ['# Hello world', 'Hello world'],
    ['### Closed heading ###', 'Closed heading'],
    ['\n\n  Plain first line\nsecond', 'Plain first line'],
    ['- [ ] Buy milk', 'Buy milk'],
    ['1. First step', 'First step'],
    ['> Quoted *idea*', 'Quoted idea'],
    ['**Bold** and `code` and ~~gone~~', 'Bold and code and gone'],
    ['[Docs](https://example.com) for ![logo](a.png)', 'Docs for logo'],
    ['snake_case_name stays', 'snake_case_name stays'],
    ['```js\nconsole.log(1)\n```', 'console.log(1)'],
    ['---\n# After rule', 'After rule'],
  ])('%j → %j', (markdown, title) => {
    expect(deriveTitle(markdown)).toBe(title);
  });

  it('falls back to Untitled', () => {
    expect(deriveTitle('')).toBe('Untitled');
    expect(deriveTitle('#   \n\n')).toBe('Untitled');
  });

  it('caps long titles', () => {
    const title = deriveTitle(`# ${'word '.repeat(50)}`);
    expect(title.length).toBeLessThanOrEqual(100);
    expect(title.endsWith('…')).toBe(true);
  });
});
