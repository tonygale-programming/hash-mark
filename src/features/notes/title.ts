export const UNTITLED = 'Untitled';
const MAX_LENGTH = 100;

/** Plain-text title from the first line with text: Markdown markers and inline syntax removed. */
export function deriveTitle(markdown: string): string {
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^(```|~~~|---+$|\*\*\*+$|___+$)/.test(line)) continue;
    const text = stripInline(stripBlockMarkers(line));
    if (text)
      return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1).trimEnd()}…` : text;
  }
  return UNTITLED;
}

function stripBlockMarkers(line: string): string {
  return line
    .replace(/^(>\s*)+/, '')
    .replace(/^#{1,6}(\s+|$)/, '')
    .replace(/^([-*+]|\d+[.)])\s+/, '')
    .replace(/^\[[ xX]\]\s+/, '')
    .replace(/\s+#+\s*$/, '');
}

function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|~~|==)(.+?)\1/g, '$2')
    .replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, '$1$2')
    .replace(/`+([^`]*)`+/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
