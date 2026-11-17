# Architecture

How the shipped code is put together, by area. What is planned lives in PROGRESS.md; behaviour is in
docs/editor-ux-spec.md; colors and type are in docs/design-tokens.md.

## Bundles
- The main bundle (shell, notes, theme, registry metadata) is about 112 kB gzip. Everything heavy loads
  on demand:
  - the editor (`MarkdownEditor`, about 93 kB gzip);
  - the editor commands with autocomplete and lang-markdown (`editorCommands`, about 101 kB gzip;
    lang-markdown always bundles the HTML/CSS/JS grammars);
  - Read mode's unified pipeline (`ReadView`, about 53 kB gzip);
  - the Shortcuts dialog.
- The shell imports only `commands/appCommands.ts`, `commands/keymap.ts` and type-only modules.
  Importing `commands/editorCommands.ts` (or anything of CodeMirror) from the shell would pull the
  editor into the main bundle.
- Vite's 500 kB warning does not fire today; revisit chunking with Shiki, KaTeX and Mermaid.

## Command registry (`src/commands/`)
- One registry feeds every surface: keymap, slash menu, shortcuts dialog, toolbars and (later) the
  command palette. Types are in `types.ts`; spec §11.
- `EDITOR_COMMANDS` (`editorCommands.ts`), looked up by id with `editorCommand(id)`:
  - Text: bold, italic, strikethrough, inline code, link.
  - Blocks: Heading 1–3, quote, code block, table, divider, image, callout.
  - Lists: bulleted, numbered, to-do, toggle task, indent, outdent.
- `APP_COMMANDS` (`appCommands.ts`), looked up with `appCommand(id)`: New note, Show syntax, Cycle mode,
  Sample, Clear, Open file, Download, Copy, Show shortcuts. Shell buttons render them with
  `CommandButton`, so labels and icons match everywhere.
- Inline toggles (`inline.ts`) use the Lezer tree: applying a format inside it removes it.
- Line commands (`lines.ts`) rewrite only the Markdown prefix of each line (`parseLine` / `prefixOf`),
  so the cursor keeps its place in the text.
- Inserts (`insert.ts`) are CodeMirror snippets: `${name}` is a placeholder, Tab moves on, `${}` is
  the final cursor. Blocks add the blank lines Markdown needs around them.
- Search (`search.ts`): label start, exact keyword, later word, keyword start, then letters in order.
- Keys: the editor keymap is generated from the registry (`editorKeyBindings`). App shortcuts match the
  physical key (`event.code`), so they work on any keyboard layout (`matchesShortcut`). Tab / Shift+Tab
  act only in lists, so Tab still moves focus elsewhere. Mod+K fills the URL from the clipboard only
  when clipboard-read is already granted (it never prompts).
- Default CodeMirror keys removed because the spec reserves them: Mod-/, Mod-i, Mod-Enter, Alt-A
  (`editor/extensions.ts`).
- Not a command: Highlight (`==text==` is not GFM and Read mode would not render it).

## Editor (`src/features/editor/`)
- CodeMirror 6 with lang-markdown (GFM). `extensions.ts` lists every extension in order.
- Styling: a decoration plugin over the Lezer tree (`markdownStyles.ts`, classes `cm-md-*`); markers
  are visible. Live preview will hide markers in the same plugin.
- Editor states are cached per note id for the session (`editorStateCache.ts`), so cursor and undo
  survive note and mode switches. `replaceDocument` makes Sample and Clear one undoable edit, also
  when the editor is not mounted (Read mode). The editor opens with the live text, not the saved text.
- Smart typing (`smartTyping.ts`) replaces lang-markdown's Enter/Backspace keymap (`addKeymap: false`):
  the same continuation with `nonTightLists: false`, the spec's input rules, and auto-close pairs.
  Auto-inserted closers are tracked in a state field, so stepping over never skips typed characters.
  lang-markdown still turns a URL pasted over selected text into a link.
