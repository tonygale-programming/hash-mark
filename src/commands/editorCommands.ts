import type { EditorView } from '@codemirror/view';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Info,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  SquareCheck,
  SquareCode,
  SeparatorHorizontal,
  Strikethrough,
  Table,
  TextQuote,
} from 'lucide-react';
import {
  BOLD,
  INLINE_CODE,
  ITALIC,
  LINK_PLACEHOLDER,
  STRIKETHROUGH,
  isInlineActive,
  isUrl,
  toggleInline,
  toggleLink,
} from './inline';
import {
  CALLOUT_TEMPLATE,
  DIVIDER_TEMPLATE,
  IMAGE_TEMPLATE,
  TABLE_TEMPLATE,
  insertBlock,
  insertInline,
} from './insert';
import {
  indentList,
  toggleCodeBlock,
  toggleHeading,
  toggleList,
  toggleQuote,
  toggleTask,
} from './lines';
import { enclosingNode } from './tree';
import type { EditorCommand } from './types';

/**
 * Mod+K: after making the link, if the clipboard holds a URL and the page may read it without a
 * prompt, the URL replaces the "url" placeholder. Never asks for permission itself.
 */
function linkWithClipboardUrl(view: EditorView): boolean {
  const handled = toggleLink(view);
  const before = view.state.selection.main;
  if (view.state.sliceDoc(before.from, before.to) !== LINK_PLACEHOLDER) return handled;
  void (async () => {
    try {
      const permission = await navigator.permissions?.query({
        name: 'clipboard-read' as PermissionName,
      });
      if (permission?.state !== 'granted') return;
      const text = (await navigator.clipboard.readText()).trim();
      const now = view.state.selection.main;
      if (!isUrl(text) || now.from !== before.from || now.to !== before.to) return;
      if (view.state.sliceDoc(now.from, now.to) !== LINK_PLACEHOLDER) return;
      view.dispatch({
        changes: { from: now.from, to: now.to, insert: text },
        selection: { anchor: now.from + text.length + 1 },
        userEvent: 'input.format',
      });
    } catch {
      // No clipboard access: the placeholder stays selected to type over.
    }
  })();
  return handled;
}

