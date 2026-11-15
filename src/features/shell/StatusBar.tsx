import { Copy, Download } from 'lucide-react';
import { Button, Chip } from '../../ui';
import type { SaveStatus } from '../notes/autosave';
import type { DocStats } from '../notes/stats';

const formatNumber = new Intl.NumberFormat('en').format;

const SAVE_CHIP = {
  saved: { tone: 'success', label: 'Saved' },
  pending: { tone: 'neutral', label: 'Saving…' },
  error: { tone: 'danger', label: 'Not saved' },
} as const;

export type StatusBarProps = {
  saveStatus?: SaveStatus;
  stats?: DocStats;
  /** Download and Copy act on the current note; omitted when there is none. */
  onDownload?: () => void;
  onCopy?: () => void;
};

export function StatusBar({ saveStatus, stats, onDownload, onCopy }: StatusBarProps) {
  const chip = saveStatus ? SAVE_CHIP[saveStatus] : null;
  return (
    <footer className="statusbar" aria-label="Document status">
      <div className="statusbar__group">
        {/* Only the save state is a live region; stats change on every keystroke. */}
        <span role="status">
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
        </span>
        {stats && (
          <>
            <span className="stat">
              <b>{formatNumber(stats.words)}</b> {stats.words === 1 ? 'word' : 'words'}
            </span>
            <span className="stat">
              <b>{formatNumber(stats.readMinutes)}</b> min read
            </span>
            <span className="stat stat--secondary">
              Headings <b>{formatNumber(stats.headings)}</b>
            </span>
          </>
        )}
      </div>
      <div className="statusbar__group">
        <Button icon={Download} onClick={onDownload} disabled={!onDownload}>
          Download
        </Button>
        <Button icon={Copy} onClick={onCopy} disabled={!onCopy}>
          Copy
        </Button>
      </div>
    </footer>
  );
}
