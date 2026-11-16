import { searchCommands } from './search';

const commands = [
  { label: 'Heading 1', keywords: ['title', 'h1'] },
  { label: 'Heading 2', keywords: ['title', 'h2'] },
  { label: 'Bulleted list', keywords: ['bullets', 'ul'] },
  { label: 'To-do list', keywords: ['task', 'todo'] },
  { label: 'Divider', keywords: ['horizontal rule', 'hr'] },
];

const labels = (query: string) => searchCommands(commands, query).map((m) => m.command.label);

describe('searchCommands', () => {
  it('keeps everything, in order, for an empty query', () => {
    expect(labels('')).toEqual(commands.map((c) => c.label));
  });

  it('ranks label start, exact keyword, later word, keyword start, then letters in order', () => {
    expect(labels('head')).toEqual(['Heading 1', 'Heading 2']);
    expect(labels('h2')).toEqual(['Heading 2']);
    expect(labels('list')).toEqual(['Bulleted list', 'To-do list']);
    expect(labels('task')).toEqual(['To-do list']);
    expect(labels('horiz')).toEqual(['Divider']);
    expect(labels('bltd')).toEqual(['Bulleted list']);
    expect(labels('qq')).toEqual([]);
  });

  it('ignores case, spaces and hyphens in keywords', () => {
    expect(labels('TODO')).toEqual(['To-do list']);
    expect(labels('to-do')).toEqual(['To-do list']);
    expect(labels('horizontal rule')).toEqual(['Divider']);
  });

  it('returns label ranges to highlight', () => {
    expect(searchCommands(commands, 'head')[0]!.ranges).toEqual([[0, 4]]);
    expect(searchCommands(commands, 'list')[0]!.ranges).toEqual([[9, 13]]);
    expect(searchCommands(commands, 'bltd')[0]!.ranges).toEqual([
      [0, 1],
      [2, 3],
      [5, 6],
      [7, 8],
    ]);
    expect(searchCommands(commands, 'h2')[0]!.ranges).toEqual([]);
  });
});
