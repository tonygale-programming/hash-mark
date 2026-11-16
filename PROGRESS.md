# Progress

Start every session: read this file, pick the next unchecked item, do it, test, commit, update this file.

## M0 — Scaffold
- [x] Vite + React + TS strict, ESLint + Prettier, Vitest + Testing Library, Playwright
- [x] tokens.css from docs/design-tokens.md, self-hosted fonts, theme toggle (data-theme, saved in localStorage, respects prefers-color-scheme)
- [x] App shell matching the layout: header, toolbar, sidebar, editor pane placeholder, status bar; responsive under 1000px
- [x] Base UI components: Button (outline/ghost), SegmentedControl, Toggle, Chip, KeyCap, Tooltip

## M1 — Notes and editor core (done)
- [x] Dexie store: notes {id, title, markdown, updatedAt}; New note, list, select, search, delete
- [x] CodeMirror 6 editor (Markdown + GFM), autosave with "Saved" chip
- [x] Read mode via unified pipeline (sanitized)
- [x] Open .md file (file picker + drag & drop), Download .md, Copy
- [x] Status bar stats (words, read time, headings)

## M2 — Writing help
- [x] Command registry + keymap
- [x] List/quote/task continuation, auto-close pairs
- [x] Slash menu
- [ ] Selection toolbar
- [ ] Clickable task checkboxes

## M3 — Modes
- [ ] Split mode with synced scroll (desktop)
- [ ] Live preview: hide markers except on active line
- [ ] Show syntax toggle (Mod+/)

## M4 — Paste and share
- [ ] Smart paste (URL, HTML → Markdown, TSV/CSV → table)
- [ ] Share link via URL fragment (lz-string), opens in Read mode

## M5 — Polish
- [ ] PWA (vite-plugin-pwa), offline
- [ ] Code highlighting (Shiki, lazy), KaTeX, Mermaid (lazy)
- [ ] Command palette (the ? key and the Shortcuts dialog are done)
- [ ] Accessibility pass, Lighthouse ≥ 95

## Next up
M2 — Selection toolbar (spec §4): a floating pill over a non-empty selection (CodeMirror showTooltip),
fed by the Text commands of the registry with `isActive` for the on state; "Turn into ▾" lists the Blocks
and Lists commands. Highlight stays out (not GFM).

