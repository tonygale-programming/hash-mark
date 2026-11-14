import { filterNotes, SAMPLE_NOTES } from './sampleNotes';

describe('filterNotes', () => {
  it('returns all notes for an empty query', () => {
    expect(filterNotes(SAMPLE_NOTES, '  ')).toHaveLength(SAMPLE_NOTES.length);
  });

  it('matches titles case-insensitively', () => {
    expect(filterNotes(SAMPLE_NOTES, 'readme').map((note) => note.id)).toEqual(['readme']);
  });

  it('returns nothing when no title matches', () => {
    expect(filterNotes(SAMPLE_NOTES, 'zzz')).toEqual([]);
  });
});
