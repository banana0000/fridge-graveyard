---
inclusion: always
---

# Fridge Graveyard: project rules

Read the spec first: `.kiro/specs/fridge-graveyard/` (requirements, design, tasks).

## Stack
- Plain HTML, CSS and JavaScript. **No frameworks, no npm, no build step, no CDN.** `index.html` must work when opened from disk, offline.
- `'use strict'`, `const`/`let`, arrow functions, template literals. No modules (file:// support), so each layer exposes one global.

## Layers (strict)
`data.js` (`FRIDGE_DATA`) → `logic.js` (`Fridge`) → `app.js` (UI).
- `data.js`: data only, no functions.
- `logic.js`: **pure**. No `document`, `window`, `localStorage` or `new Date()` without a parameter. Anything that depends on today takes `today` as an argument. Export new functions in the returned object.
- `app.js`: the only place that touches the DOM and storage. Business rules belong in `logic.js`, not here.

## Dates
- Always ISO `YYYY-MM-DD` strings. Calculate with `Fridge.addDays` and `Fridge.daysLeft` (UTC-based, DST-safe). Never subtract `Date` objects in local time.

## Security
- Every user string inserted with `innerHTML` goes through `esc()`. Numbers and constants from `data.js` are the only exceptions.
- Imported or stored state always passes through `Fridge.sanitiseState`.
- Nothing is ever sent over the network.

## State and storage
- Key `fg_state`, `version: 1`. If you change the shape, bump `SCHEMA_VERSION` and teach `sanitiseState` to read the old shape.
- Call `saveState()` and then `render()` after every change.

## Visual design (light and colourful)
- White background (`--bg: #fff`), tinted cards, rounded corners (`--radius: 16px`), soft shadow (`--shadow`).
- The meaning of colours is fixed: **green** fresh/good/primary, **orange** eat soon, **purple** today, **red** expired/danger, **blue** neutral/active filter. Use the `--x` (ink) and `--x-tint` (background) tokens; don't introduce new hex values in rules.
- Ink on tint and on white must reach **4.5:1**. Text on a photo needs a dark gradient overlay.
- Photos live in `assets/` as local `.jpg` files (~800 px wide, < 300 KB), sourced from Unsplash, with `alt=""` because they are decorative, and `loading="lazy"` below the hero. Never hot-link remote images.
- Emoji are decoration: wrap them in `aria-hidden="true"` and keep the meaning in text.

## Accessibility
- Keyboard first: visible `:focus-visible` ring, 44 px touch targets, "Skip to your food" link.
- Announce outcomes with `say()` (polite live region).
- Icon buttons need an `aria-label` that includes the item name.
- Status must be readable without colour (visually-hidden label).
- Mobile: no horizontal scroll at 360 px.

## Tests
- Logic changes need tests in `tests.html` (fixed today `2026-10-31`).
- Run headless: `msedge --headless=new --dump-dom file:///<path>/tests.html`, then check that the title is `PASS n/n`.
- Keep the check count in `README.md` and `design.md` in sync.

## Writing style
- UI text: short, friendly, slightly spooky ("laid to rest", "Rescue mission"), never preachy. English UI; ingredient aliases are English + Hungarian.
