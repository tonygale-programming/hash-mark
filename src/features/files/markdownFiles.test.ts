import {
  downloadMarkdown,
  isMarkdownFileName,
  markdownFileName,
  normalizeText,
  openSummary,
  readMarkdownFile,
} from './markdownFiles';

describe('isMarkdownFileName', () => {
  it.each(['notes.md', 'README', 'a.MARKDOWN', 'log.txt', 'x.mdown'])('accepts %s', (name) => {
    expect(isMarkdownFileName(name)).toBe(true);
  });

  it.each(['photo.png', 'doc.pdf', 'data.json', 'app.exe'])('rejects %s', (name) => {
    expect(isMarkdownFileName(name)).toBe(false);
  });
});

describe('readMarkdownFile', () => {
  it('reads text and normalizes it', async () => {
    const file = new File([`${String.fromCharCode(0xfeff)}# Hi\r\nthere\r`], 'hi.md', {
      type: 'text/markdown',
    });
    expect(await readMarkdownFile(file)).toEqual({
      ok: true,
      name: 'hi.md',
      text: '# Hi\nthere\n',
    });
  });

  it('rejects other file types', async () => {
    const result = await readMarkdownFile(new File(['x'], 'cat.png', { type: 'image/png' }));
    expect(result).toMatchObject({ ok: false, reason: 'not a Markdown or text file' });
  });

  it('rejects binary content behind a text extension', async () => {
    const result = await readMarkdownFile(new File(['a\u0000b'], 'fake.md'));
    expect(result).toMatchObject({ ok: false, reason: 'not a Markdown or text file' });
  });

  it('rejects files over 10 MB', async () => {
    const file = new File(['x'], 'big.md');
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    expect(await readMarkdownFile(file)).toMatchObject({ ok: false, reason: 'larger than 10 MB' });
  });
});

describe('normalizeText', () => {
  it('keeps LF text as is', () => {
    expect(normalizeText('a\nb')).toBe('a\nb');
  });
});

describe('markdownFileName', () => {
  it.each([
    ['Trip plan', 'Trip plan.md'],
    ['Q3: plan / notes?', 'Q3- plan - notes-.md'],
    ['  ..hidden.  ', 'hidden.md'],
    ['', 'Untitled.md'],
    ['a'.repeat(120), `${'a'.repeat(80)}.md`],
  ])('%j → %j', (title, name) => {
    expect(markdownFileName(title)).toBe(name);
  });
});

describe('downloadMarkdown', () => {
  it('clicks a temporary download link and releases the blob', () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:fake');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const clicks: HTMLAnchorElement[] = [];
    const spy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this);
    });

    downloadMarkdown('Note.md', '# Note');

    expect(clicks[0]?.download).toBe('Note.md');
    expect(clicks[0]?.href).toBe('blob:fake');
    expect(document.querySelector('a[download]')).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith('blob:fake');
    spy.mockRestore();
    vi.useRealTimers();
  });
});

describe('openSummary', () => {
  const ok = (name: string) => ({ ok: true as const, name, text: '' });
  const bad = (name: string) => ({
    ok: false as const,
    name,
    reason: 'not a Markdown or text file',
  });

  it('describes single and multiple opens', () => {
    expect(openSummary([ok('a.md')], 'Alpha')).toBe('Opened “Alpha”.');
    expect(openSummary([ok('a.md'), ok('b.md')])).toBe('Opened 2 files.');
  });

  it('mentions skipped files', () => {
    expect(openSummary([ok('a.md'), bad('cat.png')], 'Alpha')).toBe(
      'Opened “Alpha”. Couldn’t open “cat.png”: not a Markdown or text file.',
    );
    expect(openSummary([bad('a.png'), bad('b.png')])).toBe(
      'Couldn’t open 2 files: not Markdown or text, or too large.',
    );
  });
});
