export type SaveStatus = 'saved' | 'pending' | 'error';

type Job = { id: string; markdown: string };

/**
 * Debounced, ordered saving of one note at a time. Edits for a different note
 * flush the previous note first. A failed save keeps the edit and reports `error`;
 * the next edit or flush retries it.
 */
export class Autosaver {
  private pending: Job | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private chain: Promise<void> = Promise.resolve();
  private readonly save: (id: string, markdown: string) => Promise<void>;
  private readonly onStatus: (status: SaveStatus) => void;
  private readonly delay: number;

  constructor(
    save: (id: string, markdown: string) => Promise<void>,
    onStatus: (status: SaveStatus) => void,
    delay = 500,
  ) {
    this.save = save;
    this.onStatus = onStatus;
    this.delay = delay;
  }

  change(id: string, markdown: string) {
    if (this.pending && this.pending.id !== id) void this.flush();
    this.pending = { id, markdown };
    this.onStatus('pending');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delay);
  }

  /** Saves any pending edit now; resolves when all queued saves have finished. */
  flush(): Promise<void> {
    clearTimeout(this.timer);
    const job = this.pending;
    this.pending = null;
    if (job) {
      this.chain = this.chain
        .then(() => this.save(job.id, job.markdown))
        .then(
          () => {
            if (!this.pending) this.onStatus('saved');
          },
          () => {
            this.pending ??= job;
            this.onStatus('error');
          },
        );
    }
    return this.chain;
  }

  /** Drops a pending edit, e.g. when its note is deleted. */
  cancel(id: string) {
    if (this.pending?.id !== id) return;
    clearTimeout(this.timer);
    this.pending = null;
    this.onStatus('saved');
  }

  get hasPending() {
    return this.pending !== null;
  }
}
