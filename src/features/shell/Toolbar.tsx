import type { Ref } from 'react';
import { Link, PanelLeft } from 'lucide-react';
import { Button, SegmentedControl, Toggle, Tooltip } from '../../ui';
import { appCommand } from '../../commands/appCommands';
import { availableModes, type Mode } from '../editor/mode';
import { CommandButton } from './CommandButton';

export type ToolbarProps = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  showSyntax: boolean;
  onShowSyntaxChange: (on: boolean) => void;
  narrow: boolean;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  drawerButtonRef: Ref<HTMLButtonElement>;
  /** Runs an app command by id (New note, Open file, Sample, Clear). */
  onCommand: (id: string) => void;
  /** Clear is off when the note is already empty (as in Curly Brace). */
  canClear: boolean;
};

export function Toolbar({
  mode,
  onModeChange,
  showSyntax,
  onShowSyntaxChange,
  narrow,
  drawerOpen,
  onOpenDrawer,
  drawerButtonRef,
  onCommand,
  canClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar__group">
        {narrow && (
          <Button
            ref={drawerButtonRef}
            icon={PanelLeft}
            aria-expanded={drawerOpen}
            aria-controls="notes-sidebar"
            onClick={onOpenDrawer}
          >
            Notes
          </Button>
        )}
        <CommandButton variant="main" command="app.newNote" onCommand={onCommand} />
        <Tooltip label="Open a Markdown file" shortcut={appCommand('app.openFile').shortcut}>
          <CommandButton command="app.openFile" onCommand={onCommand} />
        </Tooltip>
        <CommandButton command="app.sample" onCommand={onCommand} />
        <Tooltip label="Cycle mode" shortcut={appCommand('app.cycleMode').shortcut}>
          <SegmentedControl
            label="Mode"
            options={availableModes(narrow)}
            value={mode}
            onChange={onModeChange}
          />
        </Tooltip>
        <Tooltip label="Show all Markdown markers" shortcut={appCommand('app.showSyntax').shortcut}>
          <Toggle glyph="#" pressed={showSyntax} onPressedChange={onShowSyntaxChange}>
            Show syntax
          </Toggle>
        </Tooltip>
      </div>
      <div className="toolbar__group">
        {/* Off until share links are built (PROGRESS.md, M3). */}
        <Button icon={Link} disabled>
          Share link
        </Button>
        <CommandButton command="app.clear" onCommand={onCommand} disabled={!canClear} />
      </div>
    </div>
  );
}
