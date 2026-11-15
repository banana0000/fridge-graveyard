/* 🪦 Fridge Graveyard – UI layer. Business logic lives in logic.js, data in data.js. */
'use strict';

const STORE_KEY = 'fg_state';
const SCHEMA_VERSION = 1;

// ---------- helpers ----------
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => Fridge.todayISO();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const PLACE = { fridge: 'Fridge', freezer: 'Freezer', pantry: 'Pantry' };

function emptyState() { return { version: SCHEMA_VERSION, items: [], history: [], currency: 'EUR' }; }

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    if (raw) return Fridge.sanitiseState(raw);
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
  return emptyState();
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { say('Heads up: this browser blocks storage, so your list will be lost when you close the page.'); }
}

let state = loadState();
let filter = 'all';
let expiryTouched = false;
let msgTimer = null;

function say(msg) {
  $('status').textContent = msg;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { $('status').textContent = ''; }, 6000);
}
function money(v) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency, maximumFractionDigits: state.currency === 'HUF' ? 0 : 2 }).format(v); }
  catch (e) { return v.toFixed(2) + ' ' + state.currency; }
}

// ---------- rendering ----------
function render() {
  const t = today();
  const sorted = Fridge.sortItems(state.items, t).map(item => {
    const days = Fridge.daysLeft(item.expiry, t);
    return { item, days, st: Fridge.status(days) };
  });
  const alive = sorted.filter(x => x.st !== 'dead');
  const dead = sorted.filter(x => x.st === 'dead');

  renderStats(alive, dead, t);
  renderRecipes(t);
  renderItems(alive);
  renderTombs(dead);

  const urgent = alive.filter(x => x.st !== 'fresh').length + dead.length;
  document.title = (urgent ? `(${urgent}) ` : '') + 'Fridge Graveyard';
}

function renderStats(alive, dead, t) {
  const m = Fridge.monthStats(state.history, t);
  const soon = alive.filter(x => x.st !== 'fresh').length;
  const cards = [
    { num: alive.length, lbl: 'items in your kitchen' },
    { num: soon, lbl: 'need eating within 2 days', cls: soon ? 'warn' : '' },
    { num: dead.length, lbl: 'past their date', cls: dead.length ? 'bad' : '' },
    { num: m.eaten, lbl: 'rescued this month', cls: 'good' },
    { num: m.binned, lbl: 'binned this month', cls: m.binned ? 'bad' : '' },
    { num: m.rescueRate === null ? '–' : m.rescueRate + '%', lbl: 'rescue rate', cls: m.rescueRate >= 80 ? 'good' : '' },
  ];
  if (m.hasPrices) cards.push({ num: money(m.wastedValue), lbl: 'money binned this month', cls: m.wastedValue ? 'bad' : '' });
  $('stats').innerHTML = cards.map(c =>
    `<li class="${c.cls || ''}"><span class="num">${esc(c.num)}</span><span class="lbl">${esc(c.lbl)}</span></li>`).join('');
}

function renderRecipes(t) {
  const matches = Fridge.matchRecipes(state.items, t);
  $('rescue').hidden = !matches.length;
  const label = item => `${esc(item.name)} <span class="meta">(${esc(Fridge.describe(Fridge.daysLeft(item.expiry, t)))})</span>`;
  $('recipes').innerHTML = matches.map(({ recipe, rescues, alsoUses, missing }) => `
    <li class="recipe">
      <h3><span aria-hidden="true">${recipe.emoji}</span> ${esc(recipe.name)}</h3>
      <div class="body">
        <p><span class="time">${recipe.minutes} min</span></p>
        <p class="saves">Rescues: ${rescues.map(label).join(', ')}</p>
        ${alsoUses.length ? `<p>Also uses your: ${alsoUses.map(i => esc(i.name)).join(', ')}</p>` : ''}
        ${missing.length ? `<p class="meta">Optional extras: ${esc(missing.join(', '))}</p>` : ''}
        <p>${esc(recipe.how)}</p>
      </div>
    </li>`).join('');
}

