# Hash Mark — project memory

Markdown app: open, read, write, share Markdown. Web first (PWA), mobile later via Capacitor.
Sibling app: Curly Brace (JSON formatter) — same design system and layout patterns.

## Commands
- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run lint` / `npm run format`
- `npm test` — Vitest unit tests; `npm run test:e2e` — Playwright

## Stack
React 19 + TypeScript (strict) + Vite. CodeMirror 6 (`@codemirror/lang-markdown`, Lezer GFM).
Rendering: unified (remark-parse, remark-gfm, remark-rehype, rehype-sanitize, rehype-stringify).
Storage: IndexedDB via Dexie. Styling: plain CSS + CSS variables from `src/styles/tokens.css` (no Tailwind).
Fonts self-hosted: @fontsource-variable/roboto, @fontsource-variable/roboto-mono (no external requests).

## Key decisions (don't change without asking)
- Modes: **Write** (default, live preview) · **Split** (desktop only) · **Read**. No separate Source mode —
  a **Show syntax** toggle (`Mod+/`) keeps all markers visible in Write mode.
- One **command registry** (`src/commands/`) feeds slash menu, selection toolbar, keymap,
  mobile toolbar, command palette and cheat sheet. Never hard-code an action in one surface only.
- One document state (Markdown string) shared by all modes; switching never loses content or cursor.
- Local-first: nothing leaves the browser. Share link v1 = compressed content in URL fragment (`#`), no server.
- Design: Curly Brace tokens (see docs/design-tokens.md). Yellow accent means ON (selected/toggled), never a CTA.
  1.5px outlines, no shadows, no gradients, pill controls 32px (40px touch), Roboto / Roboto Mono.

## Conventions
- Small components, feature folders: `src/features/<feature>/`.
- Accessibility: real <button>/<a>/<input>, aria-label on icon-only buttons, visible focus ring, 4.5:1 contrast.
- Sentence-case labels, verb-first, no emoji, no exclamation marks.
- After each task: lint + tests + build pass, update PROGRESS.md, commit (conventional commits).
- Ask before adding any dependency not in docs/dependencies.md.

## Docs
- docs/editor-ux-spec.md — full UX spec (modes, slash menu, toolbar, shortcuts, paste, mobile, screen layout)
- docs/design-tokens.md — colors (light/dark), type, spacing, radius
- docs/dependencies.md — allowed dependencies and how we work
- PROGRESS.md — milestones and next steps (read this first in every new session)
