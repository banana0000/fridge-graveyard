---
inclusion: fileMatch
fileMatchPattern: "data.js"
---

# Editing `data.js`: ingredients and recipes

## Adding an ingredient
```js
key: { aliases: ['english', 'plural-if-irregular', 'magyar'], days: N },
```
- `key`: singular English, lowercase, a single word if possible (`mushroom`, not `mushrooms`).
- `aliases`: **all lowercase**, English **and** Hungarian, with accents (`tojás`, `tejföl`). Regular English plurals (+s, +es) are matched automatically, so don't list them. Add irregular forms (`berries`) and common product names (`cheddar`, `trappista`, `virsli`).
- An alias may appear **only once** across all ingredients (a test checks this). Watch for overlaps: a longer alias beats a shorter one, so "sour cream" belongs under `cream`, not `milk`.
- Whole-word matching: "ham" does not match "Hamburger". Check new short aliases against false positives and add a test in `tests.html` → group `recognise`.
- `days`: a typical, cautious shelf life in the fridge after buying/opening. Base it on food-safety guidance (raw mince 1, raw chicken/fish 2, opened milk 7, hard cheese 21). Round down if unsure.
- Every ingredient must be used by **at least one recipe** (a test checks this). Add a recipe in the same change.

## Adding a recipe
```js
{ name: 'Unique name', emoji: '🍲', minutes: 20, uses: ['key1', 'key2'],
  how: 'One or two plain sentences. Metric units, °C.' },
```
- `name` unique; one food emoji; realistic `minutes`.
- `uses`: only existing ingredient keys. Put the core ingredients first, then optional extras. 4–8 entries work best for ranking.
- `how`: imperative, at most 2 sentences, no quantities that need a scale, add a safety note where relevant (reheat once, cook through).
- Prefer recipes that use *perishable* ingredients (`days ≤ 7`): that's what rescue is for.
- Hungarian classics are welcome (lecsó, rakott krumpli, paprikás).

## After editing
1. Open or run `tests.html` headless; the `data integrity` group must pass.
2. Update the counts in `README.md` ("33 ingredients", "22 rescue recipes") and in `design.md` / `tasks.md` if they changed.
