import type { Ref } from 'react';
import { FolderOpen, Link, PanelLeft, Plus } from 'lucide-react';
import { Button, SegmentedControl, Toggle, Tooltip } from '../../ui';
import { appCommand } from '../../commands/appCommands';
import { availableModes, type Mode } from '../editor/mode';

export type ToolbarProps = {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  showSyntax: boolean;
  onShowSyntaxChange: (on: boolean) => void;
  narrow: boolean;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  drawerButtonRef: Ref<HTMLButtonElement>;
  onNewNote: () => void;
  onOpenFile: () => void;
  onSample: () => void;
  onClear: () => void;
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
  onNewNote,
  onOpenFile,
  onSample,
  onClear,
  canClear,
}: ToolbarProps) {
  const sample = appCommand('app.sample');
  const clear = appCommand('app.clear');
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
        <Button variant="main" icon={Plus} onClick={onNewNote}>
          New note
        </Button>
        <Tooltip label="Open a Markdown file" shortcut={appCommand('app.openFile').shortcut}>
          <Button icon={FolderOpen} onClick={onOpenFile}>
            Open file
          </Button>
        </Tooltip>
        <Button icon={sample.icon} onClick={onSample}>
          {sample.label}
        </Button>
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
        <Button icon={clear.icon} onClick={onClear} disabled={!canClear}>
          {clear.label}
        </Button>
      </div>
    </div>
  );
}
