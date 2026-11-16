import { renderMarkdown } from './renderMarkdown';

function dom(markdown: string) {
  const host = document.createElement('div');
  host.innerHTML = renderMarkdown(markdown);
  return host;
}

describe('renderMarkdown', () => {
  it('renders CommonMark basics', () => {
    const html = dom('# Title\n\nSome **bold** and *em* and `code`.\n\n> quote\n\n---');
    expect(html.querySelector('h1')?.textContent).toBe('Title');
    expect(html.querySelector('strong')?.textContent).toBe('bold');
    expect(html.querySelector('em')?.textContent).toBe('em');
    expect(html.querySelector('code')?.textContent).toBe('code');
    expect(html.querySelector('blockquote')?.textContent?.trim()).toBe('quote');
    expect(html.querySelector('hr')).not.toBeNull();
  });

  it('renders GFM tables, strikethrough, tasks and autolinks', () => {
    const html = dom(
      [
        '| A | B |',
        '| - | - |',
        '| 1 | 2 |',
        '',
        '~~gone~~ www.example.com',
        '',
        '- [x] done',
        '- [ ] todo',
      ].join('\n'),
    );
    expect(html.querySelector('.table-wrap > table td')?.textContent).toBe('1');
    expect(html.querySelector('del')?.textContent).toBe('gone');
    expect(html.querySelector('a')?.getAttribute('href')).toBe('http://www.example.com');
    const boxes = [...html.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    expect(boxes.map((box) => box.checked)).toEqual([true, false]);
    expect(boxes.every((box) => box.disabled)).toBe(true);
  });

  it('keeps the code block language class', () => {
    const html = dom('```js\nlet a = 1;\n```');
    expect(html.querySelector('pre > code')?.className).toBe('language-js');
  });

  it('opens external links in a new tab safely', () => {
    const link = dom('[Docs](https://example.com)').querySelector('a');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('loads images lazily without a referrer', () => {
    const img = dom('![Logo](https://example.com/a.png)').querySelector('img');
    expect(img?.getAttribute('alt')).toBe('Logo');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  describe('callouts (GitHub alerts)', () => {
    it('turns "> [!NOTE]" into a titled callout', () => {
      const html = dom('> [!NOTE]\n> Bring a jacket');
      const callout = html.querySelector('.callout');
      expect(callout?.className).toBe('callout callout--note');
      expect(callout?.querySelector('.callout__title')?.textContent).toBe('Note');
      expect(callout?.textContent).not.toContain('[!NOTE]');
      expect(callout?.textContent).toContain('Bring a jacket');
      expect(html.querySelector('blockquote')).toBeNull();
    });

    it('knows the five GitHub kinds, in any case', () => {
      const titles = ['TIP', 'important', 'Warning', 'CAUTION'].map(
        (kind) => dom(`> [!${kind}]\n> Text`).querySelector('.callout__title')?.textContent,
      );
      expect(titles).toEqual(['Tip', 'Important', 'Warning', 'Caution']);
    });

    it('leaves other quotes alone', () => {
      expect(dom('> [!OTHER]\n> Text').querySelector('.callout')).toBeNull();
      expect(dom('> Just a quote').querySelector('blockquote')).not.toBeNull();
    });
  });

  describe('sanitizing', () => {
    it('drops raw HTML, including scripts and event handlers', () => {
      const html = renderMarkdown(
        'Hi <script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n<b>bold</b>',
      );
      expect(html).not.toMatch(/<script|onerror|<b>/i);
    });

    it('removes javascript: and data: link targets', () => {
      const html = dom('[a](javascript:alert(1)) [b](data:text/html,hi)');
      const hrefs = [...html.querySelectorAll('a')].map((a) => a.getAttribute('href'));
      expect(hrefs).toEqual([null, null]);
    });

    it('prefixes footnote ids once, matching their links', () => {
      const html = dom('Note[^1]\n\n[^1]: Footnote');
      const ref = html.querySelector('a[data-footnote-ref]');
      expect(ref?.getAttribute('href')).toBe('#user-content-fn-1');
      expect(html.querySelector('#user-content-fn-1')).not.toBeNull();
      expect(ref?.id).toBe('user-content-fnref-1');
    });

    it('drops ids and classes not in the allow list', () => {
      const html = renderMarkdown('```js" onclick="x\ncode\n```');
      expect(html).not.toContain('onclick');
    });
  });
});