## Notes
- Slash menu (spec §3): `src/features/editor/slashMenu.ts`, @codemirror/autocomplete with our own source
  (`override`, so lang-markdown's HTML tag completion is off). Items are registry commands listed by id
  (`SLASH_ITEM_IDS`); ranking is `searchCommands` (`src/commands/search.ts`, reusable for the command
  palette). The result has an `update` hook and `activateOnTypingDelay: 0`, so filtering keeps up with fast
  typing; CodeMirror ignores Enter/arrows for 75 ms after the menu opens (e2e types with a small delay).
  Icons are Lucide, rendered once to DOM (`ui/iconElement.ts`). The footer of key hints is added by a
  small view plugin (autocomplete has no footer). The list is labelled "Blocks" for screen readers.
  New registry commands: Table, Divider, Image, Callout (`src/commands/insert.ts`, snippet tab stops).
  Read mode renders GitHub alerts as callouts. In the editor `[!NOTE]` still looks like a link
  (live preview in M3 can style it). The editorCommands chunk grew to ~101 kB gzip (autocomplete's
  snippets); the main bundle is unchanged.
- Shortcuts dialog (as Curly Brace): header Shortcuts button or `?` (ignored while typing) opens "Keyboard
  shortcuts", generated from the registry plus Undo/Redo for reference; two balanced columns from 800px.
  Lazy-loaded with the editor commands. Mod+O (Open file) and Mod+S (Download) added as in Curly Brace;
  tooltips on Open file, Download and Shortcuts show their keys. `ui/Dialog` is the shared modal (Esc,
  outside click, focus return); ConfirmDialog is built on it.
- Sample / Clear (as Curly Brace): app commands `app.sample` / `app.clear`. Sample fills an empty note, or opens
  as a new note when the current note has text; Clear empties the note (off when already empty). Both go
  through the editor's history (`replaceDocument` in `editorStateCache.ts`), so Mod+Z undoes them, also after
  clearing from Read mode. The phone toolbar now wraps to four rows: the planned phone layout (top bar, ⋯ menu)
  should take these buttons.
- Smart typing: `smartTyping.ts` replaces lang-markdown's Enter/Backspace keymap (`addKeymap: false`) with the
  same continuation (`nonTightLists: false`, so an empty item exits instead of making the list loose) plus
  the spec's input rules and auto-close pairs. Auto-inserted closers are tracked in a state field, so
  stepping over never skips characters the person typed. $ only wraps for now (auto-close in M5 with KaTeX).
- Commands: `src/commands/` is the one registry (spec §11). EDITOR_COMMANDS (bold, italic, strikethrough,
  inline code, link, H1–3, quote, code block, bulleted / numbered / to-do list, toggle task, indent / outdent)
  and APP_COMMANDS (Show syntax Mod+/, cycle mode Mod+Shift+M). The editor keymap is generated from it
  (`editorKeyBindings`); app shortcuts match by physical key (`event.code`), so they work on any layout.
  The app shell imports only `appCommands.ts` / `keymap.ts`; `editorCommands.ts` stays in the lazy editor chunk.
  Tab / Shift+Tab act only in lists, so Tab still moves focus elsewhere. Mod+K fills the URL from the
  clipboard only when clipboard-read is already granted (never prompts). Highlight (spec §4) is not a
  command: `==text==` is not GFM and Read mode would not render it.
- Design system: identical to Curly Brace (Brace), only the accent differs (Hash Mark #00BFFF, Curly Brace #FFBF00).
  Tokens use `light-dark()`; no `data-theme` follows the system, a saved choice sets it. IBM Plex via @fontsource,
  Lucide 16px icons, 1.5px accent focus ring, New note is the filled main action. See docs/design-tokens.md.
  Open: the light-mode focus ring is under 3:1 in both apps (decide a fix together with Curly Brace).
- Notes live in IndexedDB `hash-mark` (Dexie, `src/features/notes/db.ts`). The title is derived from the first
  line with text (`title.ts`) and stored for listing. The welcome note (`welcome.md`) is seeded once, on
  database creation.
- Delete asks for confirmation (`ConfirmDialog`, native `<dialog>`); there is no trash or undo.
- Search matches title and content. The selected note is remembered per device in localStorage.
- Status bar stats: `documentStats()` in `src/features/notes/stats.ts` — a line scanner (not a full parse) run on
  the live text via `useDeferredValue`. Words are counted like word processors (whitespace tokens, "well-known"
  = 1), with `Intl.Segmenter` only for scripts without spaces (CJK, Thai). Link/image URLs and Markdown syntax
  are not words; code in fences is. Read time = ceil(words / 200). Headings = ATX + setext outside code.
  Only the save chip is a live region. On phones the headings count is hidden.
- Editor: `src/features/editor/` — CodeMirror 6 with GFM. Styling is a decoration plugin over the Lezer tree
  (`markdownStyles.ts`, classes `cm-md-*`), markers visible; M3 hides markers in the same plugin.
  Editor states are cached per note id for the session (cursor + undo survive note/mode switches).
- The editor is lazy-loaded (`EditorPane`); its chunk is ~500 kB / 174 kB gzip because lang-markdown always
  bundles the HTML/CSS/JS grammars. Vite's 500 kB warning is expected for that chunk; revisit in M5.
- Default keys removed because the spec reserves them: Mod-/, Mod-i, Mod-Enter, Alt-A (`extensions.ts`).
- lang-markdown defaults are on: Enter continues lists/quotes/tasks, Backspace removes markup, and
  pasting a URL over selected text makes a link. M2/M4 items should build on these, not duplicate them.
- Autosave: `Autosaver` (500 ms debounce, ordered, flush on note switch / page hide). Chip: Saved / Saving… /
  Not saved. Edits made in another tab are not picked up by an open editor yet.
- Read: `src/features/read/` — `renderMarkdown()` (remark-parse → remark-gfm → remark-rehype → rehype-sanitize
  with GitHub's schema → small polish step → stringify). Raw HTML in Markdown is dropped (supporting `<details>`,
  `<kbd>` etc. would need rehype-raw, not in the allowed list). External links open in a new tab; footnote
  links scroll in place and never change the URL fragment (reserved for share links). Remote images load
  lazily with no referrer. ReadView is lazy-loaded and also used for the right side of Split.
- Files: `src/features/files/`. Open file (picker, several at once) and drag & drop anywhere on the window
  create one note per file; the last opened is selected. Accepted: .md/.markdown/.mdown/.mkd/.mkdn/.mdwn/.txt
  and extension-less names (README); binary or > 10 MB files are skipped with a reason. Text is normalized
  (BOM stripped, CRLF → LF). The drop handler runs in the capture phase and stops CodeMirror's own file drop.
  Download saves the live text as `<title>.md` (title from the live text); Copy copies the Markdown source.
- Toast (`src/ui/Toast.tsx`, `useToast`): one message at a time in a polite live region, 4 s (errors 7 s).
- Not wired yet: Share link.
- Repo: https://github.com/tonygale-programming/hash-mark (public). Buy Me a Coffee URL in `src/config.ts` is a placeholder (TODO).
- Mobile layout (top bar, keyboard toolbar) is not built yet; under 1000px the desktop shell wraps and
  the sidebar becomes a drawer.
- Known: dev-only `npm audit` advisory in typescript-eslint's minimatch (moderate); not shipped.
