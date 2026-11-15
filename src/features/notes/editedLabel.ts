const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function startOfDay(time: number) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** "Edited 2 min ago", "Edited yesterday", "Edited Nov 3". */
export function editedLabel(updatedAt: number, now = Date.now()): string {
  const diff = Math.max(0, now - updatedAt);
  if (diff < MINUTE) return 'Edited just now';
  if (diff < HOUR) return `Edited ${Math.floor(diff / MINUTE)} min ago`;

  const days = Math.round((startOfDay(now) - startOfDay(updatedAt)) / DAY);
  if (days === 0) return `Edited ${Math.floor(diff / HOUR)} h ago`;
  if (days === 1) return 'Edited yesterday';
  if (days < 7) return `Edited ${days} days ago`;

  const sameYear = new Date(updatedAt).getFullYear() === new Date(now).getFullYear();
  const date = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(updatedAt);
  return `Edited ${date}`;
}
