/** What a search needs from a command (editor and app commands both have it). */
type Searchable = { label: string; keywords: string[] };

export type CommandMatch<T extends Searchable> = {
  command: T;
  /** Character ranges of the label that matched, as [from, to] pairs, for highlighting. */
  ranges: [number, number][];
};

const normalize = (text: string) => text.toLowerCase().replace(/[\s-]+/g, '');

/** Letters of `query` in order inside `label` (spaces ignored); null if they are not all there. */
function subsequence(label: string, query: string): [number, number][] | null {
  const lower = label.toLowerCase();
  const ranges: [number, number][] = [];
  let at = 0;
  for (const ch of query) {
    const found = lower.indexOf(ch, at);
    if (found < 0) return null;
    const last = ranges[ranges.length - 1];
    if (last && last[1] === found) last[1] = found + 1;
    else ranges.push([found, found + 1]);
    at = found + 1;
  }
  return ranges;
}

/** Scores one command; higher is better, null means no match. */
function score<T extends Searchable>(
  command: T,
  query: string,
): (CommandMatch<T> & { score: number }) | null {
  const label = command.label.toLowerCase();
  const q = query.toLowerCase().trim();
  const keywords = command.keywords.map(normalize);
  const nq = normalize(q);
  if (label.startsWith(q)) return { command, ranges: [[0, q.length]], score: 100 };
  if (keywords.includes(nq)) return { command, ranges: [], score: 90 };
  let offset = 0;
  for (const word of label.split(' ')) {
    if (offset > 0 && word.startsWith(q)) {
      return { command, ranges: [[offset, offset + q.length]], score: 80 };
    }
    offset += word.length + 1;
  }
  if (keywords.some((k) => k.startsWith(nq))) return { command, ranges: [], score: 70 };
  const loose = subsequence(command.label, nq);
  if (loose) return { command, ranges: loose, score: 50 - loose.length };
  return null;
}

/**
 * Filters and ranks commands for the slash menu (and later the command palette): label start, exact
 * keyword ("h2", "hr"), start of a later word ("list"), keyword start, then letters in order
 * ("bll" → Bulleted list). Ties keep the given order; an empty query keeps everything.
 */
export function searchCommands<T extends Searchable>(
  commands: T[],
  query: string,
): CommandMatch<T>[] {
  if (!query.trim()) return commands.map((command) => ({ command, ranges: [] }));
  return commands
    .map((command, index) => ({ match: score(command, query), index }))
    .filter((entry) => entry.match !== null)
    .sort((a, b) => b.match!.score - a.match!.score || a.index - b.index)
    .map(({ match }) => ({ command: match!.command, ranges: match!.ranges }));
}
