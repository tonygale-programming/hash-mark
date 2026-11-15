import { Copy, Download } from 'lucide-react';
import { Button, Chip } from '../../ui';
import type { SaveStatus } from '../notes/autosave';

export type DocStats = { words: number; readMinutes: number; headings: number };

const SAVE_CHIP = {
  saved: { tone: 'success', label: 'Saved' },
  pending: { tone: 'neutral', label: 'Saving…' },
  error: { tone: 'danger', label: 'Not saved' },
} as const;

export function StatusBar({ saveStatus, stats }: { saveStatus?: SaveStatus; stats?: DocStats }) {
  const chip = saveStatus ? SAVE_CHIP[saveStatus] : null;
  return (
    <footer className="statusbar" aria-label="Document status">
      <div className="statusbar__group" role="status">
        {chip && (
          <span
            title={
              saveStatus === 'error'
                ? 'Changes could not be saved in this browser. Keep the tab open; saving retries on the next edit.'
                : undefined
            }
          >
            <Chip tone={chip.tone} dot>
              {chip.label}
            </Chip>
          </span>
        )}
        {stats && (
          <>
            <span className="stat">
              <b>{stats.words}</b> words
            </span>
            <span className="stat">
              <b>{stats.readMinutes}</b> min read
            </span>
            <span className="stat">
              Headings <b>{stats.headings}</b>
            </span>
          </>
        )}
      </div>
      <div className="statusbar__group">
        <Button icon={Download}>Download</Button>
        <Button icon={Copy}>Copy</Button>
      </div>
    </footer>
  );
}
