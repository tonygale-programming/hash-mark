# Design tokens: the Brace design system

Hash Mark and Curly Brace use **one design system**: the same tokens (names and values), type,
spacing, shapes, icons and component states. Implemented in `src/styles/tokens.css`, mirroring
Curly Brace's `styles.css` ("Theme" section). Change a shared value in both apps together.

**The only difference is the accent family.** Hash Mark's blue is Curly Brace's yellow with the red
and blue channels swapped, so every contrast pair behaves the same:

| token | Curly Brace (light / dark) | Hash Mark (light / dark) | usage |
|---|---|---|---|
| accent | #ffbf00 / #664c00 | #00bfff / #004c66 | the one main action (New note), and anything on or selected |
| accent-text | #000000 / #ffffff | #000000 / #ffffff | text on accent (9.9:1 light, 9.4:1 dark) |
| accent-soft | #fff3c9 / #40320a | #c9f3ff / #0a3240 | text selection, drop target, hover hint |
| focus | #ffbf00 | #00bfff | keyboard focus ring, both themes |

## Colours (shared)
Each is written once as `light-dark(<light>, <dark>)`; `color-scheme` picks one. No `data-theme`
follows the system; `data-theme="light" | "dark"` (saved choice) forces one.

| token | light | dark | usage |
|---|---|---|---|
| background | #e3e4e8 | #17181c | page ground |
| surface | #ffffff | #1f2025 | panes, buttons, menus |
| surface-hover | #f0f1f4 | #2b2d34 | hover fill |
| surface-sunken | #f4f5f7 | #17181c | recessed strips, code blocks |
| border | #000000 | #d5d6db | 1.5px outline of every control and pane |
| border-subtle | #cfd1d7 | #3b3d45 | dividers, neutral chip, key caps |
| text | #000000 | #ffffff | primary text |
| text-muted | #50525a | #a6a8b1 | secondary text, ghost links |
| text-faint | #6c6f78 | #8c8e98 | placeholders, Markdown markers, counts (on surface only) |
| primary | #000000 | #ffffff | toast, tooltip fill |
| primary-text | #ffffff | #17181c | text on primary |
| success | #0a5c1f | #99ffb3 | success text |
| success-fill | #99ffb3 | #99ffb3 | "Saved" chip |
| on-success | #0a5c1f | #0a5c1f | text on success-fill |
| danger | #b3261e | #ffb4ab | error text/border |
| danger-fill | #b3261e | #b3261e | error chip, error toast, destructive confirm |
| on-danger | #ffffff | #ffffff | text on danger-fill |
| danger-soft | #fdeceb | #3b1512 | error card background |
| scrim | rgb(0 0 0 / .4) | same | backdrop behind dialogs and the notes drawer |

## Type
- UI: "IBM Plex Sans" (400, 500, 600; italics 400/600). Code and Markdown markers: "IBM Plex Mono" (400, 500, 600).
  Self-hosted via `@fontsource/ibm-plex-sans` / `-mono` (Latin, Cyrillic, Greek, Vietnamese by unicode-range).
- label 500 13/16 (buttons, chips) · status 400 13/16 (figures 500, tabular) · body 400 14/20 · title 600 14/20 ·
  hint 400 12/16 · kbd 500 11/16 mono.
- Brand: symbol drawn as a Lucide icon (24px, stroke 2.25) + name in mono 600 22/32, letter-spacing -0.02em;
  tagline 500 13/16 muted. Hash Mark: `#` + "Hash Mark", "Markdown, made readable." Curly Brace: `{brace}`.
- Hash Mark document (editor and Read): body 400 16/26; H1 600 32/40; H2 600 22/30; H3 600 18/26; code 400 14/22 mono;
  bold 600.

## Spacing / shapes / sizes
- space: 2, 4, 8, 12, 16, 20, 24, 32, 48 px: the only values for gaps, paddings and margins.
- Controls in a row 8px apart; rows and panes 16px apart (12px under 860px); page gutter 48px (16px under 860px);
  page max width 1440px.
- radius: pill 999px (all controls), pane 12px, card 8px, small 4px.
- control-height 32px (40px on touch), chip-height 24px, icon 16px, border-width 1.5px, focus-width 1.5px.

## Components and states
- Button: outline pill, padding 0 16; with a leading icon 12 left, 8 between icon and label.
  Ghost (header links): no border, muted text; hover surface fill and text colour; labels hidden under 860px.
  Main (one per screen): accent fill, ink border, accent-text; hover brightness 1.05.
- Hover: fill → surface-hover; nothing moves.
- On / selected: accent fill + accent-text. Segmented selection adds an inset 1.5px ink outline, so it never
  depends on telling the accent from white. A toggle that is on shows a check icon.
- Focus: 1.5px accent ring, 1.5px away from the control. Segmented controls ring the whole pill; the editor
  pane rings while you type in it.
- Disabled: 40% opacity, not-allowed cursor, no hover.
- Status chip: 24px pill, dot in the text colour; neutral = subtle border + muted text; success/danger filled.
- Drag over: pane fills accent-soft with a 4px accent ring.
- Toast: ink pill, bottom centre, 40px min height. Dialog: 420px, padding 24, pane radius.
- Motion ≤ 150ms, off with prefers-reduced-motion.
- Icons: Lucide, 16px, currentColor, stroke 2.25 (1.5px on screen); always with a label except icon-only
  buttons with aria-label.

## Known gap (both apps)
The focus ring in light mode is below WCAG's 3:1 for focus indicators: blue 1.7:1 on the page ground and
2.1:1 on white (Curly Brace's yellow: 1.3:1 and 1.65:1). Dark mode is fine (7.7–8.4:1). Fix in both apps together.
