import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import type { LucideIcon } from 'lucide-react';

/**
 * One registry feeds every surface: keymap, slash menu, selection toolbar, mobile toolbar,
 * command palette and cheat sheet (CLAUDE.md, docs/editor-ux-spec.md §11).
 * Shortcuts use the spec's notation: "Mod+Shift+8", where Mod is Cmd on Apple and Ctrl elsewhere.
 */
type CommandMeta = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Extra words for fuzzy search (slash menu, palette). */
  keywords: string[];
  shortcut?: string;
  /** The Markdown it writes, shown as a hint ("**", "##", "- [ ]"). */
  syntaxHint?: string;
};

export type EditorCommandGroup = 'Text' | 'Blocks' | 'Lists';

/** Acts on the document; returns false when it does not apply (so a key can do its default). */
export type EditorCommand = CommandMeta & {
  group: EditorCommandGroup;
  run: (view: EditorView) => boolean;
  /** For toolbars: whether the selection already has this format. */
  isActive?: (state: EditorState) => boolean;
};

export type AppCommandContext = {
  newNote: () => void;
  cycleMode: () => void;
  toggleShowSyntax: () => void;
  loadSample: () => void;
  clearNote: () => void;
  openFile: () => void;
  download: () => void;
  copy: () => void;
  showShortcuts: () => void;
};

export type AppCommandGroup = 'Note' | 'View';

/** Acts on the app (modes, panels, files), from anywhere on the page. */
export type AppCommand = CommandMeta & {
  group: AppCommandGroup;
  /** Ignore the key while typing in the editor or a field (single keys such as "?"). */
  notWhileTyping?: boolean;
  run: (context: AppCommandContext) => void;
};