function renderItems(alive) {
  const shown = alive.filter(x => filter === 'all' || x.item.location === filter);
  if (!shown.length) {
    $('items').innerHTML = `<li class="empty">${state.items.length
      ? 'Nothing here.'
      : '<img src="assets/empty-fridge.jpg" alt="" width="140" height="140">Your fridge is empty. Add something above, or press “Load demo fridge” at the bottom to try it out.'}</li>`;
    return;
  }
  $('items').innerHTML = shown.map(({ item, days, st }) => {
    const n = esc(item.name);
    return `
    <li class="item s-${st}">
      <span class="st" aria-hidden="true">${Fridge.STATUS[st].emoji}</span>
      <div class="info">
        <strong>${n}</strong> ${item.qty ? `<span class="qty">${esc(item.qty)}</span>` : ''}<br>
        <span class="when">${st === 'fresh' ? '' : `<span class="visually-hidden">${Fridge.STATUS[st].label}: </span>`}${esc(Fridge.describe(days))} · ${PLACE[item.location]}${item.price ? ' · ' + esc(money(item.price)) : ''}</span>
      </div>
      <div class="acts">
        <button type="button" data-action="eat" data-id="${esc(item.id)}" aria-label="Ate ${n}"><span aria-hidden="true">✅</span> Ate it</button>
        <button type="button" data-action="bin" data-id="${esc(item.id)}" aria-label="Binned ${n}"><span aria-hidden="true">🗑️</span> Binned</button>
        <button type="button" data-action="remove" data-id="${esc(item.id)}" aria-label="Remove ${n} (added by mistake, not counted)"><span aria-hidden="true">✕</span></button>
      </div>
    </li>`;
  }).join('');
}

function renderTombs(dead) {
  $('graveyard').hidden = !dead.length;
  $('tombs').innerHTML = dead.map(({ item, days }) => {
    const n = esc(item.name);
    return `
    <li class="tomb">
      <span class="rip" aria-hidden="true">R.I.P.</span>
      <strong>${n}</strong>
      <span class="when">${esc(Fridge.describe(days))} · ${PLACE[item.location]}</span>
      <div class="acts">
        <button type="button" data-action="snooze" data-id="${esc(item.id)}" aria-label="${n} is still good, give it 2 more days">Still good +2d</button>
        <button type="button" data-action="eat" data-id="${esc(item.id)}" aria-label="Ate ${n}">Ate it</button>
        <button type="button" data-action="bin" data-id="${esc(item.id)}" aria-label="Binned ${n}">Bin it</button>
      </div>
    </li>`;
  }).join('');
}

// ---------- form ----------
function updateSuggestion() {
  const name = $('name').value.trim();
  const loc = $('location').value;
  if (!name) { $('suggest').textContent = ''; return; }
  const s = Fridge.suggestShelfLife(name, loc);
  const where = loc === 'freezer' ? ' in the freezer' : '';
  $('suggest').textContent = s.key
    ? `Suggested use-by: ${plural(s.days, 'day')} (typical for ${s.key}${where}). Check the label and adjust if needed.`
    : `Suggested use-by: ${plural(s.days, 'day')}${where}. We don't know this item, so please check the label.`;
  if (!expiryTouched) $('expiry').value = Fridge.addDays(today(), s.days);
}

function addItem(e) {
  e.preventDefault();
  const name = $('name').value.trim();
  const expiry = $('expiry').value;
  $('name').setAttribute('aria-invalid', String(!name));
  $('expiry').setAttribute('aria-invalid', String(!Fridge.isISODate(expiry)));
  if (!name) { say('Please tell me what the food is.'); $('name').focus(); return; }
  if (!Fridge.isISODate(expiry)) { say('Please pick a use-by date.'); $('expiry').focus(); return; }

  const price = parseFloat($('price').value);
  const item = {
    id: uid(), name: name.slice(0, 60), qty: $('qty').value.trim().slice(0, 20),
    location: $('location').value, expiry, price: price > 0 ? Math.round(price * 100) / 100 : null, added: today(),
  };
  state.items.push(item);
  saveState();
  $('add-form').reset();
  $('location').value = item.location; // keep the place: people usually unpack one place at a time
  expiryTouched = false;
  $('suggest').textContent = '';
  say(`Added ${item.name}: ${Fridge.describe(Fridge.daysLeft(expiry, today()))}.`);
  render();
  $('name').focus();
}

