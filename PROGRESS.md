# Progress

Start every session: read this file, pick the next unchecked item, do it, test, commit, update this file.

## M0 — Scaffold
- [x] Vite + React + TS strict, ESLint + Prettier, Vitest + Testing Library, Playwright
- [x] tokens.css from docs/design-tokens.md, self-hosted fonts, theme toggle (data-theme, saved in localStorage, respects prefers-color-scheme)
- [x] App shell matching the layout: header, toolbar, sidebar, editor pane placeholder, status bar; responsive under 1000px
- [x] Base UI components: Button (outline/ghost), SegmentedControl, Toggle, Chip, KeyCap, Tooltip

## M1 — Notes and editor core
- [x] Dexie store: notes {id, title, markdown, updatedAt}; New note, list, select, search, delete
- [ ] CodeMirror 6 editor (Markdown + GFM), autosave with "Saved" chip
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
M1 — CodeMirror 6 editor (Markdown + GFM), autosave with "Saved" chip. Use `updateNote()` from
`src/features/notes/notesStore.ts` (re-derives the title). Replace the `<pre>` placeholder in `EditorPane`.

## Notes
- Notes live in IndexedDB `hash-mark` (Dexie, `src/features/notes/db.ts`). The title is derived from the first
  line with text (`title.ts`) and stored for listing. The welcome note (`welcome.md`) is seeded once, on
  database creation.
- Delete asks for confirmation (`ConfirmDialog`, native `<dialog>`); there is no trash or undo.
- Search matches title and content. The selected note is remembered per device in localStorage.
- Status bar stats are hidden until the "Status bar stats" item; the Saved chip is static until autosave.
- Not wired yet: Open file, Share link, Shortcuts, Download, Copy.
- Repo: https://github.com/tonygale-programming/hash-mark (public). Buy Me a Coffee URL in `src/config.ts` is a placeholder (TODO).
- Mobile layout (top bar, keyboard toolbar) is not built yet; under 1000px the desktop shell wraps and
  the sidebar becomes a drawer.
- Known: dev-only `npm audit` advisory in typescript-eslint's minimatch (moderate); not shipped.
