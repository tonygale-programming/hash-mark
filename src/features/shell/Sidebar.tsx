import type { Ref } from 'react';
import { Search, Trash2, X } from 'lucide-react';
import { Button, Icon, Tooltip } from '../../ui';
import { useNow } from '../../lib/useNow';
import type { Note } from '../notes/db';
import { editedLabel } from '../notes/editedLabel';
import { filterNotes } from '../notes/notesStore';

export type SidebarProps = {
  /** undefined while loading. */
  notes: Note[] | undefined;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onRequestDelete: (note: Note) => void;
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
  onRequestDelete,
  query,
  onQueryChange,
  drawer,
  open,
  onClose,
  searchRef,
}: SidebarProps) {
  const now = useNow();
  const visible = notes ? filterNotes(notes, query) : [];
  return (
    <aside
      id="notes-sidebar"
      className={`pane sidebar${drawer ? ' sidebar--drawer' : ''}`}
      aria-labelledby="notes-heading"
      aria-busy={notes === undefined}
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
      {notes === undefined ? null : visible.length > 0 ? (
        <ul className="note-list">
          {visible.map((note) => {
            const selected = note.id === selectedId;
            return (
              <li key={note.id} className="note-list__row" data-selected={selected || undefined}>
                <button
                  type="button"
                  className="note-list__item"
                  data-note-id={note.id}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(note.id)}
                >
                  <span className="note-list__title">{note.title}</span>
                  <span className="note-list__meta">{editedLabel(note.updatedAt, now)}</span>
                </button>
                <Tooltip label="Delete note" align="end" describe={false}>
                  <Button
                    variant="ghost"
                    icon={Trash2}
                    className="note-list__delete"
                    aria-label={`Delete note “${note.title}”`}
                    onClick={() => onRequestDelete(note)}
                  />
                </Tooltip>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="sidebar__empty">
          {notes.length === 0 ? 'No notes yet' : `No notes match “${query.trim()}”`}
        </p>
      )}
    </aside>
  );
}
