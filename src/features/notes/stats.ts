export type DocStats = { words: number; readMinutes: number; headings: number };

/** Typical silent reading speed for prose. */
export const WORDS_PER_MINUTE = 200;

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const ATX_HEADING = /^ {0,3}#{1,6}(?:\s|$)/;
const SETEXT_UNDERLINE = /^ {0,3}(?:=+|-+)\s*$/;
const THEMATIC_BREAK = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const TABLE_DELIMITER = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)+\|?\s*$/;
const LINK_DEFINITION = /^ {0,3}\[[^\]^][^\]]*\]:\s*\S/;
const LIST_OR_QUOTE = /^\s*(?:[-*+]|\d+[.)])\s|^\s*>/;

/**
 * Words, reading time and headings for the status bar. A line scanner rather than a full
 * Markdown parse, so it stays cheap enough to run on every edit and out of the parser bundle.
 * Code inside fences counts as words; Markdown syntax, URLs of links and images do not.
 */
export function documentStats(markdown: string): DocStats {
  let headings = 0;
  let fence: string | null = null;
  let afterParagraph = false;
  const text: string[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = FENCE.exec(line);
    if (fence !== null) {
      const marker = fenceMatch?.[1];
      if (
        marker &&
        marker[0] === fence[0] &&
        marker.length >= fence.length &&
        !line.slice(line.indexOf(marker) + marker.length).trim()
      ) {
        fence = null;
      } else {
        text.push(line);
      }
      afterParagraph = false;
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1]!;
      afterParagraph = false;
      continue;
    }
    if (!line.trim()) {
      afterParagraph = false;
      continue;
    }
    if (ATX_HEADING.test(line)) {
      headings++;
      text.push(line.replace(/^ {0,3}#{1,6}\s*/, '').replace(/\s+#+\s*$/, ''));
      afterParagraph = false;
      continue;
    }
    if (afterParagraph && SETEXT_UNDERLINE.test(line)) {
      headings++;
      afterParagraph = false;
      continue;
    }
    if (THEMATIC_BREAK.test(line) || TABLE_DELIMITER.test(line) || LINK_DEFINITION.test(line)) {
      afterParagraph = false;
      continue;
    }
    afterParagraph = !LIST_OR_QUOTE.test(line) && !line.includes('|');
    text.push(stripBlockMarkers(line));
  }

  const words = countWords(stripInline(text.join('\n')));
  return { words, readMinutes: Math.ceil(words / WORDS_PER_MINUTE), headings };
}

function stripBlockMarkers(line: string): string {
  return line
    .replace(/^(\s*>)+/, '')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, '')
    .replace(/^\[\^[^\]]+\]:\s*/, '');
}

function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/<[^>\n]+>/g, ' ')
    .replace(/[*~`|]/g, ' ');
}

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'word' })
    : null;

/** Scripts written without spaces between words. */
const UNSPACED_SCRIPT =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;
const HAS_WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Counts like word processors do: whitespace-separated tokens with a letter or digit
 * ("well-known" and "it's" are one word). Tokens in scripts without spaces are segmented.
 */
export function countWords(text: string): number {
  let count = 0;
  for (const token of text.split(/\s+/)) {
    if (!HAS_WORD_CHAR.test(token)) continue;
    if (segmenter && UNSPACED_SCRIPT.test(token)) {
      for (const segment of segmenter.segment(token)) if (segment.isWordLike) count++;
    } else {
      count++;
    }
  }
  return count;
}
