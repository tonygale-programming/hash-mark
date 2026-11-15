# Dependencies and how we work

## Allowed dependencies
Ask before adding anything not listed here.

react, react-dom, typescript, vite, @vitejs/plugin-react, eslint (+ typescript-eslint, react-hooks), prettier,
vitest, @testing-library/react, @playwright/test, codemirror, @codemirror/* (state, view, commands, language,
lang-markdown, autocomplete, search), @lezer/markdown, unified, remark-parse, remark-gfm, remark-rehype,
rehype-sanitize, rehype-stringify, dexie, dexie-react-hooks, @fontsource/ibm-plex-sans,
@fontsource/ibm-plex-mono (replaced the Roboto packages to match Curly Brace), lz-string, turndown, turndown-plugin-gfm, papaparse, vite-plugin-pwa, shiki,
katex, mermaid.

Approved additions: lucide-react (icons); dev-only @types/react, @types/react-dom, @testing-library/dom,
@testing-library/jest-dom, @testing-library/user-event, jsdom, @eslint/js, globals, eslint-config-prettier,
fake-indexeddb (in-memory IndexedDB for Dexie unit tests).

## How we work
- Work in small steps; one PROGRESS.md item at a time unless told otherwise.
- After each step: lint, tests and build must pass; then update PROGRESS.md and commit.
- Write tests for logic (commands, parsing, storage) and one Playwright smoke test per milestone.
- If something in the spec is unclear or seems wrong, ask instead of guessing.
- Keep CLAUDE.md short and current; put details in docs/.