- Slash menu (`slashMenu.ts`): @codemirror/autocomplete with our own source (`override`, so
  lang-markdown's HTML tag completion is off). Items are registry ids (`SLASH_ITEM_IDS`).
  - The result has an `update` hook and `activateOnTypingDelay: 0`, so filtering keeps up with fast
    typing. CodeMirror ignores Enter and arrows for 75 ms after the menu opens (e2e types with a delay).
  - Icons are Lucide, rendered to DOM once (`ui/iconElement.ts`). The key-hint footer is a small view
    plugin. The list is labelled "Blocks" for screen readers.
  - Editor tooltips keep a 16 px gutter from the window edge (`tooltipSpace` in `extensions.ts`).

## Notes and saving (`src/features/notes/`)
- IndexedDB database `hash-mark` (Dexie, `db.ts`): notes `{id, title, markdown, updatedAt}`. The title
  comes from the first line with text (`title.ts`) and is stored for the list. The welcome note
  (`welcome.md`) is seeded once, when the database is created.
- Autosave (`autosave.ts`): 500 ms debounce, ordered, flushed on note switch and page hide. Status chip:
  Saved / Saving… / Not saved. The shell keeps the latest text as a draft ahead of IndexedDB.
- Delete asks first (`ConfirmDialog`); there is no trash or undo.
- Search matches title and content. The selected note is remembered per device in localStorage.
- Status bar stats (`stats.ts`): a line scanner, not a full parse, run on the live text through
  `useDeferredValue`. Words are counted as word processors do (whitespace tokens; "well-known" = 1),
  with `Intl.Segmenter` only for scripts without spaces. Read time = ceil(words / 200). Headings =
  ATX + setext outside code. Only the save chip is a live region.

## Read mode (`src/features/read/`)
- `renderMarkdown()`: remark-parse → remark-gfm → remark-rehype → rehype-sanitize (GitHub schema) →
  a polish step → stringify.
- Raw HTML in Markdown is dropped (supporting `<details>` or `<kbd>` needs rehype-raw, not allowed yet).
- The polish step: external links open in a new tab; remote images load lazily with no referrer;
  tables get a scroll wrapper; GitHub alerts (`> [!NOTE]` …) become titled callouts.
- Footnote links scroll in place and never change the URL fragment (reserved for share links).
- `ReadView` is lazy-loaded and also draws the right side of Split.

## Files (`src/features/files/`)
- Open file (picker, several at once) and drag and drop anywhere on the window make one note per file;
  the last one opened is selected. Accepted: .md, .markdown, .mdown, .mkd, .mkdn, .mdwn, .txt and
  names without an extension (README). Binary files and files over 10 MB are skipped with a reason.
- Text is normalized: BOM stripped, CRLF → LF. The drop handler runs in the capture phase and stops
  CodeMirror's own file drop.
- Download saves the live text as `<title>.md`; Copy copies the Markdown source.

## Shell and UI (`src/features/shell/`, `src/ui/`)
- `AppShell` owns app state (mode, notes selection, draft, dialogs) and builds the `AppCommandContext`.
  `useAppShortcuts` (registry keys anywhere on the page, not inside dialogs) and `useDrawer` (narrow
  screens: focus, Esc, focus return) are its hooks.
- Under 1000 px the sidebar becomes a drawer and Split is hidden. The phone layout (top bar, keyboard
  toolbar) is not built; the toolbar wraps.
- `ui/` holds the Brace components: Button / LinkButton, SegmentedControl, Toggle, Chip, KeyCap and
  Shortcut, Tooltip, Dialog (native `<dialog>`: Esc, outside click, focus return), ConfirmDialog, Toast
  (one message at a time in a polite live region, 4 s, errors 7 s).
- Theme: `light-dark()` tokens; with no saved choice there is no `data-theme` and the system decides.
  A saved choice sets `data-theme` (also before first paint, in `index.html`).

## Tests and CI
- Unit tests (Vitest, jsdom, fake-indexeddb) sit next to the code. `src/commands/testing.ts` writes
  documents with `‸` for a cursor and `«…»` for a selection.
- e2e (Playwright, Chromium) in `e2e/`, with shared helpers in `e2e/helpers.ts`.
- Push to `main` runs format check, lint, unit tests, build and e2e, then deploys to GitHub Pages.