// ---------- item actions ----------
function act(action, id) {
  const item = state.items.find(i => i.id === id);
  if (!item) return;
  if (action === 'snooze') {
    item.expiry = Fridge.addDays(today(), 2);
    say(`${item.name} gets 2 more days. Trust your nose!`);
  } else {
    state.items = state.items.filter(i => i !== item);
    if (action === 'eat' || action === 'bin') {
      state.history.push({ name: item.name, outcome: action === 'eat' ? 'eaten' : 'binned', price: item.price, date: today() });
      if (state.history.length > 1000) state.history = state.history.slice(-1000);
    }
    say(action === 'eat' ? `Rescued ${item.name}! 🎉` : action === 'bin' ? `${item.name} was laid to rest. 🪦` : `Removed ${item.name}.`);
  }
  saveState();
  render();
  $('inventory').focus();
}

// ---------- backup / demo / wipe ----------
function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fridge-graveyard-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say('Backup downloaded.');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = Fridge.sanitiseState(JSON.parse(reader.result));
      saveState();
      $('currency').value = state.currency;
      render();
      say(`Backup restored: ${plural(state.items.length, 'item')}.`);
    } catch (e) {
      say('That file is not a valid Fridge Graveyard backup.');
    }
  };
  reader.readAsText(file);
}

function loadDemo() {
  const t = today();
  const demo = [
    ['Milk', '1 l', 'fridge', 1, 1.2], ['Eggs', '6', 'fridge', 0, 2.5], ['Baby spinach', '200 g', 'fridge', 2, 2.0],
    ['Sliced bread', '½ loaf', 'pantry', -1, 1.8], ['Chicken breast', '400 g', 'fridge', 3, 5.5], ['Cheddar cheese', '', 'fridge', 12, 3.0],
    ['Bananas', '3', 'pantry', 1, 1.0], ['Greek yogurt', '', 'fridge', 6, 1.6], ['Frozen peas', '1 bag', 'freezer', 80, 1.5],
    ['Cherry tomatoes', '250 g', 'fridge', 2, 2.2], ['Ham', '', 'fridge', -3, 2.8],
  ];
  demo.forEach(([name, qty, location, d, price]) =>
    state.items.push({ id: uid(), name, qty, location, expiry: Fridge.addDays(t, d), price, added: t }));
  saveState();
  render();
  say('Demo fridge loaded. Look at the Rescue mission and the graveyard.');
}

let wipeTimer = null;
function wipe() {
  const btn = $('wipe');
  if (!btn.classList.contains('armed')) {
    btn.classList.add('armed');
    btn.textContent = 'Press again to delete all';
    say('This deletes all food and history. Press the button again within 4 seconds to confirm.');
    wipeTimer = setTimeout(() => { btn.classList.remove('armed'); btn.textContent = 'Delete everything'; }, 4000);
    return;
  }
  clearTimeout(wipeTimer);
  btn.classList.remove('armed'); btn.textContent = 'Delete everything';
  const currency = state.currency;
  state = emptyState(); state.currency = currency;
  saveState(); render();
  say('Everything deleted.');
}

// ---------- events ----------
$('known').innerHTML = Object.keys(FRIDGE_DATA.INGREDIENTS).map(k => `<option value="${esc(k)}">`).join('');
$('add-form').addEventListener('submit', addItem);
$('name').addEventListener('input', updateSuggestion);
$('location').addEventListener('change', updateSuggestion);
$('expiry').addEventListener('input', () => { expiryTouched = true; });
document.querySelector('.filters').addEventListener('click', e => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  document.querySelectorAll('.filters button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  render();
});
document.querySelector('main').addEventListener('click', e => {
  const btn = e.target.closest('button[data-action]');
  if (btn) act(btn.dataset.action, btn.dataset.id);
});
$('currency').value = state.currency;
$('currency').addEventListener('change', () => { state.currency = $('currency').value; saveState(); render(); });
$('export').addEventListener('click', exportBackup);
$('import').addEventListener('change', e => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ''; });
$('demo').addEventListener('click', loadDemo);
$('wipe').addEventListener('click', wipe);

// Re-render when the tab becomes visible again (the date may have changed overnight).
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

render();
