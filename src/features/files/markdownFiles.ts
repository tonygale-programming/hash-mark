export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set(['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'mdwn', 'txt', 'text']);

/** Value for <input type="file" accept>. Files without an extension (README) are picked via drag & drop. */
export const ACCEPT = [
  ...[...TEXT_EXTENSIONS].map((ext) => `.${ext}`),
  'text/markdown',
  'text/plain',
].join(',');

function extensionOf(name: string): string | null {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : null;
}

/** Markdown/text by extension; extension-less names (README, CHANGELOG) are allowed too. */
export function isMarkdownFileName(name: string): boolean {
  const ext = extensionOf(name);
  return ext === null || TEXT_EXTENSIONS.has(ext);
}

export type ReadResult =
  { ok: true; name: string; text: string } | { ok: false; name: string; reason: string };

export async function readMarkdownFile(file: File): Promise<ReadResult> {
  const { name } = file;
  if (!isMarkdownFileName(name)) return { ok: false, name, reason: 'not a Markdown or text file' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, name, reason: 'larger than 10 MB' };
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, name, reason: 'the file could not be read' };
  }
  if (text.includes('\u0000')) return { ok: false, name, reason: 'not a Markdown or text file' };
  return { ok: true, name, text: normalizeText(text) };
}

/** Strips a byte-order mark and normalizes line endings to \n. */
export function normalizeText(text: string): string {
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return withoutBom.replace(/\r\n?/g, '\n');
}

/** "Trip plan: day 1" -> "Trip plan- day 1.md". Safe on Windows, macOS and Linux. */
export function markdownFileName(title: string): string {
  const safe = [...title]
    .map((ch) => (ch.charCodeAt(0) < 32 || '\\/:*?"<>|'.includes(ch) ? '-' : ch))
    .join('');
  const base = safe
    .replace(/\s+/g, ' ')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 80)
    .trim();
  return `${base || 'Untitled'}.md`;
}

/** Saves text as a .md file through a temporary object URL. */
export function downloadMarkdown(fileName: string, markdown: string) {
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One sentence summarising an open: what opened and what was skipped. */
export function openSummary(results: ReadResult[], firstTitle?: string): string {
  const opened = results.filter((r) => r.ok);
  const failed = results.filter((r): r is Extract<ReadResult, { ok: false }> => !r.ok);
  const parts: string[] = [];
  if (opened.length === 1) parts.push(`Opened “${firstTitle ?? opened[0]!.name}”.`);
  else if (opened.length > 1) parts.push(`Opened ${opened.length} files.`);
  if (failed.length === 1) parts.push(`Couldn’t open “${failed[0]!.name}”: ${failed[0]!.reason}.`);
  else if (failed.length > 1)
    parts.push(`Couldn’t open ${failed.length} files: not Markdown or text, or too large.`);
  return parts.join(' ');
}