export const EDITOR_COMMANDS: EditorCommand[] = [
  {
    id: 'text.bold',
    label: 'Bold',
    icon: Bold,
    keywords: ['strong', 'b'],
    shortcut: 'Mod+B',
    syntaxHint: '**',
    group: 'Text',
    run: toggleInline(BOLD),
    isActive: (state) => isInlineActive(state, BOLD),
  },
  {
    id: 'text.italic',
    label: 'Italic',
    icon: Italic,
    keywords: ['emphasis', 'i'],
    shortcut: 'Mod+I',
    syntaxHint: '*',
    group: 'Text',
    run: toggleInline(ITALIC),
    isActive: (state) => isInlineActive(state, ITALIC),
  },
  {
    id: 'text.strikethrough',
    label: 'Strikethrough',
    icon: Strikethrough,
    keywords: ['strike', 'delete', 'cross out'],
    shortcut: 'Mod+Shift+X',
    syntaxHint: '~~',
    group: 'Text',
    run: toggleInline(STRIKETHROUGH),
    isActive: (state) => isInlineActive(state, STRIKETHROUGH),
  },
  {
    id: 'text.code',
    label: 'Inline code',
    icon: Code,
    keywords: ['monospace', 'code'],
    shortcut: 'Mod+E',
    syntaxHint: '`',
    group: 'Text',
    run: toggleInline(INLINE_CODE),
    isActive: (state) => isInlineActive(state, INLINE_CODE),
  },
  {
    id: 'text.link',
    label: 'Link',
    icon: Link,
    keywords: ['url', 'href', 'hyperlink'],
    shortcut: 'Mod+K',
    syntaxHint: '[]()',
    group: 'Text',
    run: linkWithClipboardUrl,
    isActive: (state) =>
      enclosingNode(state, state.selection.main.from, state.selection.main.to, 'Link') !== null,
  },
  ...([1, 2, 3] as const).map((level): EditorCommand => ({
    id: `block.heading${level}`,
    label: `Heading ${level}`,
    icon: [Heading1, Heading2, Heading3][level - 1]!,
    keywords: ['title', 'header', `h${level}`],
    shortcut: `Mod+Alt+${level}`,
    syntaxHint: '#'.repeat(level),
    group: 'Blocks',
    run: toggleHeading(level),
  })),
  {
    id: 'block.quote',
    label: 'Quote',
    icon: TextQuote,
    keywords: ['blockquote', 'citation'],
    syntaxHint: '>',
    group: 'Blocks',
    run: toggleQuote,
  },
  {
    id: 'block.codeBlock',
    label: 'Code block',
    icon: SquareCode,
    keywords: ['fence', 'snippet', 'pre'],
    shortcut: 'Mod+Shift+E',
    syntaxHint: '```',
    group: 'Blocks',
    run: toggleCodeBlock,
  },
  {
    id: 'block.table',
    label: 'Table',
    icon: Table,
    keywords: ['grid', 'columns', 'rows'],
    syntaxHint: '| |',
    group: 'Blocks',
    run: insertBlock(TABLE_TEMPLATE),
  },
  {
    id: 'block.divider',
    label: 'Divider',
    icon: SeparatorHorizontal,
    keywords: ['horizontal rule', 'hr', 'line', 'separator'],
    syntaxHint: '---',
    group: 'Blocks',
    run: insertBlock(DIVIDER_TEMPLATE),
  },
  {
    id: 'block.image',
    label: 'Image',
    icon: ImageIcon,
    keywords: ['picture', 'photo', 'img'],
    syntaxHint: '![]()',
    group: 'Blocks',
    run: insertInline(IMAGE_TEMPLATE),
  },
  {
    id: 'block.callout',
    label: 'Callout',
    icon: Info,
    keywords: ['note', 'alert', 'admonition', 'tip', 'warning'],
    syntaxHint: '> [!NOTE]',
    group: 'Blocks',
    run: insertBlock(CALLOUT_TEMPLATE),
  },
  {
    id: 'list.bullet',
    label: 'Bulleted list',
    icon: List,
    keywords: ['bullets', 'unordered', 'ul'],
    shortcut: 'Mod+Shift+8',
    syntaxHint: '-',
    group: 'Lists',
    run: toggleList('bullet'),
  },
  {
    id: 'list.ordered',
    label: 'Numbered list',
    icon: ListOrdered,
    keywords: ['numbers', 'ordered', 'ol'],
    shortcut: 'Mod+Shift+7',
    syntaxHint: '1.',
    group: 'Lists',
    run: toggleList('ordered'),
  },
  {
    id: 'list.task',
    label: 'To-do list',
    icon: ListTodo,
    keywords: ['task', 'checklist', 'checkbox', 'todo'],
    shortcut: 'Mod+Shift+9',
    syntaxHint: '- [ ]',
    group: 'Lists',
    run: toggleList('task'),
  },
  {
    id: 'list.toggleTask',
    label: 'Toggle task',
    icon: SquareCheck,
    keywords: ['check', 'done', 'complete'],
    shortcut: 'Mod+Enter',
    syntaxHint: '[x]',
    group: 'Lists',
    run: toggleTask,
  },
  {
    id: 'list.indent',
    label: 'Indent list item',
    icon: IndentIncrease,
    keywords: ['nest', 'tab'],
    shortcut: 'Tab',
    group: 'Lists',
    run: indentList(1),
  },
  {
    id: 'list.outdent',
    label: 'Outdent list item',
    icon: IndentDecrease,
    keywords: ['unnest'],
    shortcut: 'Shift+Tab',
    group: 'Lists',
    run: indentList(-1),
  },
];
