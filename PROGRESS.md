# Progress

Start every session: read this file, pick the next unchecked item, do it, test, commit, update this file.

## M0 — Scaffold
- [x] Vite + React + TS strict, ESLint + Prettier, Vitest + Testing Library, Playwright
- [x] tokens.css from docs/design-tokens.md, self-hosted fonts, theme toggle (data-theme, saved in localStorage, respects prefers-color-scheme)
- [x] App shell matching the layout: header, toolbar, sidebar, editor pane placeholder, status bar; responsive under 1000px
- [x] Base UI components: Button (outline/ghost), SegmentedControl, Toggle, Chip, KeyCap, Tooltip

## M1 — Notes and editor core
- [x] Dexie store: notes {id, title, markdown, updatedAt}; New note, list, select, search, delete
- [x] CodeMirror 6 editor (Markdown + GFM), autosave with "Saved" chip
- [ ] Read mode via unified pipeline (sanitized)
- [ ] Open .md file (file picker + drag & drop), Download .md, Copy
- [ ] Status bar stats (words, read time, headings)

## M2 — Writing help
- [ ] Command registry + keymap
- [ ] List/quote/task continuation, auto-close pairs
- [ ] Slash menu
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
- [ ] Command palette, ? cheat sheet, Shortcuts dialog
- [ ] Accessibility pass, Lighthouse ≥ 95

## Next up
M1 — Read mode via unified pipeline (sanitized). Replace `Preview` in `src/features/shell/EditorPane.tsx`
(used by Read and the right side of Split); it receives the live `markdown` (unsaved edits included).

## Notes
- Notes live in IndexedDB `hash-mark` (Dexie, `src/features/notes/db.ts`). The title is derived from the first
  line with text (`title.ts`) and stored for listing. The welcome note (`welcome.md`) is seeded once, on
  database creation.
- Delete asks for confirmation (`ConfirmDialog`, native `<dialog>`); there is no trash or undo.
- Search matches title and content. The selected note is remembered per device in localStorage.
- Status bar stats are hidden until the "Status bar stats" item.
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
- Not wired yet: Open file, Share link, Shortcuts, Download, Copy.
- Repo: https://github.com/tonygale-programming/hash-mark (public). Buy Me a Coffee URL in `src/config.ts` is a placeholder (TODO).
- Mobile layout (top bar, keyboard toolbar) is not built yet; under 1000px the desktop shell wraps and
  the sidebar becomes a drawer.
- Known: dev-only `npm audit` advisory in typescript-eslint's minimatch (moderate); not shipped.
