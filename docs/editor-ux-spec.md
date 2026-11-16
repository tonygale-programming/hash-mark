# Editor UX spec — Hash Mark

Goal: anyone can write well-formatted Markdown without knowing the syntax; the file always stays clean,
portable Markdown. Syntax is learned gradually through hints.

## 1. Modes
| Mode | Description | Platforms |
|---|---|---|
| Write (default) | Single-pane live preview: markers (#, **, [ ] …) hidden except on the active line | Web, mobile |
| Split | Raw Markdown left, rendered preview right, synced scroll | Desktop only |
| Read | Rendered document only (shared links, AI files, presenting) | Web, mobile |
- Show syntax toggle (Mod+/): Write mode with marker-hiding off (all markers visible, styling stays).
- Mod+Shift+M cycles modes. One document state; switching keeps content and cursor.
- Build order: Write with syntax visible + Read → Split → hide markers (live preview).

## 2. Live preview (Write)
- CodeMirror decorations: Decoration.replace hides markers; mark decorations style text.
- Widgets: clickable task checkboxes, images, horizontal rules; later KaTeX, Mermaid, tables.
- Markers reappear when the cursor enters the line/span.

## 3. Slash menu (/)
- Triggered by / at line start or after a space. Items: Heading 1–3, Bulleted list, Numbered list, To-do,
  Quote, Code block, Table, Divider, Image, Link, Math, Diagram, Callout.
- Fuzzy filter; ↑↓ Enter Esc. Each item: glyph tile, label, syntax hint (e.g. "##") on the right.
  Selected item = accent fill + outline. Footer shows key hints.
- Implementation: @codemirror/autocomplete custom source; snippets with tab stops.

## 4. Selection toolbar
- Floating pill above a non-empty selection: Bold, Italic, Strikethrough, Inline code, Link, Highlight | Turn into ▾.
- Buttons toggle (Bold again removes **). Tooltip shows name + shortcut.
- Implementation: CodeMirror showTooltip bound to selection.

## 5. Shortcuts
| Action | Shortcut |
|---|---|
| Bold / Italic / Strikethrough | Mod+B / Mod+I / Mod+Shift+X |
| Link | Mod+K (selected text + URL in clipboard → link instantly) |
| Heading 1–3 | Mod+Alt+1…3 |
| Bulleted / numbered / task list | Mod+Shift+8 / 7 / 9 |
| Inline code / code block | Mod+E / Mod+Shift+E |
| Indent / outdent | Tab / Shift+Tab |
| Toggle task | Mod+Enter |
| Show syntax | Mod+/ |
| Cycle mode | Mod+Shift+M |
| Command palette | Mod+Shift+P |
| Open file / Download | Mod+O / Mod+S (as Curly Brace) |
| Show shortcuts | ? (not while typing) |

The **Shortcuts** dialog (header button or `?`) lists every key, built from the command registry
(`src/features/shortcuts/`), so it cannot drift from the keys that work.

## 6. Smart typing
Implemented in `src/features/editor/smartTyping.ts`.
- Enter continues lists/quotes/tasks; Enter on an empty item exits the list (or moves a nested item up one
  level), never making the list loose. Enter on an empty quote line leaves the quote.
- Auto-close pairs: **, `, (, [ (typing the closer steps over it; Backspace removes an empty pair; only
  closers the editor inserted are stepped over). Not at a "* " bullet, not inside words, not before text.
  $ auto-close waits for math rendering (M5); selected text is wrapped by * _ ~ ` $ ( [.
- Input rules: "[] " / "[ ] " / "[x] " at the line start → task; Enter after an opening ``` fence adds the
  closing fence; Enter after "---" under a paragraph adds a blank line first so it stays a divider.

## 7. Smart paste
| Pasted | Result |
|---|---|
| URL over selected text | [text](url) |
| Rich HTML (web, Docs, Word) | Markdown via turndown + turndown-plugin-gfm |
| Image | saved locally, ![](…) |
| TSV/CSV | Markdown table (papaparse) |
| Code | fenced block with detected language |

## 8. Visual helpers (later)
Table grid editor, link/image popover, math & Mermaid preview popups.

## 9. Discoverability
Empty-state placeholder "Type / for blocks, or just start writing"; command palette; ? cheat sheet; Show syntax toggle.

## 10. Mobile
Keyboard toolbar (see layout). Position via visualViewport on web, @capacitor/keyboard in native. Modes: Write, Read.

## 11. Command registry
Implemented in `src/commands/` (types in `types.ts`):
- `EditorCommand` = { id, label, icon (Lucide), keywords, shortcut?, syntaxHint?, group: Text | Blocks | Lists,
  run(view) → boolean (false = does not apply, the key keeps its default), isActive?(state) for toolbars }.
- `AppCommand` = same metadata, group App, run(context) for app state (Show syntax, cycle mode).
- Shortcuts are written "Mod+Shift+8"; the editor keymap and the app-level key handler are generated from them.
- Inline toggles use the Markdown syntax tree, so applying a format inside it removes it.
- Line commands rewrite only the Markdown prefix of each line (quote, heading, list marker, task box).

## 12. Share link
v1: lz-string compress Markdown → URL fragment (#), opens in Read mode; nothing sent to a server.
Later: optional hosted links (short URL, update/revoke).

## 13. Screen layout (desktop, from the approved mockup)
- **Header row:** left — brand `#Hash Mark` (Lucide hash + mono name, as Curly Brace's `{brace}`) and the tagline "Markdown, made readable." Right — ghost links (no border): Shortcuts (keyboard icon), GitHub (code icon), Buy Me a Coffee (cup icon), theme button (moon icon, aria-label).
- **Toolbar row:** left — `New note` (main action, accent fill), `Open file`, `Sample` (outline pills), segmented control `Write | Split | Read` (selected = accent), toggle `# Show syntax`. Right — `Share link`, `Clear` (outline; Clear is off when the note is empty).
- **Sample / Clear (as Curly Brace):** Sample puts an example document (`src/features/notes/sample.md`) into an
  empty note, or opens it as a new note when the current one has text. Clear empties the note. Both are one
  undoable edit (Mod+Z) and confirm with a toast.
- **Main row:** left — notes sidebar pane (search input pill, list of notes: title + "Edited 2 min ago"; selected note = accent fill + outline). Right — editor pane (surface, 1.5px border, radius 12), document column max-width 680px centered.
- **Status bar:** left — green chip `● Saved`, then stats with bold figures: `186 words`, `1 min read`, `Headings 3`. Right — `Download`, `Copy` (outline pills).
- Under 1000px: sidebar collapses (drawer), toolbar wraps, Split hidden.
- **Mobile:** top bar (back, note title, `Write | Read`, ⋯ menu). Keyboard toolbar above the on-screen keyboard: Undo · H (long-press → H1/H2/H3) · B · Bulleted list · To-do · Link · `/` · ⋯. 44px touch targets.
