# Design tokens (from Curly Brace)

Implemented in `src/styles/tokens.css` (light on `:root, [data-theme="light"]`, dark on `[data-theme="dark"]`).

## Colors (light / dark)
| token | light | dark | usage |
|---|---|---|---|
| background | #e3e4e8 | #17181c | page ground |
| surface | #ffffff | #1f2025 | panes, buttons, menus |
| surface-hover | #f0f1f4 | #2b2d34 | hover fill |
| surface-sunken | #f4f5f7 | #17181c | recessed strips, code blocks |
| border | #000000 | #d5d6db | 1.5px outline of every control and pane |
| border-subtle | #cfd1d7 | #3b3d45 | decorative dividers only |
| text | #000000 | #ffffff | primary text |
| text-muted | #50525a | #a6a8b1 | secondary text |
| text-faint | #6c6f78 | #8c8e98 | placeholders, hidden-syntax markers, counts (on surface only) |
| accent | #ffbf00 | #ffbf00 | means ON: selected segment, toggle on, selected item, checked task |
| accent-text | #000000 | #000000 | text on accent |
| accent-soft | #fff3c9 | #40320a | text selection, drop target, hover hint |
| primary | #000000 | #ffffff | toast, tooltip fill |
| primary-text | #ffffff | #17181c | text on primary |
| focus | #000000 | #ffffff | 2px focus ring, 2px offset, accent in the gap |
| success | #0a5c1f | #99ffb3 | success text |
| success-fill | #99ffb3 | #99ffb3 | "Saved" chip |
| on-success | #0a5c1f | #0a5c1f | text on success-fill |
| danger | #b3261e | #ffb4ab | error text/border |
| danger-fill | #b3261e | #b3261e | error chip |
| on-danger | #ffffff | #ffffff | text on danger-fill |
| danger-soft | #fdeceb | #3b1512 | error card background |
| scrim | rgb(0 0 0 / .32) | rgb(0 0 0 / .56) | backdrop behind drawers and dialogs |

## Type
- UI: "Roboto Variable", system-ui, sans-serif. Code/markers: "Roboto Mono Variable", ui-monospace, monospace.
- label 500 13/16 (buttons, chips) · status 400 13/16 (figures 500) · body 400 14/20 · title 600 14/20 · hint 400 12/16 · kbd 500 11/16 mono
- Document (editor/read): body 400 16/26; H1 700 32/40; H2 600 22/30; H3 600 18/26; code 400 14/22 mono.
- Wordmark: "#Hash Mark", 700 20/28 UI font.

## Spacing / radius / size
- space: 2, 4, 8, 12, 16, 20, 24, 32, 48 px. Controls in a row 8px apart; rows and panes 16px apart; page gutter 48px (16px on mobile).
- radius: pill 999px (all controls), pane 12px, card 8px, small 4px.
- control-height 32px (40px on touch), chip-height 24px, icon 20px, border-width 1.5px.

## States
- Hover: fill → surface-hover; nothing moves.
- Selected: accent fill + inset 1.5px border outline.
- Disabled: 40% opacity, no hover.
- Motion < 150ms, off with prefers-reduced-motion.
- Icons: Lucide (`lucide-react`), 20px, currentColor, stroke 1.75. Always with a label except theme / icon-only buttons with aria-label.
