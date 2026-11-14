import { Copy, Download } from 'lucide-react';
import { Button, Chip } from '../../ui';
import type { NoteSummary } from '../notes/sampleNotes';

export function StatusBar({ stats }: { stats: NoteSummary['stats'] | undefined }) {
  return (
    <footer className="statusbar" aria-label="Document status">
      <div className="statusbar__group" role="status">
        <Chip tone="success" dot>
          Saved
        </Chip>
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
