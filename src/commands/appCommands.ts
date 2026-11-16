import { Columns2, Eraser, FileText, Hash } from 'lucide-react';
import type { AppCommand } from './types';

export const APP_COMMANDS: AppCommand[] = [
  {
    id: 'app.showSyntax',
    label: 'Show syntax',
    icon: Hash,
    keywords: ['markers', 'source', 'raw markdown'],
    shortcut: 'Mod+/',
    group: 'App',
    run: (context) => context.toggleShowSyntax(),
  },
  {
    id: 'app.cycleMode',
    label: 'Cycle mode',
    icon: Columns2,
    keywords: ['write', 'split', 'read', 'view', 'preview'],
    shortcut: 'Mod+Shift+M',
    group: 'App',
    run: (context) => context.cycleMode(),
  },
  // Sample and Clear, as in Curly Brace (both undoable with Mod+Z while the page is open).
  {
    id: 'app.sample',
    label: 'Sample',
    icon: FileText,
    keywords: ['example', 'demo', 'try'],
    group: 'App',
    run: (context) => context.loadSample(),
  },
  {
    id: 'app.clear',
    label: 'Clear',
    icon: Eraser,
    keywords: ['empty', 'erase', 'reset'],
    group: 'App',
    run: (context) => context.clearNote(),
  },
];

export function appCommand(id: string): AppCommand {
  const command = APP_COMMANDS.find((c) => c.id === id);
  if (!command) throw new Error(`Unknown app command: ${id}`);
  return command;
}
