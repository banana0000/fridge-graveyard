# Requirements: Fridge Graveyard

## Introduction

Households throw away about 79 kg of food per person every year, roughly 60% of all food waste (UNEP Food Waste Index Report 2024). Much of it is simply forgotten at the back of the fridge. Fridge Graveyard is a single-page, offline, account-free web app that shows what is about to go off, suggests recipes that use it, and turns expired food into a "graveyard" the user has to decide about. All data stays in the browser.

Requirements use the EARS format (WHEN / WHILE / IF / WHERE … THE SYSTEM SHALL …).

## Requirement 1: Add food with smart dates

**User story:** As a household member, I want to add food quickly with a sensible use-by date already filled in, so that logging groceries takes seconds.

**Acceptance criteria**
1. WHEN the user types a name that matches a known ingredient alias (English or Hungarian, whole word, optional English plural), THE SYSTEM SHALL pre-fill the use-by date with today + that ingredient's typical shelf life.
2. WHERE the location is "Freezer", THE SYSTEM SHALL suggest 90 days regardless of the ingredient.
3. IF the name does not match any ingredient, THEN THE SYSTEM SHALL suggest 5 days and tell the user to check the label.
4. WHEN the user has edited the date by hand, THE SYSTEM SHALL NOT overwrite it with a suggestion.
5. WHEN several aliases match, THE SYSTEM SHALL use the longest one ("sour cream" → cream, "tejföl" → cream, not milk).
6. IF the name is empty or the date is not a valid date, THEN THE SYSTEM SHALL refuse to add the item, mark the field `aria-invalid`, focus it and announce the problem.
7. WHEN an item is added, THE SYSTEM SHALL keep the chosen location for the next item and return focus to the name field.

## Requirement 2: Status and sorting

**User story:** As a user, I want to see at a glance what needs eating first.

**Acceptance criteria**
1. THE SYSTEM SHALL classify each item by days left: `< 0` Expired 💀, `0` Today 🧟, `1–2` Eat soon 👻, `≥ 3` Fresh 🥬.
2. THE SYSTEM SHALL compute days in UTC calendar days so that daylight-saving changes never shift a date.
3. THE SYSTEM SHALL sort items by days left, then by name.
4. THE SYSTEM SHALL show the status as text to screen readers, not only as colour or emoji.
5. WHILE any item is Eat soon, Today or Expired, THE SYSTEM SHALL show that count in the tab title, e.g. "(3) Fridge Graveyard".
6. WHEN the tab becomes visible again, THE SYSTEM SHALL re-render (the date may have changed overnight).
7. THE SYSTEM SHALL let the user filter the list by Fridge, Freezer, Pantry or All.

## Requirement 3: Rescue mission

**User story:** As a user, I want recipe ideas that use exactly the food that is about to go off.

**Acceptance criteria**
1. WHEN at least one recognised item is Today or Eat soon, THE SYSTEM SHALL show up to 4 recipes that use at least one such item.
2. THE SYSTEM SHALL rank recipes by urgency of the items they use (Today > Eat soon > Fresh), then by coverage, then by shorter cooking time.
3. THE SYSTEM SHALL list for each recipe: what it rescues, which other items it also uses, optional extras, time and a short method.
4. THE SYSTEM SHALL NEVER suggest using an expired item.
5. IF no item is urgent, THEN THE SYSTEM SHALL hide the Rescue mission section.

## Requirement 4: The graveyard

**User story:** As a user, I want expired food to stand out and force a decision, because "best before" food is often still fine.

**Acceptance criteria**
1. THE SYSTEM SHALL show every expired item as a tombstone in a separate Graveyard section, hidden when empty.
2. WHEN the user chooses "Still good +2d", THE SYSTEM SHALL set the use-by date to today + 2 days.
3. WHEN the user chooses "Ate it" or "Bin it", THE SYSTEM SHALL remove the item and record the outcome in the history.
4. WHEN the user removes a live item with ✕, THE SYSTEM SHALL remove it without recording history (added by mistake).

## Requirement 5: Monthly scoreboard

**Acceptance criteria**
1. THE SYSTEM SHALL show items in the kitchen, items needing eating within 2 days, expired items, rescued and binned this month, and the rescue rate (eaten ÷ (eaten + binned), rounded %).
2. IF nothing was eaten or binned this month, THEN THE SYSTEM SHALL show "–" for the rescue rate.
3. WHERE any history entry this month has a price, THE SYSTEM SHALL show the money binned in the chosen currency (EUR, USD, GBP, HUF; HUF without decimals).
4. THE SYSTEM SHALL keep at most the last 1000 history entries.

## Requirement 6: Data ownership

**Acceptance criteria**
1. THE SYSTEM SHALL store all state in `localStorage` under `fg_state` with a `version` field, and SHALL NOT send any data over the network.
2. IF storage is blocked or corrupt, THEN THE SYSTEM SHALL start with an empty state and warn that data will not persist.
3. WHEN the user exports, THE SYSTEM SHALL download a JSON backup named `fridge-graveyard-YYYY-MM-DD.json`.
4. WHEN the user imports a file, THE SYSTEM SHALL validate and sanitise it (drop items without a name or valid date, clamp string lengths, unknown location → fridge, unknown currency → EUR, invalid history dropped) and reject files that are not backups.
5. WHEN the user presses "Delete everything", THE SYSTEM SHALL require a second press within 4 seconds and keep the currency.
6. THE SYSTEM SHALL offer a "Load demo fridge" button with items in every status.

## Requirement 7: Look and feel

**User story:** As a user, I want a bright, friendly app that makes food look appetising, not a gloomy one.

**Acceptance criteria**
1. THE SYSTEM SHALL use a white background with colourful tinted cards: green = fresh/good, orange = eat soon, purple = today, red = expired/bad, blue = neutral.
2. THE SYSTEM SHALL show real food photos (hero, Add food, Rescue mission, the "Why bother?" fact and the empty fridge), stored locally in `assets/` so the app still works offline.
3. THE SYSTEM SHALL keep text contrast at least 4.5:1, including text over photos (use a dark gradient overlay).
4. THE SYSTEM SHALL treat the photos as decorative (`alt=""`) because the text carries the meaning.
5. THE SYSTEM SHALL work at 360 px width without horizontal scrolling.

## Requirement 8: Accessibility and safety

**Acceptance criteria**
1. THE SYSTEM SHALL be fully usable by keyboard, with a visible focus ring and a "Skip to your food" link.
2. THE SYSTEM SHALL announce results of actions in a polite live region.
3. THE SYSTEM SHALL give every icon-only button an accessible name that includes the item name.
4. THE SYSTEM SHALL escape every user-provided string before inserting it into HTML.
5. THE SYSTEM SHALL respect `prefers-reduced-motion`.
