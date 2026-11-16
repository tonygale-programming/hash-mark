import { Columns2, Download, Eraser, FileText, FolderOpen, Hash, Keyboard } from 'lucide-react';
import type { AppCommand } from './types';

export const APP_COMMANDS: AppCommand[] = [
  {
    id: 'app.showSyntax',
    label: 'Show syntax',
    icon: Hash,
    keywords: ['markers', 'source', 'raw markdown'],
    shortcut: 'Mod+/',
    group: 'View',
    run: (context) => context.toggleShowSyntax(),
  },
  {
    id: 'app.cycleMode',
    label: 'Cycle mode',
    icon: Columns2,
    keywords: ['write', 'split', 'read', 'view', 'preview'],
    shortcut: 'Mod+Shift+M',
    group: 'View',
    run: (context) => context.cycleMode(),
  },
  // Sample and Clear, as in Curly Brace (both undoable with Mod+Z while the page is open).
  {
    id: 'app.sample',
    label: 'Sample',
    icon: FileText,
    keywords: ['example', 'demo', 'try'],
    group: 'Note',
    run: (context) => context.loadSample(),
  },
  {
    id: 'app.clear',
    label: 'Clear',
    icon: Eraser,
    keywords: ['empty', 'erase', 'reset'],
    group: 'Note',
    run: (context) => context.clearNote(),
  },
  // File and help shortcuts, as in Curly Brace.
  {
    id: 'app.openFile',
    label: 'Open file',
    icon: FolderOpen,
    keywords: ['import', 'load', 'markdown file'],
    shortcut: 'Mod+O',
    group: 'Note',
    run: (context) => context.openFile(),
  },
  {
    id: 'app.download',
    label: 'Download',
    icon: Download,
    keywords: ['save', 'export', '.md'],
    shortcut: 'Mod+S',
    group: 'Note',
    run: (context) => context.download(),
  },
  {
    id: 'app.showShortcuts',
    label: 'Show shortcuts',
    icon: Keyboard,
    keywords: ['keys', 'keyboard', 'help', 'cheat sheet'],
    shortcut: '?',
    notWhileTyping: true,
    group: 'View',
    run: (context) => context.showShortcuts(),
  },
];

export function appCommand(id: string): AppCommand {
  const command = APP_COMMANDS.find((c) => c.id === id);
  if (!command) throw new Error(`Unknown app command: ${id}`);
  return command;
}
