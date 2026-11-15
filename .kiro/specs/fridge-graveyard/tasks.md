# Implementation plan: Fridge Graveyard

- [x] 1. Data layer
  - [x] 1.1 Create `data.js` with 33 ingredients (EN + HU lowercase aliases, shelf life in days), `FREEZER_DAYS = 90`, `UNKNOWN_DAYS = 5`
  - [x] 1.2 Add 22 rescue recipes (name, emoji, minutes, uses, how); every `uses` entry is an ingredient key
  - _Requirements: 1.1, 1.2, 1.3, 3.3_

- [x] 2. Pure logic (`logic.js`)
  - [x] 2.1 DST-safe ISO date helpers: `todayISO`, `addDays`, `daysLeft`, `isISODate`
  - [x] 2.2 `status` and `describe` with four states
  - [x] 2.3 `recognise` (Unicode whole-word, plural, longest alias) and `suggestShelfLife`
  - [x] 2.4 `sortItems`, `matchRecipes` (urgency scoring, never expired, limit 4)
  - [x] 2.5 `monthStats` (eaten, binned, rescue rate, money binned)
  - [x] 2.6 `sanitiseState` for both storage loading and import
  - _Requirements: 1.5, 2.1–2.3, 3.1–3.4, 5.1–5.3, 6.4_

- [x] 3. Tests (`tests.html`)
  - [x] 3.1 Fixed today `2026-10-31`; groups for dates, status, recognise, shelf life, sort, recipes, stats, import
  - [x] 3.2 Data-integrity checks
  - [x] 3.3 Title `PASS n/n` for headless runs (currently 58/58)
  - _Requirements: all logic requirements_

- [x] 4. UI (`index.html`, `app.js`)
  - [x] 4.1 Add form with live date suggestion, validation, `aria-invalid`, focus handling
  - [x] 4.2 Inventory list with filters, status text for screen readers, action buttons with accessible names
  - [x] 4.3 Rescue mission section
  - [x] 4.4 Graveyard with Still good +2d / Ate it / Bin it
  - [x] 4.5 Stats cards and tab-title counter; re-render on `visibilitychange`
  - [x] 4.6 localStorage with schema version; export, import, demo fridge, two-step delete
  - _Requirements: 1.4, 1.6, 1.7, 2.4–2.7, 3.5, 4.1–4.4, 5.4, 6.1–6.6, 8.1–8.4_

- [x] 5. Light, colourful redesign with photos
  - [x] 5.1 White background, colour tokens (green / orange / purple / red / blue) with ≥ 4.5:1 contrast
  - [x] 5.2 Download Unsplash photos into `assets/` (hero, shelves, rescue, bowl, empty-fridge), all `alt=""`
  - [x] 5.3 Hero with photo and status legend; tinted stats cards; photo strip in Add food
  - [x] 5.4 Rescue banner and colour-rotating recipe cards
  - [x] 5.5 Tinted item rows by status; light graveyard with grass and tombstones
  - [x] 5.6 "Why bother?" fact card with source; empty-fridge photo in the empty state
  - [x] 5.7 Mobile layout (≤ 640 px) without horizontal scroll; `prefers-reduced-motion`
  - [x] 5.8 Light theme for `tests.html`
  - _Requirements: 7.1–7.5, 8.5_

- [x] 6. Kiro setup
  - [x] 6.1 Steering: `fridge-graveyard.md` (always), `fridge-graveyard-data.md` (when `data.js` changes)
  - [x] 6.2 Hooks: test guard, UI guard, spec sync, add rescue recipes (manual)
  - [x] 6.3 README section "Built with Kiro"

- [ ] 7. Possible next steps
  - [ ] 7.1 PWA manifest and service worker for installing on a phone
  - [ ] 7.2 Barcode / receipt scanning to add items faster
  - [ ] 7.3 Optional Hungarian UI language
