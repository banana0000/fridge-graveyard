/* 🪦 Fridge Graveyard – pure logic (no DOM, no storage).
 * Exposes global `Fridge`. Every function that depends on "today" takes it as a parameter,
 * so it can be tested with fixed dates.
 */
'use strict';

const Fridge = (() => {
  const DAY = 86400000;
  const { INGREDIENTS, RECIPES, FREEZER_DAYS, UNKNOWN_DAYS } = FRIDGE_DATA;

  // ---------- dates (ISO 'YYYY-MM-DD', computed in UTC so DST never shifts a day) ----------
  const pad = n => String(n).padStart(2, '0');
  const isISODate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(toUTC(s));

  function todayISO(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function toUTC(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  }
  function addDays(iso, n) {
    const t = new Date(toUTC(iso) + n * DAY);
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  function daysLeft(expiry, today) {
    return Math.round((toUTC(expiry) - toUTC(today)) / DAY);
  }

  // ---------- status ----------
  const STATUS = {
    dead:    { label: 'Expired',  emoji: '💀', order: 0 },
    zombie:  { label: 'Today',    emoji: '🧟', order: 1 },
    haunted: { label: 'Eat soon', emoji: '👻', order: 2 },
    fresh:   { label: 'Fresh',    emoji: '🥬', order: 3 },
  };
  function status(days) {
    if (days < 0) return 'dead';
    if (days === 0) return 'zombie';
    if (days <= 2) return 'haunted';
    return 'fresh';
  }
  function describe(days) {
    if (days < -1) return `expired ${-days} days ago`;
    if (days === -1) return 'expired yesterday';
    if (days === 0) return 'expires today';
    if (days === 1) return 'expires tomorrow';
    return `${days} days left`;
  }

  // ---------- ingredient recognition ----------
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Whole-word match (Unicode-aware, so "tojás" works), allowing an English plural: egg → eggs, tomato → tomatoes.
  const ALIAS_PATTERNS = Object.entries(INGREDIENTS).flatMap(([key, { aliases }]) =>
    aliases.map(alias => ({ key, alias, re: new RegExp(`(^|[^\\p{L}])${escapeRe(alias)}(s|es)?(?=$|[^\\p{L}])`, 'iu') })));

  /** Returns the canonical ingredient key for a free-text item name, or null. Longest alias wins. */
  function recognise(name) {
    const text = String(name || '').toLowerCase();
    let best = null;
    for (const p of ALIAS_PATTERNS) {
      if (p.re.test(text) && (!best || p.alias.length > best.alias.length)) best = p;
    }
    return best ? best.key : null;
  }

  function suggestShelfLife(name, location) {
    const key = recognise(name);
    if (location === 'freezer') return { key, days: FREEZER_DAYS };
    return { key, days: key ? INGREDIENTS[key].days : UNKNOWN_DAYS };
  }

  // ---------- inventory ----------
  function sortItems(items, today) {
    return [...items].sort((a, b) => daysLeft(a.expiry, today) - daysLeft(b.expiry, today) || a.name.localeCompare(b.name));
  }

  // ---------- rescue recipes ----------
  const URGENCY = { zombie: 3, haunted: 2, fresh: 0.5, dead: 0 };

  /** Recipes that use at least one item that expires within 2 days, best first. */
  function matchRecipes(items, today, limit = 4, recipes = RECIPES) {
    const live = items
      .map(item => ({ item, key: recognise(item.name), st: status(daysLeft(item.expiry, today)) }))
      .filter(x => x.key && x.st !== 'dead');

    return recipes.map(recipe => {
      const used = [];
      recipe.uses.forEach(ing => {
        const hit = live.filter(x => x.key === ing).sort((a, b) => URGENCY[b.st] - URGENCY[a.st])[0];
        if (hit) used.push(hit);
      });
      const urgent = used.filter(x => x.st === 'zombie' || x.st === 'haunted');
      const score = used.reduce((s, x) => s + URGENCY[x.st], 0) + used.length / recipe.uses.length;
      return {
        recipe,
        score,
        rescues: urgent.map(x => x.item),
        alsoUses: used.filter(x => !urgent.includes(x)).map(x => x.item),
        missing: recipe.uses.filter(ing => !used.some(x => x.key === ing)),
      };
    })
      .filter(m => m.rescues.length)
      .sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes)
      .slice(0, limit);
  }

  // ---------- stats ----------
  function monthStats(history, today) {
    const month = today.slice(0, 7);
    const inMonth = history.filter(h => h.date && h.date.startsWith(month));
    const eaten = inMonth.filter(h => h.outcome === 'eaten');
    const binned = inMonth.filter(h => h.outcome === 'binned');
    const sum = list => list.reduce((s, h) => s + (Number(h.price) || 0), 0);
    const decided = eaten.length + binned.length;
    return {
      eaten: eaten.length,
      binned: binned.length,
      savedValue: sum(eaten),
      wastedValue: sum(binned),
      rescueRate: decided ? Math.round((eaten.length / decided) * 100) : null,
      hasPrices: inMonth.some(h => Number(h.price) > 0),
    };
  }

  // ---------- import validation ----------
  const LOCATIONS = ['fridge', 'freezer', 'pantry'];
  function sanitiseState(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) throw new Error('Not a Fridge Graveyard backup.');
    const str = (v, max) => String(v == null ? '' : v).slice(0, max);
    const price = v => (Number(v) > 0 ? Math.round(Number(v) * 100) / 100 : null);
    const items = raw.items
      .filter(i => i && str(i.name, 60).trim() && isISODate(i.expiry))
      .map(i => ({
        id: str(i.id, 40) || Math.random().toString(36).slice(2),
        name: str(i.name, 60).trim(),
        qty: str(i.qty, 20).trim(),
        location: LOCATIONS.includes(i.location) ? i.location : 'fridge',
        expiry: i.expiry,
        price: price(i.price),
        added: isISODate(i.added) ? i.added : i.expiry,
      }));
    const history = (Array.isArray(raw.history) ? raw.history : [])
      .filter(h => h && ['eaten', 'binned'].includes(h.outcome) && isISODate(h.date))
      .map(h => ({ name: str(h.name, 60), outcome: h.outcome, price: price(h.price), date: h.date }));
    const currency = ['EUR', 'USD', 'GBP', 'HUF'].includes(raw.currency) ? raw.currency : 'EUR';
    return { version: 1, items, history, currency };
  }

  return {
    STATUS, LOCATIONS, todayISO, addDays, daysLeft, status, describe, isISODate,
    recognise, suggestShelfLife, sortItems, matchRecipes, monthStats, sanitiseState,
  };
})();
