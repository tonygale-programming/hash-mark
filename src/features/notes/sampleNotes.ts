/** Placeholder notes for the M0 shell. Replaced by the Dexie store in M1. */
export type NoteSummary = {
  id: string;
  title: string;
  edited: string;
  stats: { words: number; readMinutes: number; headings: number };
};

export const SAMPLE_NOTES: NoteSummary[] = [
  {
    id: 'welcome',
    title: 'Welcome to Hash Mark',
    edited: 'Edited 2 min ago',
    stats: { words: 186, readMinutes: 1, headings: 3 },
  },
  {
    id: 'meeting',
    title: 'Weekly sync notes',
    edited: 'Edited yesterday',
    stats: { words: 412, readMinutes: 2, headings: 5 },
  },
  {
    id: 'readme',
    title: 'Project README',
    edited: 'Edited 3 days ago',
    stats: { words: 958, readMinutes: 5, headings: 9 },
  },
  {
    id: 'reading',
    title: 'Reading list',
    edited: 'Edited last week',
    stats: { words: 74, readMinutes: 1, headings: 1 },
  },
];

export function filterNotes(notes: NoteSummary[], query: string) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return notes;
  return notes.filter((note) => note.title.toLocaleLowerCase().includes(needle));
}
