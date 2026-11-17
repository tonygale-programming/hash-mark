# Progress

Start every session: read this file, pick the next unchecked item, do it, test, commit, update this file.
How the shipped code works: docs/architecture.md.

## M0 — Scaffold (done)
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
- [x] Split mode (editor left, Read view right; desktop only)

## M2 — Writing help
- [x] Command registry + keymap
- [x] List/quote/task continuation, auto-close pairs
- [x] Slash menu
- [x] Shortcuts dialog (`?`), Mod+O / Mod+S, Sample and Clear (as Curly Brace)
- [ ] Selection toolbar (spec §4)
- [ ] Clickable task checkboxes in Read mode and the Split preview (the Write-mode checkbox is a live-preview widget, M4)

## M3 — Share
- [ ] Share link: lz-string → URL fragment, opens in Read mode, nothing sent to a server (spec §12).
      The toolbar button is shown but off until then.

## M4 — Live preview (spec §2), in this order
- [ ] Inline marks: hide emphasis, code, link and heading markers except on the active line / span
- [ ] Block widgets: task checkbox (clickable), divider, image; `[!NOTE]` shown as a callout label
- [ ] Show syntax toggle (Mod+/) switches marker hiding off
- [ ] Synced scroll in Split (map by source line: `data-line` from the Read pipeline)

## M5 — Paste (spec §7)
- [x] URL over selected text → link (lang-markdown)
- [ ] Rich HTML → Markdown (turndown + turndown-plugin-gfm)
- [ ] TSV/CSV → table (papaparse)
- [ ] Code → fenced block with a detected language
- [ ] Image paste. Needs a decision first: images need blob storage (Dexie schema v2), and share links
      and Download cannot carry local images.

## M6 — Phone layout (spec §10, §13)
- [ ] Top bar (back, note title, Write | Read, ⋯ menu); Sample, Clear, Open file move into ⋯
- [ ] Keyboard toolbar above the on-screen keyboard (visualViewport), 44px targets

## M7 — Polish
- [ ] PWA (vite-plugin-pwa), offline
- [ ] Code highlighting (Shiki, lazy)
- [ ] KaTeX (lazy) + slash item Math + `$` auto-close
- [ ] Mermaid (lazy) + slash item Diagram
- [ ] Command palette (Mod+Shift+P), on `searchCommands`
- [ ] Accessibility pass, Lighthouse ≥ 95

## Next up
M2 — Selection toolbar (spec §4):
- A floating pill over a non-empty selection: Bold, Italic, Strikethrough, Inline code, Link (registry
  Text commands, `isActive` for the pressed state), then "Turn into ▾".
- "Turn into" is an explicit id list, like `SLASH_ITEM_IDS`: Heading 1–3, Bulleted, Numbered, To-do,
  Quote, Code block. Those commands get `isActive` so the button names the current block type.
- Render it with React inside a CodeMirror tooltip (`showTooltip`, `createRoot` on the tooltip DOM),
  reusing `ui/Button` and `ui/Tooltip` rather than hand-built DOM.
- Show it after the mouse is released, not while dragging. On touch it goes below the selection (the
  system menu is above).

## Known limits
- In the editor `[!NOTE]` still looks like a link (fixed by live preview, M4).
- Raw HTML in Markdown is dropped in Read mode.
- Edits made in another tab are not picked up by an open editor; the later save wins.
- The phone toolbar wraps to several rows until the phone layout (M6).
- The light-mode focus ring is under 3:1 in both apps (decide a fix together with Curly Brace).
- Buy Me a Coffee URL in `src/config.ts` is a placeholder (TODO).
- Dev-only `npm audit` advisory in typescript-eslint's minimatch (moderate); not shipped.

## Proposed improvements (not scheduled; pick and move into a milestone)
1. Error boundary around the lazy editor and Read view: after a deploy, an open tab that loads a chunk
   with an old hash shows a blank page. Show "Reload to update" instead. Small.
2. Keep notes safe: ask for persistent storage (`navigator.storage.persist()`; Safari can evict
   IndexedDB after 7 days unused); "Export all notes" as one JSON file; Undo in the delete toast
   instead of a permanent delete.
3. Two tabs: reload the editor from IndexedDB when it has no unsaved edits; warn when it has.
4. Raw HTML in Read mode (`<details>`, `<kbd>`, `<br>` in tables, common in AI-written Markdown).
   Needs rehype-raw, which is not on the allowed list.
5. Command palette groundwork: the remaining actions as commands (toggle theme, delete note, search
   notes), and `isEnabled` on app commands so Clear / Download state lives in one place.
6. Type-aware lint: `no-floating-promises` and `no-misused-promises`.
7. e2e on a phone viewport and WebKit once the phone layout exists.
8. z-index tokens (29, 30, 40, 50 are scattered), together with Curly Brace since tokens are shared.

## Repo
https://github.com/tonygale-programming/hash-mark (public). Push to `main` deploys to GitHub Pages.
