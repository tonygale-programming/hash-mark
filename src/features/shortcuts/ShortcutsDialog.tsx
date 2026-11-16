import { Button, Dialog, Shortcut } from '../../ui';
import { balanceColumns, shortcutGroups, type ShortcutGroup } from './shortcutList';
import './ShortcutsDialog.css';

function Group({ group }: { group: ShortcutGroup }) {
  return (
    <section aria-label={group.name}>
      <h3>{group.name}</h3>
      <dl className="shortcut-list">
        {group.rows.map((row) => (
          <div key={row.id} className="shortcut-list__row">
            <dt>{row.label}</dt>
            <dd>
              <Shortcut shortcut={row.shortcut} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * "Keyboard shortcuts", as in Curly Brace: a heading per group, each action with its keys.
 * Two balanced columns on wide screens (one below 800px).
 */
export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const columns = balanceColumns(shortcutGroups());
  return (
    <Dialog
      open={open}
      title="Keyboard shortcuts"
      onClose={onClose}
      className="shortcuts-dialog"
      actions={<Button onClick={onClose}>Close</Button>}
    >
      <div className="shortcut-groups">
        {columns.map((column, index) => (
          <div key={index} className="shortcut-groups__column">
            {column.map((group) => (
              <Group key={group.name} group={group} />
            ))}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
