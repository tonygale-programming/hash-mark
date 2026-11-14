import type { Ref } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Icon } from '../../ui';
import { filterNotes, type NoteSummary } from '../notes/sampleNotes';

export type SidebarProps = {
  notes: NoteSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  /** Narrow layout: rendered as a drawer with a close button. */
  drawer: boolean;
  open: boolean;
  onClose: () => void;
  searchRef: Ref<HTMLInputElement>;
};

export function Sidebar({
  notes,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  drawer,
  open,
  onClose,
  searchRef,
}: SidebarProps) {
  const visible = filterNotes(notes, query);
  return (
    <aside
      id="notes-sidebar"
      className={`pane sidebar${drawer ? ' sidebar--drawer' : ''}`}
      aria-labelledby="notes-heading"
      hidden={drawer && !open}
    >
      <div className="sidebar__head">
        <h2 id="notes-heading" className={drawer ? 'sidebar__title' : 'visually-hidden'}>
          Notes
        </h2>
        {drawer && <Button variant="ghost" icon={X} aria-label="Close notes" onClick={onClose} />}
      </div>
      <label className="search">
        <Icon icon={Search} />
        <span className="visually-hidden">Search notes</span>
        <input
          ref={searchRef}
          type="search"
          placeholder="Search notes"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      {visible.length > 0 ? (
        <ul className="note-list">
          {visible.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                className="note-list__item"
                aria-current={note.id === selectedId ? 'true' : undefined}
                onClick={() => onSelect(note.id)}
              >
                <span className="note-list__title">{note.title}</span>
                <span className="note-list__meta">{note.edited}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sidebar__empty">No notes match “{query.trim()}”</p>
      )}
    </aside>
  );
}
