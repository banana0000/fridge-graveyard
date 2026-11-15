# 🪦 Fridge Graveyard

**Eat it before it haunts you.**

Households waste about **79 kg of food per person every year**, around 60% of all food waste (UNEP Food Waste Index Report 2024). Much of it is food that was simply forgotten at the back of the fridge.

Fridge Graveyard makes that food visible before it's too late:

- **Quick add with smart dates.** Type "eggs", "tojás" or "cherry tomatoes" and the use-by date is pre-filled from a typical shelf life (90 days in the freezer). It understands English and Hungarian.
- **Know what's dying.** Every item is 🥬 *Fresh*, 👻 *Eat soon* (1–2 days), 🧟 *Today* or 💀 *Expired*, sorted by urgency. The tab title shows how many need attention.
- **Rescue mission.** Recipe ideas that use exactly the food that's about to go off (22 offline recipes, from French toast to Hungarian lecsó).
- **The graveyard.** Expired food becomes a tombstone. Check it: "best before" often means still fine, so you can choose *Still good +2d*, *Ate it* or *Bin it*.
- **Monthly scoreboard.** Rescued vs binned, rescue rate, and money binned if you enter prices.
- **Your data stays yours.** Everything lives in your browser. JSON export and import, no account, no server, works offline.

## Run it

Open `index.html` in a browser. No install, no build. Press **Load demo fridge** at the bottom to try it out.

Tests: open `tests.html` (58 checks), or run headless:
`msedge --headless=new --dump-dom file:///path/to/fridge-graveyard/tests.html`. The page title says `PASS 58/58`.

## How it works

| File | Job |
|---|---|
| `data.js` | 33 ingredients (EN + HU aliases, shelf life) and 22 rescue recipes |
| `logic.js` | pure functions: DST-safe dates, status, ingredient recognition, recipe ranking, stats, import sanitising |
| `app.js` | UI, state and localStorage |
| `style.css` | light, colourful theme (green fresh · orange eat soon · purple today · red expired) |
| `assets/` | local food photos from [Unsplash](https://unsplash.com) (Unsplash License), so it works offline |
| `tests.html` | logic and data-integrity tests with a fixed "today" |

## Built with Kiro

- **Spec:** `.kiro/specs/fridge-graveyard/` (requirements in EARS format, design, tasks)
- **Steering:** `.kiro/steering/fridge-graveyard.md` (layers, conventions, accessibility) and `fridge-graveyard-data.md` (how to add ingredients and recipes)
- **Hooks** (`.kiro/hooks/fridge-*.kiro.hook`):
  - *test guard*: on `logic.js`/`data.js` edits, checks purity, data rules and test coverage
  - *UI guard*: on UI edits, checks escaping, layering, storage schema and accessibility
  - *spec sync*: ticks finished tasks and keeps the numbers in the docs accurate
  - *add rescue recipes* (manual): finds ingredients with few recipes and adds more
