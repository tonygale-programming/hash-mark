import { editedLabel } from './editedLabel';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const now = new Date(2026, 10, 15, 14, 0).getTime(); // Nov 15 2026, 14:00 local

describe('editedLabel', () => {
  it('uses minutes and hours today', () => {
    expect(editedLabel(now - 10_000, now)).toBe('Edited just now');
    expect(editedLabel(now - 2 * MINUTE, now)).toBe('Edited 2 min ago');
    expect(editedLabel(now - 3 * HOUR, now)).toBe('Edited 3 h ago');
  });

  it('uses calendar days for older edits', () => {
    expect(editedLabel(new Date(2026, 10, 14, 23, 0).getTime(), now)).toBe('Edited yesterday');
    expect(editedLabel(new Date(2026, 10, 12, 9, 0).getTime(), now)).toBe('Edited 3 days ago');
  });

  it('shows a date after a week, with the year only when it differs', () => {
    expect(editedLabel(new Date(2026, 10, 3).getTime(), now)).toBe('Edited Nov 3');
    expect(editedLabel(new Date(2025, 11, 24).getTime(), now)).toBe('Edited Dec 24, 2025');
  });

  it('treats future times as just now', () => {
    expect(editedLabel(now + 5 * MINUTE, now)).toBe('Edited just now');
  });
});
