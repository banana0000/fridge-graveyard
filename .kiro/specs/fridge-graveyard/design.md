# Design: Fridge Graveyard

## Overview

A static single-page app: plain HTML, CSS and JavaScript, no build step, no dependencies, no server. Opening `index.html` from disk works. Three script layers are loaded in order, and each may only use the layers before it.

```
data.js   →  logic.js  →  app.js
(FRIDGE_DATA)  (Fridge, pure)  (DOM, state, storage)
```

| File | Responsibility | May touch |
|---|---|---|
| `data.js` | `FRIDGE_DATA`: `INGREDIENTS` (key → aliases, days), `RECIPES`, `FREEZER_DAYS`, `UNKNOWN_DAYS` | nothing |
| `logic.js` | `Fridge`: pure functions. Anything that depends on "today" takes it as a parameter | `FRIDGE_DATA` |
| `app.js` | rendering, events, `state`, `localStorage`, export/import, demo | `Fridge`, `FRIDGE_DATA`, DOM |
| `style.css` | light, colourful theme | – |
| `assets/*.jpg` | local Unsplash photos (decorative) | – |
| `tests.html` | logic and data-integrity tests with fixed today `2026-10-31` | `Fridge`, `FRIDGE_DATA` |

## Data model

```js
state = {
  version: 1,
  items: [{ id, name /*≤60*/, qty /*≤20*/, location /*fridge|freezer|pantry*/,
            expiry /*YYYY-MM-DD*/, price /*number|null*/, added /*YYYY-MM-DD*/ }],
  history: [{ name, outcome /*eaten|binned*/, price, date }],   // ≤ 1000 entries
  currency: 'EUR' | 'USD' | 'GBP' | 'HUF',
}
```

Stored as JSON under `localStorage['fg_state']`. Every load goes through `Fridge.sanitiseState`, the same function as import, so corrupt or tampered storage cannot break rendering.

## Key algorithms

**Dates.** Dates are ISO strings. `toUTC` turns them into UTC midnight, so `daysLeft = round((expiry − today) / 86 400 000)` is DST-safe. `todayISO()` uses local time, because "today" is the user's calendar day.

**Recognition.** For every alias, the regex is `(^|[^\p{L}])alias(s|es)?(?=$|[^\p{L}])` with flags `iu`. It is Unicode-aware, so Hungarian accents count as letters ("tojás"), and "Eggplant" does not match "egg". The longest matching alias wins.

**Recipe ranking.** For each recipe, pick the most urgent live item for each ingredient it uses.
`score = Σ urgency + used / uses.length`, where urgency is zombie 3, haunted 2, fresh 0.5, dead excluded.
Keep only recipes that rescue at least one zombie or haunted item, sort by score desc and then minutes asc, take 4.

**Stats.** History entries whose `date` starts with the current `YYYY-MM`.

## UI structure

1. **Hero:** full-width photo (`assets/hero.jpg`) with a dark gradient overlay, white title, and a status legend as white pills.
2. **Stats:** a grid of tinted cards, each in its own colour. The `.warn` and `.bad` classes override with orange and red.
3. **Add food:** a panel with a photo strip on the left (`shelves.jpg`, absolutely positioned so it never stretches the panel; it becomes a top strip under 640 px).
4. **Rescue mission:** a photo banner (`rescue.jpg`) with an orange gradient, then recipe cards whose header tint rotates orange → green → blue → purple.
5. **Your food:** pill filters; each item is a tinted row with a coloured left border by status and the emoji in a white circle.
6. **Graveyard:** a lavender "sky" with green "grass" at the bottom, and white-to-grey tombstones.
7. **Why bother?:** a yellow fact card with `bowl.jpg`.
8. **Footer:** currency, demo, export/import, delete everything.

### Colour tokens (`style.css :root`)

| Meaning | Ink | Tint |
|---|---|---|
| Fresh / good / primary | `--green #15803d` | `#e7f8ed` |
| Eat soon / warning | `--orange #c2410c` | `#fff1e3` |
| Today | `--purple #7e22ce` | `#f4ebff` |
| Expired / bad / danger | `--red #be123c` | `#ffe9ee` |
| Neutral / active filter | `--blue #1d4ed8` | `#e8f0ff` |

Every ink colour has at least 4.5:1 contrast on white and on its own tint.

## Error handling

- Storage blocked: catch the error, show a status message and keep working in memory.
- Import with an invalid file: show "That file is not a valid Fridge Graveyard backup."; the state is left untouched.
- Every string rendered with `innerHTML` goes through `esc()`.

## Testing strategy

`tests.html` runs 58 assertions in groups: dates (including both EU DST switches), status, recognise (EN + HU, false positives), shelf life, sort, recipes, stats, import sanitising (including an XSS payload kept as text) and data integrity (recipe ingredients exist, no duplicate aliases, lowercase aliases, every ingredient used by a recipe, unique recipe names). The page title becomes `PASS n/n` or `FAIL …`, so it can run headless:

```
msedge --headless=new --dump-dom file:///…/tests.html
```
