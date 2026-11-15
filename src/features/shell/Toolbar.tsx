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
        <Button variant="main" icon={Plus} onClick={onNewNote}>
          New note
        </Button>
        <Button icon={FolderOpen} onClick={onOpenFile}>
          Open file
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
        <Button icon={Link}>Share link</Button>
      </div>
    </div>
  );
}
