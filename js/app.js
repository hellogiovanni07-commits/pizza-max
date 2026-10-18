// Pizza Max — page logic: menu views, ordering, deals, basket, checkout, delivery area, 3D hookup, motion.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const eur = (n) => '€' + n.toFixed(2);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => matchMedia('(max-width: 560px)').matches;
const isShown = (el) => !!el && document.contains(el) && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
// one polite live region for changes that have no visible message of their own
function announce(msg) { const l = $('#srLive'); l.textContent = ''; setTimeout(() => (l.textContent = msg), 60); }
// move keyboard focus to a heading without scrolling again (after a jump link or a category jump)
function focusHeading(h) {
  if (!h) return;
  if (!h.hasAttribute('tabindex')) h.tabIndex = -1;
  h.focus({ preventScroll: true });
}
const ICON = {
  arrow: '<svg class="i-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  minus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  box: '<svg class="i-box" viewBox="0 0 40 40" aria-hidden="true"><rect class="ib-a" x="4" y="12" width="32" height="22" rx="3"/><path class="ib-b" d="M4 12h32l-4-7H8z"/><rect class="ib-c" x="12" y="20" width="16" height="6" rx="1.5"/></svg>',
  // diet marks: they stay on every view, down to the smallest box
  leaf: '<svg class="i-tag" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13C3 7.5 7 3 13 3c0 6-4.5 10-10 10Zm0 0 5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chili: '<svg class="i-tag" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.6 4.6C10.4 9 7 12 2.5 12.4 6 14.6 13.4 13 13.2 6.6c0-.9-.6-1.7-1.6-2Zm0 0c.1-1.3.9-2.2 2.1-2.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fish: '<svg class="i-tag" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.8 8C4 4.8 7.6 4 10.8 6l3.4-2.2v8.4L10.8 10C7.6 12 4 11.2 1.8 8Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="5" cy="7.4" r=".9" fill="currentColor"/></svg>',
};

/* ================= DATA ================= */
const SIZES = ['Standard 26 cm', 'Maxi 32 cm', 'Wumbo 38 cm'];
const SIZE_SHORT = ['26 cm', '32 cm', '38 cm'];
const SIZE_NAME = ['Standard', 'Maxi', 'Wumbo'];
const CRUST = 2.5;
const BASE_CODES = ['A', 'A1'];   // every pizza: 24-hour wheat dough
// short: what the kitchen writes on the box label
const PIZZAS = [
  { id: 'marg', name: 'Margherita Deluxe', short: 'Margherita', ing: 'Mozzarella, Gouda, sliced tomatoes, basil pesto', codes: ['G', 'C', 'H', 'H4'], price: [8.5, 12.5, 17.4], tags: ['veg'] },
  { id: 'salami', name: 'Salami Max', short: 'Salami', ing: 'Double beef salami, cheese, oregano', codes: ['G', '2', '3'], price: [9.0, 13.0, 17.9], tags: ['meat'], sticker: 'Bestseller' },
  { id: 'diavolo', name: 'Diavolo', short: 'Diavolo', ing: 'Hot salami, mozzarella, jalapeños, red onion, chilli oil', codes: ['G', '2', '3'], price: [9.5, 13.5, 18.4], tags: ['meat', 'hot'] },
  { id: 'funghi', name: 'Funghi Fresco', short: 'Funghi', ing: 'Mushrooms, garlic, thyme, mozzarella', codes: ['G'], price: [8.9, 12.9, 17.6], tags: ['veg'] },
  { id: 'garden', name: 'Veggie Garden', short: 'Veggie', ing: 'Mozzarella, peppers, olives, mushrooms, tomatoes, rocket', codes: ['G'], price: [9.2, 13.2, 17.9], tags: ['veg'] },
  { id: 'tonno', name: 'Tonno Cipolla', short: 'Tonno', ing: 'Tuna, mozzarella, red onion, capers, olives', codes: ['D', 'G'], price: [9.4, 13.4, 18.2], tags: ['fish'] },
  { id: 'hawaii', name: 'Hawaii', short: 'Hawaii', ing: 'Cooked ham, pineapple, extra cheese', codes: ['G', '2', '3'], price: [9.2, 13.2, 17.9], tags: ['meat'] },
  { id: 'supreme', name: 'Max Supreme', short: 'Supreme', ing: 'Salami, ham, mozzarella, peppers, olives, mushrooms, onion, jalapeños', codes: ['G', '2', '3'], price: [10.9, 14.9, 19.9], tags: ['meat', 'hot'] },
];
const byId = (id) => PIZZAS.find((p) => p.id === id);
const ALLERGENS = { A: 'gluten', A1: 'wheat', C: 'egg', D: 'fish', G: 'milk', H: 'tree nuts', H4: 'cashew' };
const ADDITIVES = { 2: 'preservative', 3: 'antioxidant' };
// short: the names without their key letters, for the compact rows
function allergenLine(p, short = false) {
  const codes = [...BASE_CODES, ...p.codes];
  const alg = codes.filter((c) => ALLERGENS[c]).map((c) => (short ? ALLERGENS[c] : `${ALLERGENS[c]} (${c})`));
  const add = codes.filter((c) => ADDITIVES[c]).map((c) => (short ? ADDITIVES[c] : `${ADDITIVES[c]} (${c})`));
  return `<b>Allergens:</b> ${alg.join(', ')}${add.length ? ` · <b>Contains:</b> ${add.join(', ')}` : ''}`;
}
// the full list prints the key letters, as a printed menu does
const codesOf = (p) => [...BASE_CODES, ...p.codes].join(', ');
// the Blender stills come in 240, 480 and 760 px; each view asks for the size it shows
const STILLS = Object.fromEntries(PIZZAS.map((p) => [p.id, { angle: `assets/pizza/${p.id}-angle.webp`, top: `assets/pizza/${p.id}-top.webp` }]));
const sized = (src, w) => src.replace(/\.webp$/, `-${w}.webp`);
const srcset = (src) => `${sized(src, 240)} 240w, ${sized(src, 480)} 480w, ${src} 760w`;
const still = (src, sizes, extra = '') => `<img src="${sized(src, 480)}" srcset="${srcset(src)}" sizes="${sizes}" alt="" width="760" height="760" decoding="async" ${extra}>`;

const BOARD = [
  { cat: 'burger', title: 'Burgers', items: [
    { n: 'Max Burger', d: '180g beef, cheddar, Max sauce', p: 9.9, t: ['meat'] },
    { n: 'Cheese Smash', d: 'Double smashed, double cheese', p: 11.5, t: ['meat'] },
    { n: 'Chicken Crunch', d: 'Crispy chicken, coleslaw', p: 9.5, t: ['meat'] },
    { n: 'Veggie Burger', d: 'Halloumi, grilled peppers', p: 9.9, t: ['veg'] } ] },
  { cat: 'pasta', title: 'Pasta', items: [
    { n: 'Spaghetti Bolognese', d: 'Our house ragù', p: 8.9, t: ['meat'] },
    { n: 'Penne Arrabbiata', d: 'Spicy tomato, garlic', p: 8.5, t: ['veg', 'hot'] },
    { n: 'Tagliatelle Carbonara', d: 'Egg, bacon, pecorino', p: 9.9, t: ['meat'] } ] },
  { cat: 'salate', title: 'Salads', items: [
    { n: 'Caesar Salad', d: 'Romaine, croutons, parmesan', p: 8.5, t: [] },
    { n: 'Greek Salad', d: 'Feta, olives, cucumber', p: 8.2, t: ['veg'] },
    { n: 'Rocket & Grana', d: 'Rocket, grana, cherry tomatoes', p: 7.9, t: ['veg'] } ] },
  { cat: 'kids', title: 'Kids', items: [
    { n: 'Mini Margherita', d: '20 cm', p: 5.9, t: ['veg'] },
    { n: 'Nuggets & Fries', d: '6 pieces, ketchup', p: 6.5, t: ['meat'] } ] },
  { cat: 'desserts', title: 'Desserts', items: [
    { n: 'Tiramisu', d: 'Made in house', p: 4.9, t: ['veg'] },
    { n: 'Chocolate Lava Cake', d: 'Warm, molten centre', p: 5.5, t: ['veg'] } ] },
  { cat: 'getraenke', title: 'Drinks', items: [
    { n: 'Cola 0.5 l', d: 'Ice cold', p: 2.9, t: ['veg'] },
    { n: 'Lemonade 0.33 l', d: 'Made in house', p: 3.2, t: ['veg'] },
    { n: 'Still water 0.5 l', d: 'Mineral water', p: 2.2, t: ['veg'] },
    { n: 'Sparkling water 0.5 l', d: 'Mineral water', p: 2.2, t: ['veg'] } ] },
];
const catItems = (cat) => BOARD.find((c) => c.cat === cat).items;

const DEALS = [
  { title: 'Solo', items: ['1 Maxi pizza, 32 cm', '1 drink'], price: 13.9, pizzas: ['salami'], size: 1, drinks: 1, desserts: 0 },
  { title: 'Duo', items: ['2 Maxi pizzas, 32 cm', '2 drinks', '1 dessert'], price: 29.9, pizzas: ['marg', 'diavolo'], size: 1, drinks: 2, desserts: 1 },
  { title: 'Party', items: ['3 Wumbo pizzas, 38 cm', '4 drinks', '2 desserts'], price: 59.9, pizzas: ['supreme', 'garden', 'hawaii'], size: 2, drinks: 4, desserts: 2 },
];

// the example delivery area: the neighbourhoods around the shop and their postcodes
const AREAS = [
  ['Pankow', ['13187', '13189']],
  ['Niederschönhausen', ['13156']],
  ['Rosenthal, Wilhelmsruh', ['13158']],
  ['Prenzlauer Berg', ['10437', '10439', '10409']],
  ['Weißensee', ['13086', '13088']],
  ['Französisch Buchholz', ['13127']],
  ['Blankenburg', ['13129']],
  ['Karow, Buch', ['13125']],
];
const ZONE = AREAS.flatMap(([, z]) => z);
const areaOf = (z) => (AREAS.find(([, codes]) => codes.includes(z)) || [''])[0];
const zipState = (v) => (!/^\d{5}$/.test(v) ? 'short' : ZONE.includes(v) ? 'ok' : 'out');

/* ================= OPENING HOURS (Berlin time) ================= */
// hours, slots and arrival times follow the shop's clock, whatever time zone the visitor's device is in:
// berlinNow() is a Date whose local fields read Berlin's wall-clock time
const BERLIN = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
function berlinNow() {
  const p = Object.fromEntries(BERLIN.formatToParts(new Date()).filter((x) => x.type !== 'literal').map((x) => [x.type, +x.value]));
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}
const HOURS = { 0: [12, 23], 1: [11, 23], 2: [11, 23], 3: [11, 23], 4: [11, 23], 5: [11, 25], 6: [11, 25] };
const fmtH = (h) => `${String(h % 24).padStart(2, '0')}:00`;
const hm = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
function shopState(now = berlinNow()) {
  const d = now.getDay(), h = now.getHours() + now.getMinutes() / 60, prev = HOURS[(d + 6) % 7];
  const lateNight = prev[1] > 24 && h < prev[1] - 24;
  const open = lateNight || (h >= HOURS[d][0] && h < HOURS[d][1]);
  const next = new Date(now); next.setMinutes(0, 0, 0);
  let when;
  if (!open && h < HOURS[d][0]) { next.setHours(HOURS[d][0]); when = 'today'; }
  else if (!open) { next.setDate(next.getDate() + 1); next.setHours(HOURS[(d + 1) % 7][0]); when = 'tomorrow'; }
  const closeAt = new Date(now); closeAt.setMinutes(0, 0, 0);
  if (lateNight) closeAt.setHours(prev[1] - 24);
  else if (open) closeAt.setHours(HOURS[d][1]);               // 25 rolls over to 01:00 tomorrow
  else { closeAt.setTime(next.getTime()); closeAt.setHours(HOURS[next.getDay()][1]); }
  return { open, until: fmtH(lateNight ? prev[1] : HOURS[d][1]), next, closeAt, nextLabel: open ? '' : `${when} at ${fmtH(next.getHours())}` };
}

// can an order placed now be ready (pickup, 20 min) or at the door (delivery, 30 min) before we close?
function inTime(lead) { const s = shopState(); return s.open && berlinNow().getTime() + lead * 60000 <= s.closeAt.getTime(); }
// if not: the next opening (tonight's closing has passed, or is too close) - an order ahead
function startAt(lead) {
  if (inTime(lead)) return null;
  const s = shopState();
  return s.open ? shopState(new Date(s.closeAt.getTime() + 60000)).next : s.next;
}
const dayWord = (d) => { const t = berlinNow(); t.setHours(0, 0, 0, 0); const k = Math.round((new Date(d).setHours(0, 0, 0, 0) - t) / 864e5); return k === 0 ? 'today' : k === 1 ? 'tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'long' }); };
const aheadLabel = (lead) => { const t = startAt(lead); return t ? `${dayWord(t)} at ${hm(t)}` : ''; };
// "in about 30 minutes" when there's time before closing; "from 12:30 today" otherwise (an order ahead)
function when(lead) {
  const t = startAt(lead);
  return t ? `from ${hm(new Date(t.getTime() + lead * 60000))} ${dayWord(t)}` : `in about ${lead} minutes`;
}

/* ================= TOAST (only while the basket is closed) ================= */
let toastT;
function toast(msg, action) {
  if (!$('#cart').hidden) return;      // the open basket shows its own changes
  const t = $('#toast'), b = $('#toastAction');
  $('#toastText').textContent = msg;
  b.hidden = !action;
  b.onclick = action ? () => { t.classList.remove('show'); action.fn(); } : null;
  if (action) b.textContent = action.label;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), action ? 4500 : 2800);
}

/* ================= ORDERING (one control model, in every view) ================= */
// Every view shows the three sizes with their prices and one red "Add Maxi · €12.50": one tap adds the size you
// last chose (Maxi to start with). Other sizes and the cheese-stuffed crust live in one options sheet, which is a
// bottom sheet on phones and a popover beside the button on bigger screens.
const sel = new Map(PIZZAS.map((p) => [p.id, 1]));   // chosen size, Maxi by default
const crust = new Set();                              // pizzas with a cheese-stuffed crust
const priceOf = (p, k, withCrust = crust.has(p.id)) => p.price[k] + (withCrust ? CRUST : 0);
const lineItem = (p, k, withCrust = crust.has(p.id)) => ({
  name: p.name + (withCrust ? ' + cheese-stuffed crust' : ''), size: SIZES[k], price: priceOf(p, k, withCrust), thumb: STILLS[p.id].top, kind: 'pizza',
});
const pizzaWhat = (p, k) => `${p.name}${crust.has(p.id) ? ' with cheese-stuffed crust' : ''}, ${SIZES[k]}`;
const pizzaDesc = (p, k) => `${pizzaWhat(p, k)}, ${eur(priceOf(p, k))}`;
// accessible names start with the words on the button (speech users say what they see)
const quickText = (p, k = sel.get(p.id)) => `Add ${SIZE_NAME[k]}${crust.has(p.id) ? ' + crust' : ''}`;
const quickLabel = (p, k = sel.get(p.id)) => `${quickText(p, k)} · ${eur(priceOf(p, k))}: ${pizzaWhat(p, k)}`;
const addLabel = (p, k) => `Add to basket · ${eur(priceOf(p, k))}: ${pizzaWhat(p, k)}`;
const sizeBtn = (p, k) => `<small>${SIZE_SHORT[k]}</small><b class="num">${eur(priceOf(p, k))}</b>`;
const sizeAddLabel = (p, k) => `${SIZE_SHORT[k]} ${eur(priceOf(p, k))}: add ${pizzaWhat(p, k)}`;
const crustLabel = (p) => `<label class="crust"><input type="checkbox" data-crust ${crust.has(p.id) ? 'checked' : ''} aria-label="Cheese-stuffed crust for ${p.name}, plus ${eur(CRUST)}"><span class="crust-txt">Cheese-stuffed crust</span> <span class="crust-p">+${eur(CRUST)}</span></label>`;
// the three sizes and what each costs, with the one the red button adds marked
const priceGrid = (p) => `<div class="p-price" data-sizes="${p.id}"><dl class="p-sizes">${SIZE_SHORT.map((s, j) => `<div${j === sel.get(p.id) ? ' class="is-sel"' : ''}><dt>${s}<span class="sr-only">:</span></dt><dd class="num">${eur(priceOf(p, j))}</dd></div>`).join('')}</dl><p class="crust-tag"${crust.has(p.id) ? '' : ' hidden'}>with cheese-stuffed crust (+${eur(CRUST)})</p></div>`;
// one tap to add, and the way to the other sizes and the crust
const buyRow = (p) => `<div class="order buy" data-id="${p.id}">
    <button type="button" class="btn btn-red add-btn" data-add aria-label="${quickLabel(p)}"><span class="add-label">${quickText(p)}</span> · <span class="num">${eur(priceOf(p, sel.get(p.id)))}</span></button>
    <button type="button" class="link-btn opt-btn" data-opts aria-haspopup="dialog" aria-label="Size &amp; crust: ${p.name}">Size &amp; crust</button>
  </div>`;
// the options sheet's controls: sizes, crust and add
function orderControls(p) {
  const k = sel.get(p.id);
  const size = (j) => `<b>${SIZE_NAME[j]}</b><span class="sz-cm">${SIZE_SHORT[j]}<span class="sr-only">,</span></span><span class="num">${eur(priceOf(p, j))}</span>`;
  return `<div class="order order-full" data-id="${p.id}">
    <div class="seg" role="radiogroup" aria-label="Size, ${p.name}">
      ${SIZE_SHORT.map((s, j) => `<button type="button" role="radio" aria-checked="${j === k}" tabindex="${j === k ? 0 : -1}" data-size="${j}">${size(j)}</button>`).join('')}
    </div>
    ${crustLabel(p)}
    <button type="button" class="btn btn-red btn-block add-btn" data-add data-full aria-label="${addLabel(p, k)}"><span class="add-label">Add to basket</span> · <span class="num">${eur(priceOf(p, k))}</span></button>
  </div>`;
}
// a button's words, or the words it goes back to once its "Added" is over
function setLabel(btn, html) {
  const l = $('.add-label', btn) || $('.lbl', btn);
  if (!l) return;
  if (l.dataset.html != null) l.dataset.html = html; else l.innerHTML = html;
}
function setAria(btn, text) { if (btn.dataset.aria) btn.dataset.aria = text; else btn.setAttribute('aria-label', text); }
// keep every copy of a pizza's controls in sync across views
function refreshOrder(id) {
  const p = byId(id), k = sel.get(id);
  $$(`.order[data-id="${id}"]`).forEach((o) => {
    $$('.seg button', o).forEach((b, j) => {
      b.setAttribute('aria-checked', j === k); b.tabIndex = j === k ? 0 : -1;
      $('.num', b).textContent = eur(priceOf(p, j));
    });
    const c = $('[data-crust]', o); if (c) c.checked = crust.has(id);
    const add = $('[data-add]', o);
    if (add) {
      const full = add.hasAttribute('data-full');
      setLabel(add, full ? 'Add to basket' : quickText(p));
      $('.num', add).textContent = eur(priceOf(p, k));
      setAria(add, full ? addLabel(p, k) : quickLabel(p));
      add.classList.remove('tick'); void add.offsetWidth; add.classList.add('tick');
    }
    $$('[data-k]', o).forEach((b) => { const j = +b.dataset.k; setLabel(b, sizeBtn(p, j)); setAria(b, sizeAddLabel(p, j)); });
  });
  $$(`[data-sizes="${id}"]`).forEach((g) => {
    $$('.p-sizes > div', g).forEach((d, j) => { d.classList.toggle('is-sel', j === k); $('dd', d).textContent = eur(priceOf(p, j)); });
    $('.crust-tag', g).hidden = !crust.has(id);
  });
  $$(`.board-row[data-id="${id}"] .crust-tag`).forEach((t) => (t.hidden = !crust.has(id)));
  $$(`.pbox[data-id="${id}"] .pbox-base img`).forEach((img) => img.style.setProperty('--k', [.9, .96, 1][k]));
  if (id === 'garden') heroLabel();
}
// the hero's button adds the Veggie Garden shown on the board, at Maxi
function heroLabel() {
  const p = byId('garden'), b = $('#heroAdd');
  $('.num', b).textContent = eur(priceOf(p, 1));
  b.setAttribute('aria-label', `Add a Maxi, 32 cm · ${eur(priceOf(p, 1))}: ${p.name}${crust.has(p.id) ? ' with cheese-stuffed crust' : ''}`);
}
// brief "added" confirmation on whichever button was used (its width is held so neighbours don't jump)
function flashAdded(btn, what) {
  if (!btn.classList.contains('is-added')) btn.style.minWidth = `${btn.offsetWidth}px`;
  btn.classList.add('is-added');
  if (what && btn.hasAttribute('aria-label') && !btn.dataset.aria) { btn.dataset.aria = btn.getAttribute('aria-label'); btn.setAttribute('aria-label', `Added: ${what}`); }
  const label = $('.add-label', btn) || $('.lbl', btn);
  if (label) { label.dataset.html ??= label.innerHTML; label.innerHTML = `${ICON.check}Added`; }
  else if (btn.classList.contains('add-mini')) { btn.dataset.icon ??= btn.innerHTML; btn.innerHTML = ICON.check; }
  clearTimeout(btn._t);
  btn._t = setTimeout(() => {
    btn.classList.remove('is-added');
    btn.style.minWidth = '';
    if (label) { label.innerHTML = label.dataset.html; delete label.dataset.html; }
    else if (btn.dataset.icon) { btn.innerHTML = btn.dataset.icon; delete btn.dataset.icon; }
    if (btn.dataset.aria) { btn.setAttribute('aria-label', btn.dataset.aria); delete btn.dataset.aria; }
  }, 1400);
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('.order');
  if (!o) return;
  const p = byId(o.dataset.id);
  const sz = e.target.closest('.seg button');
  if (sz) { sel.set(p.id, +sz.dataset.size); refreshOrder(p.id); return; }
  const opts = e.target.closest('[data-opts]');
  if (opts) return openSheet(p.id, opts);
  const add = e.target.closest('[data-add]');
  if (add) { addToCart(lineItem(p, sel.get(p.id)), add); flashAdded(add, pizzaDesc(p, sel.get(p.id))); return; }
  const k = e.target.closest('[data-k]');
  if (k) { addToCart(lineItem(p, +k.dataset.k), k); flashAdded(k, pizzaDesc(p, +k.dataset.k)); }
});
document.addEventListener('change', (e) => {
  if (!e.target.matches('[data-crust]')) return;
  const id = e.target.closest('.order').dataset.id;
  e.target.checked ? crust.add(id) : crust.delete(id);
  refreshOrder(id);
});
// segmented radio groups (sizes, delivery/pickup, payment): arrow keys move the choice
document.addEventListener('keydown', (e) => {
  const g = e.target instanceof Element && e.target.closest('.seg[role="radiogroup"]');
  if (!g || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
  const opts = $$('[role="radio"]', g), i = opts.indexOf(e.target);
  if (i < 0) return;
  e.preventDefault();
  const n = e.key === 'Home' ? 0 : e.key === 'End' ? opts.length - 1 : (i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + opts.length) % opts.length;
  opts[n].click();
  ($$('[role="radio"]', g)[n] || opts[n]).focus();
});

const TAGS = [['veg', 'pill-veg', 'Vegetarian', ICON.leaf], ['hot', 'pill-hot', 'Spicy', ICON.chili], ['fish', 'pill-fish', 'Fish', ICON.fish]];
const tagsHtml = (p) => `<div class="tags">
  ${p.sticker ? `<span class="sticker">${p.sticker}</span>` : ''}
  ${TAGS.filter(([t]) => p.tags.includes(t)).map(([, cls, label, icon]) => `<span class="pill ${cls}">${icon}<span class="pill-txt">${label}</span></span>`).join('')}
</div>`;
const productInfo = (p, short = false) => `${tagsHtml(p)}
  <h3 class="p-name">${p.name}</h3>
  <p class="p-desc">${p.ing}</p>
  <p class="p-alg">${allergenLine(p, short)}</p>`;

/* ================= BASKET ================= */
const MIN_DELIVERY = 15;
const MIN_LABEL = '€15';
const cart = new Map();   // key -> { name, size, price, qty, thumb, kind }
let mode = 'delivery', pay = 'cash', zip = '', removed = null;   // zip: what was typed or tapped, in the area or not
const okZip = () => (zipState(zip) === 'ok' ? zip : '');
const cartCount = () => [...cart.values()].reduce((a, c) => a + c.qty, 0);
const cartSum = () => [...cart.values()].reduce((a, c) => a + c.qty * c.price, 0);
const keyOf = (it) => `${it.name}|${it.size}|${it.price}`;

// one postcode for the whole page: the hero ticket, the delivery band and the basket show the same one
const ZIP_FORMS = [['#heroZip', '#heroZipMsg'], ['#zip', '#zipMsg']];
const msgClass = (m) => (m === '#zipMsg' ? 'zip-msg' : 'today-msg');
function zipAnswer(v, short) {
  return ZONE.includes(v)
    ? `<span>${ICON.check}Yes, we deliver to ${v} (${areaOf(v)})${short ? '' : `: ${MIN_LABEL} minimum order, no delivery fee, ${when(30)}`}.</span><button type="button" class="mini-btn" data-zip="delivery">Start your order</button>`
    : `<span>${ICON.close}We don't deliver to ${v}. Pick up at Wollankstr. 20 instead, ready ${when(20)}.</span><button type="button" class="mini-btn" data-zip="pickup">Order for pickup</button>`;
}
// quiet: an answer brought up to date because the postcode changed elsewhere is not read out again
function paintZip(m, v, quiet) {
  const box = $(m);
  if (quiet) box.setAttribute('aria-live', 'off');
  box.className = msgClass(m);
  delete box.dataset.kind;
  if (/^\d{5}$/.test(v)) {
    box.classList.add(ZONE.includes(v) ? 'ok' : 'no');
    box.innerHTML = zipAnswer(v, m === '#heroZipMsg');
    box.dataset.zip = v;
  } else { box.textContent = ''; delete box.dataset.zip; }
  if (quiet) setTimeout(() => box.setAttribute('aria-live', 'polite'), 0);
}
function syncZip() {
  ['#heroZip', '#zip'].forEach((s) => { const i = $(s); if (document.activeElement !== i && i.value !== zip) { i.value = zip; i.removeAttribute('aria-invalid'); } });
  const want = /^\d{5}$/.test(zip) ? zip : '';
  ZIP_FORMS.forEach(([, m]) => { const box = $(m); if (box.dataset.kind !== 'format' && (box.dataset.zip || '') !== want) paintZip(m, want, true); });
}

// the basket is kept on this device (two weeks): a reload, a look at the legal pages or tomorrow's visit finds it
const STORE = 'pm-basket';
function saveBasket() {
  try { localStorage.setItem(STORE, JSON.stringify({ v: 1, t: Date.now(), cart: [...cart.values()], mode, zip, pay })); } catch (e) { /* storage off: the basket lives for this page only */ }
}
function loadBasket() {
  try {
    const b = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (!b || b.v !== 1 || !(Date.now() - b.t < 14 * 864e5)) return;
    (Array.isArray(b.cart) ? b.cart : []).forEach((c) => {
      if (!c || typeof c.name !== 'string' || typeof c.size !== 'string' || !(c.price > 0 && c.price < 500) || !(c.qty >= 1)) return;
      const it = { name: c.name.slice(0, 120), size: c.size.slice(0, 300), price: +c.price, qty: Math.min(99, Math.floor(c.qty)) };
      if (c.kind === 'pizza') it.kind = 'pizza';
      if (/^assets\/pizza\/[a-z]+-(top|angle)\.webp$/.test(c.thumb)) it.thumb = c.thumb;
      cart.set(keyOf(it), it);
    });
    if (b.mode === 'pickup') mode = 'pickup';
    if (b.pay === 'card') pay = 'card';
    if (typeof b.zip === 'string' && /^\d{0,5}$/.test(b.zip)) zip = b.zip;
  } catch (e) { /* a broken entry is simply ignored */ }
}

let sheetToast = null;   // an add from the pizza sheet: told once the sheet has closed
function addToCart(item, from) {
  const key = keyOf(item);
  const it = cart.get(key) || { ...item, qty: 0 };
  it.qty += 1;
  cart.set(key, it);
  removed = null;
  renderCart();
  flyToCart(from, item.thumb);
  const sum = cartSum(), what = item.kind === 'pizza' ? `${item.name}, ${item.size}` : item.name;
  if (!$('#cart').hidden) return announce(`${what} added. Total ${eur(sum)}.`);
  if (sheet && sheet.open) { sheetToast = { what, sum }; return; }
  const gap = mode === 'delivery' && sum < MIN_DELIVERY ? ` · ${eur(MIN_DELIVERY - sum)} more to reach the ${MIN_LABEL} delivery minimum (delivery is free)` : '';
  toast(`Added: ${what}${gap}`, isShown($('#orderBar')) ? null : { label: 'View basket', fn: () => openCart(true) });
}
function setMode(m) {
  mode = m;
  $$('.mode button').forEach((x) => { const on = x.dataset.mode === m; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
  $$('.deliv-only').forEach((f) => (f.hidden = m !== 'delivery'));
  $('#payCard').textContent = m === 'delivery' ? 'Card at the door' : 'Card at pickup';
  $('#fNote').placeholder = m === 'delivery' ? 'Doorbell, floor, anything we should know' : 'Anything we should know';
  renderCart();
}
function setPay(p) {
  pay = p;
  $$('.pay button').forEach((x) => { const on = x.dataset.pay === p; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
  saveBasket();
}
// the cheapest single item that closes the delivery gap (or the biggest one if none does)
function upsell(gap) {
  const pool = [...BOARD.flatMap((c) => c.items.map((it) => ({ name: it.n, size: it.d, price: it.p }))),
    ...PIZZAS.map((p) => lineItem(p, 0, false))].filter((x) => !cart.has(keyOf(x)));
  const closing = pool.filter((x) => x.price >= gap).sort((a, b) => a.price - b.price);
  return closing[0] || pool.sort((a, b) => b.price - a.price)[0];
}
let upsellItem = null;
// a line in the order review and on the confirmation: what, which size or what's inside, and the price
const orderLine = (c) => `<li><span>${c.qty}× ${esc(c.name)}<small>${esc(c.size)}</small></span><span class="num">${eur(c.qty * c.price)}</span></li>`;
// one status line under the basket and one button: each state says its thing once
function renderCart() {
  const n = cartCount(), sum = cartSum(), shop = shopState(), zs = zipState(zip);
  $('#cartCount').textContent = n;
  $('#cartBtn').hidden = !n;
  const rows = [...cart.entries()].map(([k, c]) => `<li data-key="${encodeURIComponent(k)}">
      <span class="ci-thumb" aria-hidden="true">${c.thumb ? `<img src="${sized(c.thumb, 240)}" alt="" width="44" height="44">` : ICON.box}</span>
      <span class="ci-name">${esc(c.name)}<small>${esc(c.size)}</small></span>
      <span class="qty" role="group" aria-label="Quantity, ${esc(c.name)}">
        <button type="button" data-dec aria-label="${c.qty > 1 ? 'One less' : 'Remove'}: ${esc(c.name)}">${c.qty > 1 ? ICON.minus : ICON.trash}</button>
        <b>${c.qty}</b>
        <button type="button" data-inc aria-label="One more: ${esc(c.name)}">${ICON.plus}</button>
      </span>
      <b class="ci-price num">${eur(c.qty * c.price)}</b>
    </li>`);
  if (removed) rows.splice(Math.min(removed.idx, rows.length), 0, `<li class="removed"><span>${esc(removed.item.name)} removed.</span><button type="button" class="mini-btn" data-undo>Undo</button></li>`);
  $('#cartList').innerHTML = rows.length ? rows.join('') : '<li class="cart-empty">Your basket is empty. Pick something tasty!</li>';
  $('#cartTotal').textContent = eur(sum);
  $('#formTotal').textContent = eur(sum);
  const deliv = mode === 'delivery';
  const out = deliv && zs === 'out';
  const short = deliv && !out && sum > 0 && sum < MIN_DELIVERY;
  const needZip = deliv && n && !out && !short && zs !== 'ok';
  const min = $('#cartMin');
  min.classList.toggle('is-short', short || (out && n > 0));
  const lead = deliv ? 30 : 20, late = !inTime(lead);
  const ahead = late ? `${shop.open ? 'Too close to closing time' : 'Closed now'}, so this is an order ahead for ${aheadLabel(lead)}. ` : '';
  if (!deliv) min.textContent = `${ahead}Pickup at Wollankstr. 20, ready ${when(20)}.`;
  else if (out) min.textContent = `We don't deliver to ${zip}. Pickup at Wollankstr. 20 is ready ${when(20)}.`;
  else if (!sum) min.textContent = `${ahead}Delivery from ${MIN_LABEL}, no delivery fee.`;
  else if (short) {
    upsellItem = upsell(MIN_DELIVERY - sum);
    min.innerHTML = `${ahead}Add ${eur(MIN_DELIVERY - sum)} more to reach the ${MIN_LABEL} delivery minimum (delivery itself is free).
      <span class="acts"><button type="button" class="mini-btn" data-act="pickup">Switch to pickup</button>${upsellItem ? `<button type="button" class="mini-btn" data-act="upsell">Add ${esc(upsellItem.name)} · ${eur(upsellItem.price)}</button>` : ''}</span>`;
  } else if (zs === 'ok') min.textContent = `${ahead}Free delivery to ${zip} (${areaOf(zip)}), ${when(30)}.`;
  else min.textContent = `${ahead}Delivery around Pankow ${when(30)}, no delivery fee.`;
  const inp = $('#cartZip');
  out ? inp.setAttribute('aria-invalid', 'true') : inp.removeAttribute('aria-invalid');
  inp.classList.toggle('is-ok', deliv && zs === 'ok');
  if (document.activeElement !== inp && inp.value !== zip) inp.value = zip;
  // out of the area the button does the one useful thing: switch to pickup
  const co = $('#checkout');
  co.disabled = !n || short || needZip;
  co.dataset.act = n && out ? 'pickup' : '';
  co.textContent = !n ? 'Basket is empty' : out ? `We don't deliver to ${zip} · Switch to pickup` : short ? `Below the ${MIN_LABEL} delivery minimum` : needZip ? 'Enter your postcode to continue' : `Continue · ${eur(sum)}`;
  $('#formSumTitle').textContent = `Your order · ${n} item${n === 1 ? '' : 's'} · ${eur(sum)}`;
  $('#formList').innerHTML = [...cart.values()].map(orderLine).join('');
  $('#placeOrder').textContent = !late ? `Place order · ${eur(sum)}` : `Pre-order for ${aheadLabel(lead)} · ${eur(sum)}`;
  $('#orderBar').hidden = !n;
  document.body.classList.toggle('has-order', n > 0);
  $('#obCount').textContent = n;
  $('#obTotal').textContent = eur(sum);
  $$('[data-zone]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.zone === zip));
  syncZip();
  saveBasket();
}
$('#cartMin').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  if (b.dataset.act === 'pickup') { setMode('pickup'); $('.mode [data-mode="pickup"]').focus(); }
  if (b.dataset.act === 'upsell' && upsellItem) { addToCart(upsellItem); $('#checkout').focus(); }
});
$('#cartList').addEventListener('click', (e) => {
  if (e.target.closest('[data-undo]')) {
    const entries = [...cart.entries()];
    entries.splice(removed.idx, 0, [removed.key, removed.item]);
    cart.clear(); entries.forEach(([k, v]) => cart.set(k, v));
    const key = removed.key; removed = null;
    renderCart();
    announce(`${cart.get(key).name} is back. Total ${eur(cartSum())}.`);
    const row = $$('#cartList li[data-key]').find((r) => decodeURIComponent(r.dataset.key) === key);
    (row ? $('[data-inc]', row) : $('#cartClose')).focus();
    return;
  }
  const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
  if (!inc && !dec) return;
  const li = e.target.closest('li'), key = decodeURIComponent(li.dataset.key), it = cart.get(key);
  const idx = [...cart.keys()].indexOf(key);
  it.qty += inc ? 1 : -1;
  removed = null;
  if (it.qty <= 0) { cart.delete(key); removed = { key, item: { ...it, qty: 1 }, idx }; }
  renderCart();
  announce(removed ? `${it.name} removed. Total ${eur(cartSum())}.` : `${it.name}: ${it.qty}. Total ${eur(cartSum())}.`);
  // focus stays with the same row, or moves to Undo after a removal (never onto another trash button)
  if (removed) return $('#cartList [data-undo]').focus();
  const row = $$('#cartList li[data-key]').find((r) => decodeURIComponent(r.dataset.key) === key);
  if (row) $(inc ? '[data-inc]' : '[data-dec]', row).focus();
});
$$('.mode button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('#cartZip').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
  zip = e.target.value;
  renderCart();
});
$$('.pay button').forEach((b) => b.addEventListener('click', () => setPay(b.dataset.pay)));

let lastFocus = null;
function showStep(step) {
  $('#cartMain').hidden = step !== 'basket';
  $('#cartForm').hidden = step !== 'form';
  $('#cartDone').hidden = step !== 'done';
  $('#cartTitle').textContent = { basket: 'Your basket', form: 'Your details', done: 'Order received' }[step];
}
const behindCart = () => [...document.body.children].filter((n) => !['cart', 'scrim', 'cartBtn', 'srLive'].includes(n.id) && n.tagName !== 'SCRIPT');
// focusTo: where focus goes after closing (otherwise back to where you were)
function openCart(open, focusTo) {
  const el = $('#cart');
  if (open === !el.hidden) return;
  $('#toast').classList.remove('show');
  el.hidden = !open;
  $('#scrim').hidden = !open;
  behindCart().forEach((n) => (n.inert = open));          // a modal: the page behind can't be reached
  $('#cartBtn').setAttribute('aria-expanded', open);
  $('#cartBtn .sr-only').textContent = open ? 'Close basket' : 'Open basket';
  if (open) {
    document.dispatchEvent(new Event('basketopen'));    // Ask Max steps aside for the basket
    lastFocus = document.activeElement;
    showStep('basket');
    renderCart();
    $('#cartClose').focus();
  } else {
    removed = null; renderCart();
    if (focusTo) return focusTo();
    // back to where you were, or the nearest visible thing (fixed elements have no offsetParent, so check boxes)
    const back = [lastFocus, cartCount() && $('#orderBar'), cartCount() && $('#cartBtn')].find((x) => x && isShown(x));
    back ? back.focus() : toMenu();
  }
}
// to the top of the menu: scroll there first, then focus its heading
function toMenu() {
  const h = $('#menu-title');
  h.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  focusHeading(h);
}
$('#cartBtn').addEventListener('click', () => openCart($('#cart').hidden));
$('#orderBar').addEventListener('click', () => openCart(true));
$('#cartClose').addEventListener('click', () => openCart(false));
$('#scrim').addEventListener('click', () => openCart(false));
$('#doneClose').addEventListener('click', () => openCart(false, toMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#cart').hidden) return openCart(false);
    if ($('#mainnav').classList.contains('open')) return closeNav(true);
    if (dealOpen >= 0 && $('#dealPanel').contains(document.activeElement)) return closeDeal(true);
  }
  if (e.key !== 'Tab') return;
  // keep focus inside whichever overlay is open
  let f = null;
  if (!$('#cart').hidden) f = $$('#cart button:not([disabled]), #cart input, #cart select, #cart summary, #cart a[href]').filter((x) => isShown(x) && x.tabIndex >= 0);
  else if ($('#mainnav').classList.contains('open')) f = [toggle, ...$$('#mainnav a')];
  if (!f || !f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
});
$('#checkout').addEventListener('click', (e) => {
  if (!cartCount()) return;
  if (e.currentTarget.dataset.act === 'pickup') {
    setMode('pickup');
    announce(`Switched to pickup at Wollankstr. 20. Total ${eur(cartSum())}.`);
    return;
  }
  showStep('form');
  setMode(mode);
  fillWhen();
  $('#fZipNote').innerHTML = `Delivering to ${okZip()} (${areaOf(okZip())}). <button type="button" class="link-btn" data-zip-change>Change</button>`;
  $('#fName').focus();
});
$('#formBack').addEventListener('click', () => { showStep('basket'); $('#checkout').focus(); });
$('#fZipNote').addEventListener('click', (e) => {
  if (!e.target.closest('[data-zip-change]')) return;
  showStep('basket');
  $('#cartZip').focus();
});
// as soon as possible, or a half-hour slot until closing time
function fillWhen() {
  const lead = mode === 'delivery' ? 30 : 20, ahead = startAt(lead);
  const start = ahead || berlinNow(), shop = shopState(start);
  const t = new Date(start.getTime() + (lead + 30) * 60000);
  t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15, 0, 0);   // the next quarter hour, half an hour after the soonest
  const at = hm(new Date(start.getTime() + lead * 60000));
  const opts = [`<option value="asap">${!ahead ? `As soon as possible (about ${lead} min)` : `As soon as we can: ${mode === 'delivery' ? 'at your door' : 'ready'} about ${at} ${dayWord(start)}`}</option>`];
  for (let k = 0; k < 12 && t.getTime() <= shop.closeAt.getTime() - 15 * 60000; k++, t.setMinutes(t.getMinutes() + 30)) {
    opts.push(`<option value="${t.getTime()}">${mode === 'delivery' ? 'Deliver' : 'Ready'} at ${hm(t)}</option>`);
  }
  $('#fWhen').innerHTML = opts.join('');
}
const CHECKS = {
  fName: (v) => (v.trim().length < 2 ? 'Please tell us your name.' : ''),
  fPhone: (v) => (v.replace(/[^\d+]/g, '').length < 6 ? 'Please enter a phone number we can call, e.g. 030 123 456 78.' : ''),
  fStreet: (v) => (mode === 'delivery' && v.trim().length < 4 ? 'Please enter your street and house number.' : ''),
};
// a field marked wrong is checked again while you type, so the message goes as soon as it's fixed
Object.keys(CHECKS).forEach((id) => $('#' + id).addEventListener('input', (e) => {
  if (e.target.getAttribute('aria-invalid') === 'true') fieldError(id, CHECKS[id](e.target.value));
}));
function fieldError(id, msg) {
  const inp = $('#' + id), err = $(`#${id}Err`);
  err.textContent = msg || '';
  msg ? inp.setAttribute('aria-invalid', 'true') : inp.removeAttribute('aria-invalid');
  return !msg;
}
$('#cartForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (mode === 'delivery' && !okZip()) { showStep('basket'); return $('#cartZip').focus(); }
  const ok = Object.keys(CHECKS).map((id) => fieldError(id, CHECKS[id]($('#' + id).value)));
  if (ok.includes(false)) return $('#cartForm [aria-invalid="true"]').focus();
  const name = $('#fName').value.trim(), street = $('#fStreet').value.trim(), note = $('#fNote').value.trim(), when = $('#fWhen').value;
  const lead = mode === 'delivery' ? 30 : 20, ahead = startAt(lead);
  const asap = when === 'asap', start = ahead || berlinNow();
  const eta = asap ? new Date(start.getTime() + lead * 60000) : new Date(+when);
  const hhmm = eta.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const where = mode === 'delivery' ? `Arriving around ${hhmm}.` : `Ready for pickup around ${hhmm} at Wollankstr. 20.`;
  const ref = 'PM-' + String(Date.now()).slice(-4);
  // one story: the line, the tracker and the time all say the same thing
  $('#doneStamp').textContent = `Thanks, ${name.split(/\s+/)[0]}!`;
  $('#doneRef').innerHTML = `Order <b class="num">${ref}</b> for ${esc(name)}`;
  $('#doneEta').textContent = ahead && asap ? `Ordered ahead for ${dayWord(start)}. ${where}` : asap ? `We've got your order. ${where}` : `Scheduled. ${where}`;
  $('#doneTo').textContent = (mode === 'delivery' ? `To ${street}, ${okZip()} · paying ${pay === 'cash' ? 'cash' : 'by card'} at the door` : `Paying ${pay === 'cash' ? 'cash' : 'by card'} at pickup`) + (note ? ` · Note: ${note}` : '');
  $('#doneNow').textContent = !ahead && asap ? 'In the oven' : 'Scheduled';
  $('#doneLast').textContent = mode === 'delivery' ? 'On its way' : 'Ready to collect';
  $('#doneList').innerHTML = [...cart.values()].map(orderLine).join('')
    + `<li class="tot"><span>Total</span><span class="num">${eur(cartSum())}</span></li>`;
  cart.clear(); removed = null; renderCart();
  showStep('done');
  const done = $('#cartDone');
  done.classList.remove('play'); void done.offsetWidth; done.classList.add('play');
  $('#cartTitle').focus();
});
loadBasket();
setMode(mode);
setPay(pay);

/* ================= FILTER ================= */
let filter = 'all';
const passes = (tags) => filter === 'all' || tags.includes(filter) || (filter === 'meat' && tags.includes('fish'));
const shown = () => PIZZAS.filter((p) => passes(p.tags));
const shownItems = (c) => c.items.map((it, i) => ({ it, i })).filter(({ it }) => passes(it.t));


/* ================= VIEW: PIZZA WHEEL ================= */
// a prize wheel: the chosen slice always turns to the pointer at the top
let wheelSel = 0, wheelRot = 0, spinning = false, warmed = false;
const WHEEL_IMG = { x: 10.5, s: 199 };   // the top-view render's crust lands on the wheel's r=90 rim
const restAngle = (i, n) => -((i + .5) / n) * 360;
const nearestTurn = (target, from) => from + ((((target - from) % 360) + 540) % 360) - 180;
function turnWheel(deg) {
  wheelRot = deg;
  $('#wheelRot').style.transform = `rotate(${deg}deg)`;
  $('#wheel').style.setProperty('--rot', `${deg}deg`);
}
function renderWheel() {
  const list = shown(), n = list.length, src = (p) => (phone() ? sized(STILLS[p.id].top, 480) : STILLS[p.id].top);
  wheelSel = Math.min(wheelSel, n - 1);
  wheelRot = nearestTurn(restAngle(wheelSel, n), wheelRot);
  let defs = '<defs>', body = '<circle class="wheel-rim" cx="110" cy="110" r="97"/>';
  body += `<g class="wheel-rot" id="wheelRot" style="transform: rotate(${wheelRot}deg)">`;
  list.forEach((p, i) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2, am = (a0 + a1) / 2;
    const pt = (a, r) => [(110 + Math.cos(a) * r).toFixed(2), (110 + Math.sin(a) * r).toFixed(2)];
    const wedge = n === 1 ? 'M110 20 A90 90 0 1 1 109.99 20Z' : `M110 110 L${pt(a0, 90).join(' ')} A90 90 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${pt(a1, 90).join(' ')}Z`;
    const [nx, ny] = pt(am, 74);
    defs += `<clipPath id="wc${i}"><path d="${wedge}"/></clipPath>`;
    body += `<g class="wedge${i === wheelSel ? ' is-on' : ''}" data-i="${i}" tabindex="${i === wheelSel ? 0 : -1}" role="radio" aria-checked="${i === wheelSel}" aria-label="${p.name}"
      style="--dx:${n > 1 ? (Math.cos(am) * 9).toFixed(1) : 0}px;--dy:${n > 1 ? (Math.sin(am) * 9).toFixed(1) : 0}px">
      <g clip-path="url(#wc${i})"><image ${warmed ? 'href' : 'data-href'}="${src(p)}" x="${WHEEL_IMG.x}" y="${WHEEL_IMG.x}" width="${WHEEL_IMG.s}" height="${WHEEL_IMG.s}"/></g>
      <path class="wedge-edge" d="${wedge}"/>
      <circle class="wedge-dot" cx="${nx}" cy="${ny}" r="10.5"/>
      <text class="wedge-num" x="${nx}" y="${(+ny + 4.3).toFixed(1)}" text-anchor="middle">${i + 1}</text>
    </g>`;
  });
  body += '</g><path class="wheel-pointer" d="M101 1h18l-9 21Z"/>';
  $('#wheel').innerHTML = defs + '</defs>' + body;
  $('#wheel').setAttribute('role', 'radiogroup');
  $('#wheel').style.setProperty('--rot', `${wheelRot}deg`);
  $('#wheelLegend').innerHTML = list.map((p, i) => `<li data-i="${i}"${i === wheelSel ? ' class="is-on"' : ''}><b>${i + 1}</b>${p.name}</li>`).join('');
  wheelName(null);
  renderWheelDetail();
}
function renderWheelDetail() {
  const list = shown(), p = list[wheelSel];
  $('#wheelDetail').innerHTML = `
    ${productInfo(p)}
    ${priceGrid(p)}
    ${buyRow(p)}
    <div class="wheel-nav">
      <button type="button" class="wn" data-step="-1" aria-label="Previous pizza">${ICON.arrow}</button>
      <span>Slice ${wheelSel + 1} of ${list.length}</span>
      <button type="button" class="wn" data-step="1" aria-label="Next pizza">${ICON.arrow}</button>
    </div>`;
}
// turn: false while a spin already carries the wheel to this slice
function pickWheel(i, turn = true) {
  const list = shown();
  wheelSel = (i + list.length) % list.length;
  $$('#wheel .wedge').forEach((w) => { const on = +w.dataset.i === wheelSel; w.classList.toggle('is-on', on); w.setAttribute('aria-checked', on); w.setAttribute('tabindex', on ? 0 : -1); });
  $$('#wheelLegend li').forEach((li) => li.classList.toggle('is-on', +li.dataset.i === wheelSel));
  if (turn) turnWheel(nearestTurn(restAngle(wheelSel, list.length), wheelRot));
  renderWheelDetail();
  wheelName(null);
  $('#wheelLive').textContent = `Slice ${wheelSel + 1} of ${list.length}: ${list[wheelSel].name}`;
}
// the hub always names the chosen slice; hover or focus previews another
function wheelName(i) {
  const list = shown(), p = list[i ?? wheelSel];
  if (!p || spinning) return;
  const el = $('#wheelName');
  el.textContent = p.name;
  el.classList.toggle('is-preview', i != null && i !== wheelSel);
}
$('#wheel').addEventListener('click', (e) => { const w = e.target.closest('.wedge'); if (w && !spinning) pickWheel(+w.dataset.i); });
$('#wheel').addEventListener('pointerover', (e) => { const w = e.target.closest('.wedge'); wheelName(w ? +w.dataset.i : null); });
$('#wheel').addEventListener('pointerleave', () => wheelName(null));
$('#wheel').addEventListener('focusin', (e) => { const w = e.target.closest('.wedge'); if (w) wheelName(+w.dataset.i); });
$('#wheel').addEventListener('focusout', () => wheelName(null));
$('#wheel').addEventListener('keydown', (e) => {
  const w = e.target.closest('.wedge');
  if (!w || spinning) return;
  const i = +w.dataset.i, n = shown().length;
  const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
  if (to != null) { e.preventDefault(); pickWheel(to); $(`#wheel .wedge[data-i="${wheelSel}"]`).focus(); }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickWheel(i); }
});
$('#wheelLegend').addEventListener('click', (e) => { const li = e.target.closest('li'); if (li && !spinning) pickWheel(+li.dataset.i); });
// spin: two turns and a bit while the hub flicks through the names; it stops with the chosen slice under the pointer
function spinWheel() {
  const list = shown(), n = list.length;
  if (spinning || n < 2) return;
  let i;
  do { i = Math.floor(Math.random() * n); } while (i === wheelSel);
  if (reduced) return pickWheel(i);
  spinning = true;
  const g = $('#wheelRot'), name = $('#wheelName'), from = wheelRot;
  const to = from + 720 + ((((restAngle(i, n) - from) % 360) + 360) % 360);
  let k = wheelSel;
  const flick = setInterval(() => { name.textContent = list[++k % n].name; }, 90);
  g.style.transition = 'none';                 // a transition would override the spin
  turnWheel(to);
  g.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }], { duration: 1600, easing: 'cubic-bezier(.15, .7, .2, 1)' });
  setTimeout(() => {                           // a timer, so a background tab still lands
    clearInterval(flick);
    spinning = false;
    g.style.transition = '';
    pickWheel(i, false);
  }, 1600);
}
$('#wheelSpin').addEventListener('click', spinWheel);
$('#wheelDetail').addEventListener('click', (e) => {
  const step = e.target.closest('[data-step]');
  if (step && !spinning) {
    const d = step.dataset.step;
    pickWheel(wheelSel + +d);
    $(`#wheelDetail [data-step="${d}"]`).focus();   // the detail was re-rendered: keep your place
  }
});

/* ================= VIEW: CARDS (compact rows, one tap to add) ================= */
// the picture, what's on it, what it costs in each size, and one red button; sizes and crust are in the sheet
function renderCards() {
  $('#cards').innerHTML = shown().map((p) => `
    <article class="pcard" data-id="${p.id}">
      <div class="pcard-art" aria-hidden="true">${still(STILLS[p.id].top, '(max-width: 560px) 92px, 150px', 'loading="lazy"')}</div>
      <div class="pcard-body">
        <h3 class="p-name">${p.name}</h3>
        ${tagsHtml(p)}
        <p class="p-desc">${p.ing}</p>
        <p class="p-alg">${allergenLine(p, true)}</p>
        <div class="pcard-buy">${priceGrid(p)}${buyRow(p)}</div>
      </div>
    </article>`).join('');
}

/* ================= VIEW: FULL LIST (the printed menu) ================= */
// one line per pizza: the three prices are the add buttons; the name opens the sheet for the crust
function renderBoard() {
  $('#board').innerHTML = `<div class="board-top">
      <h3>Pizza</h3>
      <p class="cat-note">Tap a price to add that size. For a cheese-stuffed crust (+${eur(CRUST)}), tap the pizza's name. Letters and numbers are allergens and additives (<a href="#allergene">key</a>).</p>
    </div>
    <ul class="board-list">${shown().map((p) => `<li class="order board-row" data-id="${p.id}">
      <span class="bn"><button type="button" class="bn-name" data-opts aria-haspopup="dialog">${p.name}<span class="sr-only">, size and crust options</span></button>${p.sticker ? ` <span class="sticker">${p.sticker}</span>` : ''} <span class="crust-tag"${crust.has(p.id) ? '' : ' hidden'}>with cheese-stuffed crust</span>
        <span class="d">${p.ing} <span class="codes"><span class="sr-only">Allergens and additives: </span>${codesOf(p)}</span></span></span>
      <span class="size-adds">${SIZE_SHORT.map((s, k) => `<button type="button" data-k="${k}" aria-label="${sizeAddLabel(p, k)}"><span class="lbl">${sizeBtn(p, k)}</span></button>`).join('')}</span>
    </li>`).join('')}</ul>`;
}

/* ================= VIEW: BOXES (every pizza in its open box) ================= */
function renderBoxes() {
  $('#boxes').innerHTML = shown().map((p) => `
    <article class="pbox" data-id="${p.id}">
      <div class="pbox-stage" aria-hidden="true">
        <div class="pbox-lid"><span class="lid-logo"><small>Pizza</small>MAX</span></div>
        <div class="pbox-base">${still(STILLS[p.id].top, '(max-width: 560px) 150px, 270px', `loading="lazy" style="--k:${[.9, .96, 1][sel.get(p.id)]}"`)}</div>
      </div>
      <div class="pbox-info">${productInfo(p, true)}</div>
      ${priceGrid(p)}
      ${buyRow(p)}
    </article>`).join('') + `
    <article class="pbox pbox-more">
      <h3>Can't decide?</h3>
      <p>Spin the pizza wheel and it lands on a pizza for you.</p>
      <div class="more-acts"><button type="button" class="btn btn-red" data-goto-view="wheel">Spin the wheel</button></div>
    </article>`;
}

/* ================= THE OPTIONS SHEET: sizes, crust and add ================= */
// a bottom sheet on phones; on bigger screens it opens as a popover next to the button you pressed
const sheet = $('#pizzaSheet');
let sheetFrom = null, sheetT = 0;
function placeSheet(from) {
  sheet.style.left = sheet.style.top = '';
  sheet.classList.toggle('is-pop', !phone());
  if (phone() || !from) return;
  const r = from.getBoundingClientRect(), w = sheet.offsetWidth, h = sheet.offsetHeight;
  const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
  let top = r.bottom + 10;
  if (top + h > innerHeight - 12) top = r.top - h - 10;
  sheet.style.left = `${left}px`;
  sheet.style.top = `${Math.max(12, top)}px`;
}
function openSheet(id, from) {
  const p = byId(id);
  clearTimeout(sheetT);
  if (sheet.open) sheet.close();
  sheetFrom = from;
  sheet.innerHTML = `<div class="sheet-in" data-id="${p.id}">
    <div class="sheet-head"><h2 id="sheetTitle">${p.name}</h2><button type="button" class="sheet-close" data-sheet-close aria-label="Close">${ICON.close}</button></div>
    <div class="sheet-top">
      <div class="sheet-art" aria-hidden="true">${still(STILLS[p.id].top, '(max-width: 560px) 120px, 88px')}</div>
      <div>${tagsHtml(p)}<p class="p-desc">${p.ing}</p></div>
    </div>
    <p class="p-alg">${allergenLine(p)}</p>
    ${orderControls(p)}
  </div>`;
  sheet.setAttribute('aria-labelledby', 'sheetTitle');
  sheet.showModal();
  placeSheet(from);
  $('.seg [aria-checked="true"]', sheet).focus();
}
sheet.addEventListener('click', (e) => {
  if (e.target === sheet || e.target.closest('[data-sheet-close]')) return sheet.close();
  // added: the sheet keeps its "Added" a moment, then goes back to the menu, where the toast says what happened
  if (e.target.closest('[data-add]')) { clearTimeout(sheetT); sheetT = setTimeout(() => sheet.open && sheet.close(), 1300); }
});
sheet.addEventListener('close', () => {
  clearTimeout(sheetT);
  const f = sheetFrom; sheetFrom = null;
  if (f && isShown(f)) f.focus();
  if (sheetToast) {
    const { what, sum } = sheetToast; sheetToast = null;
    const gap = mode === 'delivery' && sum < MIN_DELIVERY ? ` · ${eur(MIN_DELIVERY - sum)} more to reach the ${MIN_LABEL} delivery minimum (delivery is free)` : '';
    setTimeout(() => toast(`Added: ${what}${gap}`, isShown($('#orderBar')) ? null : { label: 'View basket', fn: () => openCart(true) }), 120);
  }
});
// the popover stays with its button when the page scrolls or resizes underneath it
['resize', 'scroll'].forEach((ev) => addEventListener(ev, () => { if (sheet.open) placeSheet(sheetFrom); }, { passive: true }));

/* ================= MORE THAN PIZZA (under every view, with its own add buttons) ================= */
// a category per fold; on phones they start folded so the menu stays short, on bigger screens they're open
const moreOpen = new Set(phone() ? [] : BOARD.map((c) => c.cat));
function renderMore() {
  $('#moreCats').innerHTML = BOARD.map((c) => ({ c, items: shownItems(c) })).filter((x) => x.items.length).map(({ c, items }) => `
    <details class="more-cat" id="more-${c.cat}" data-cat="${c.cat}"${moreOpen.has(c.cat) ? ' open' : ''}>
      <summary><span class="mc-t">${c.title}</span><span class="mc-s">from <span class="num">${eur(Math.min(...items.map(({ it }) => it.p)))}</span></span></summary>
      <ul>${items.map(({ it, i }) => `<li><span class="n">${it.n}</span><span class="leader" aria-hidden="true"></span><span class="p num">${eur(it.p)}</span><button type="button" class="add-mini" data-c="${c.cat}" data-i="${i}" aria-label="Add to basket: ${it.n}, ${eur(it.p)}">${ICON.plus}</button><span class="d">${it.d}</span></li>`).join('')}</ul>
    </details>`).join('');
}
$('#moreCats').addEventListener('toggle', (e) => { const d = e.target; if (d.dataset.cat) d.open ? moreOpen.add(d.dataset.cat) : moreOpen.delete(d.dataset.cat); }, true);
$('#moreCats').addEventListener('click', (e) => {
  const b = e.target.closest('.add-mini');
  if (!b) return;
  const it = catItems(b.dataset.c)[+b.dataset.i];
  addToCart({ name: it.n, size: it.d, price: it.p }, b);
  flashAdded(b, `${it.n}, ${eur(it.p)}`);
});

/* ================= VIEW SWITCH + FILTER ================= */
const tabs = $$('.menu-switch [role="tab"]');
let motionApi = null;   // set once Motion loads; gives re-rendered items a short entrance
function enter(selector) {
  if (!motionApi || reduced) return;
  motionApi.animate($$(selector), { opacity: [0, 1], y: [12, 0] }, { duration: .35, delay: motionApi.stagger(.03), ease: [0.16, 1, 0.3, 1] });
}
// the view you chose is remembered on this device
const VIEWS = ['cards', 'wheel', 'board', 'boxes'];
let view = 'cards';
try { const v = localStorage.getItem('pm-view'); if (VIEWS.includes(v)) view = v; } catch (e) { /* storage off */ }
function showView(name, focus) {
  view = name;
  if (name === 'wheel') warm();
  tabs.forEach((t) => {
    const on = t.dataset.view === name;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
    $('#' + t.getAttribute('aria-controls')).hidden = !on;
  });
  try { localStorage.setItem('pm-view', name); } catch (e) { /* storage off */ }
  document.dispatchEvent(new CustomEvent('menuview', { detail: name }));
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => showView(t.dataset.view));
  t.addEventListener('keydown', (e) => {
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (n == null) return;
    e.preventDefault();
    showView(tabs[(n + tabs.length) % tabs.length].dataset.view, true);
  });
});
function renderAll() { renderCards(); renderWheel(); renderBoard(); renderBoxes(); renderMore(); }
$('#filter').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  filter = b.dataset.filter;
  $$('#filter button').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
  wheelSel = 0;
  renderAll();
  enter({ cards: '#cards .pcard', boxes: '#boxes .pbox', board: '#board .board-row', wheel: '#wheelDetail' }[view]);
  const nP = shown().length, nO = BOARD.reduce((a, c) => a + shownItems(c).length, 0);
  announce(`${b.textContent}: ${nP} pizza${nP === 1 ? '' : 's'} and ${nO} other dish${nO === 1 ? '' : 'es'}.`);
});
// a category link opens its fold under the menu, whichever view you're in
function gotoCategory(cat) {
  // a filter that hides this category is lifted first, so a category link always lands
  if (!$(`#more-${cat}`)) $('#filter [data-filter="all"]').click();
  const sec = $(`#more-${cat}`);
  if (!sec) return;
  sec.open = true;
  setTimeout(() => {   // after the fold has opened (a timer, not a frame: frames pause in background tabs)
    sec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    $('summary', sec).focus({ preventScroll: true });
    $$('li', sec).forEach((x) => { x.classList.remove('is-flash'); void x.offsetWidth; x.classList.add('is-flash'); });
  });
}
$('#menu').addEventListener('click', (e) => {
  const v = e.target.closest('[data-goto-view]');
  if (v) {
    showView(v.dataset.gotoView);
    toMenu();
    if (v.dataset.gotoView === 'wheel') setTimeout(spinWheel, reduced ? 0 : 500);
  }
});
renderAll();
// the wheel's pictures start loading when you point at (or focus) its tab, or open the wheel; not on page load
const warm = () => {
  if (warmed) return;
  warmed = true;
  $$('#wheel image[data-href]').forEach((im) => { im.setAttribute('href', im.dataset.href); im.removeAttribute('data-href'); });
};
['pointerenter', 'focus', 'touchstart'].forEach((ev) => $('#tab-wheel').addEventListener(ev, warm, { passive: true }));
showView(view);

/* ================= NAV: mobile drawer, categories, scroll-spy ================= */
const nav = $('#mainnav'), toggle = $('.nav-toggle');
function openNav() {
  nav.classList.add('open'); toggle.setAttribute('aria-expanded', 'true');
  $('.sr-only', toggle).textContent = 'Close menu';
  $('#navScrim').hidden = false;
  $('a', nav).focus();
}
function closeNav(refocus) {
  if (!nav.classList.contains('open')) return;
  nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false');
  $('.sr-only', toggle).textContent = 'Open menu';
  $('#navScrim').hidden = true;
  if (refocus) toggle.focus();
}
toggle.addEventListener('click', () => (nav.classList.contains('open') ? closeNav(true) : openNav()));
$('#navScrim').addEventListener('click', () => closeNav(true));
$$('#mainnav a, .site-footer a[data-cat]').forEach((a) => a.addEventListener('click', (e) => {
  closeNav();
  const cat = a.dataset.cat, href = a.getAttribute('href');
  if (cat && cat !== 'pizza') { e.preventDefault(); return gotoCategory(cat); }
  // the link may be hidden now (phone menu closed): focus follows the jump instead of staying behind
  const t = href && href.startsWith('#') && $(href);
  if (t) setTimeout(() => focusHeading(t.matches('h1, h2, h3') ? t : $('h2, h3', t)), 0);
}));
const spyLinks = $$('#mainnav [data-spy]');
const spy = (id) => spyLinks.forEach((l) => (l.dataset.spy === id ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
const spyIO = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) spy(en.target.dataset.spyId); }), { rootMargin: '-45% 0px -50% 0px' });
[['.hero', 'none'], ['#aktion', 'aktion'], ['#menu', 'menu'], ['.reviews', 'none'], ['.deliver', 'liefern'], ['.contact', 'kontakt']].forEach(([s, id]) => { const el = $(s); el.dataset.spyId = id; spyIO.observe(el); });

/* ================= DEALS (choose your pizzas, drinks and desserts) ================= */
// Each deal is the stack of boxes it leaves the shop in: one box for Solo, two for Duo, a tower of three bigger
// (Wumbo) boxes for Party. The top box is open on its pizza, the others carry the kitchen's label. Its order ticket
// stands in front, with the saving stamped on it. The chooser opens full width under the row. A quota of one is a
// choice of chips; with more, "+" on another item takes one from the default, so it never just says no.
const DRINKS = catItems('getraenke').map((d) => d.n), DESSERTS = catItems('desserts').map((d) => d.n);
const KIND = { drinks: { names: DRINKS, one: 'Drink', many: 'Drinks' }, desserts: { names: DESSERTS, one: 'Dessert', many: 'Desserts' } };
const dealPick = DEALS.map((d) => ({ pizzas: [...d.pizzas], drinks: { [DRINKS[0]]: d.drinks }, desserts: d.desserts ? { [DESSERTS[0]]: d.desserts } : {} }));
const used = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const itemPrice = (name) => BOARD.flatMap((c) => c.items).find((it) => it.n === name).p;
// what the picked pizzas, drinks and desserts cost on their own; the saving is worked out from it
function separately(i) {
  const d = DEALS[i], pk = dealPick[i];
  const sum = pk.pizzas.reduce((a, id) => a + byId(id).price[d.size], 0)
    + ['drinks', 'desserts'].reduce((a, k) => a + Object.entries(pk[k]).reduce((b, [n, q]) => b + q * itemPrice(n), 0), 0);
  return Math.round(sum * 100) / 100;
}
const dealPrice = (d, i) => `<p class="deal-price num">${eur(d.price)}</p>
  <p class="deal-was">separately <s class="num" data-sep="${i}">${eur(separately(i))}</s> · you save <b class="num" data-save="${i}">${eur(separately(i) - d.price)}</b></p>`;
// the stack: the open box on top shows the first pizza; every box carries its pizza's name on the label
const towerHtml = (i) => {
  const pk = dealPick[i].pizzas;
  return `<span class="tw-lid"></span>
    <span class="tw-floor">${still(STILLS[pk[0]].top, '(max-width: 560px) 110px, 180px', 'loading="lazy"')}</span>
    ${pk.map((id, j) => `<span class="tw-box"><span class="tw-label" data-tw="${j}">${byId(id).short}</span></span>`).join('')}`;
};
function syncDealPrice(i) {
  $$(`[data-sep="${i}"]`).forEach((x) => (x.textContent = eur(separately(i))));
  $$(`[data-save="${i}"]`).forEach((x) => (x.textContent = eur(separately(i) - DEALS[i].price)));
}
let dealOpen = -1;
const dealBtn = (i, open) => (open ? `Close: the ${DEALS[i].title} deal` : `Choose & add: the ${DEALS[i].title} deal`);
$('#strip').insertAdjacentHTML('afterbegin', DEALS.map((d, i) => `<article class="deal deal-${d.pizzas.length}" data-deal="${i}">
    <div class="tower" aria-hidden="true">${towerHtml(i)}</div>
    <div class="deal-ticket">
      <h3>${d.title}</h3>
      <ul>${d.items.map((x) => `<li>${x}</li>`).join('')}</ul>
      <p class="deal-was">separately <s class="num" data-sep="${i}">${eur(separately(i))}</s></p>
      <p class="deal-price num">${eur(d.price)}</p>
      <p class="deal-stamp">save <span class="num" data-save="${i}">${eur(separately(i) - d.price)}</span></p>
      <button type="button" class="btn btn-red" data-deal-open aria-expanded="false" aria-controls="dealPanel" aria-label="${dealBtn(i, false)}">Choose &amp; add</button>
    </div>
  </article>`).join(''));
function pickerHtml(i, kind) {
  const d = DEALS[i], q = d[kind], K = KIND[kind], pick = dealPick[i][kind];
  if (q === 1) {
    const cur = K.names.find((n) => pick[n]) || K.names[0];
    return `<fieldset class="dp-col pick"><legend>${K.one} <span>pick one</span></legend>
      <div class="chips">${K.names.map((n) => `<label class="chip"><input type="radio" name="deal${i}-${kind}" value="${n}" data-one="${kind}"${n === cur ? ' checked' : ''}><span>${n}</span></label>`).join('')}</div>
    </fieldset>`;
  }
  return `<fieldset class="dp-col pick"><legend>${K.many} <span data-left="${kind}"></span></legend>
    ${K.names.map((n) => `<div class="pick-row"><span>${n}</span><span class="qty" role="group" aria-label="${n}">
      <button type="button" data-cnt="${kind}" data-name="${n}" data-d="-1" aria-label="One less ${n}">${ICON.minus}</button>
      <b data-val="${kind}:${n}">${pick[n] || 0}</b>
      <button type="button" data-cnt="${kind}" data-name="${n}" data-d="1" aria-label="One more ${n}">${ICON.plus}</button></span></div>`).join('')}
  </fieldset>`;
}
function dealPanelHtml(i) {
  const d = DEALS[i], pick = dealPick[i], np = d.pizzas.length;
  return `<div class="dp-head">
      <h3 id="dealPanelTitle">${d.title} deal<span>: choose what's in it</span></h3>
      <button type="button" class="dp-close" data-deal-close aria-label="Close the ${d.title} deal">${ICON.close}</button>
    </div>
    <div class="dp-body">
      <fieldset class="dp-col dp-pizzas"><legend>${np === 1 ? 'Pizza' : `${np} pizzas`} <span>${SIZES[d.size]}</span></legend>
        ${pick.pizzas.map((id, j) => `<label class="pick-pizza"><img src="${sized(STILLS[id].top, 240)}" alt="" width="52" height="52" data-slot-img="${j}">
          <span class="pp-n">Pizza ${j + 1}<span class="sr-only"> of ${np}</span></span>
          <select data-slot="${j}">${PIZZAS.map((p) => `<option value="${p.id}"${p.id === id ? ' selected' : ''}>${p.name}</option>`).join('')}</select></label>`).join('')}
      </fieldset>
      ${['drinks', 'desserts'].filter((k) => d[k]).map((k) => pickerHtml(i, k)).join('')}
      <div class="dp-add">
        ${dealPrice(d, i)}
        <button type="button" class="btn btn-red btn-block" data-deal-add><span class="add-label">Add the ${d.title} deal</span> · <span class="num">${eur(d.price)}</span></button>
      </div>
    </div>`;
}
// counters say how many are chosen; "+" stops only when one item already holds the whole quota
function syncCounts() {
  if (dealOpen < 0) return;
  const panel = $('#dealPanel'), d = DEALS[dealOpen], pick = dealPick[dealOpen];
  ['drinks', 'desserts'].filter((k) => d[k] > 1).forEach((kind) => {
    const q = d[kind], n = used(pick[kind]), left = q - n;
    $(`[data-left="${kind}"]`, panel).textContent = left ? `${n} of ${q} chosen, ${left} left` : `${n} of ${q} chosen`;
    $$(`[data-cnt="${kind}"]`, panel).forEach((b) => {
      const v = pick[kind][b.dataset.name] || 0;
      b.disabled = +b.dataset.d > 0 ? v >= q : v <= 0;
      $(`[data-val="${kind}:${b.dataset.name}"]`, panel).textContent = v;
    });
  });
  $('[data-deal-add]', panel).disabled = ['drinks', 'desserts'].some((k) => d[k] && used(pick[k]) !== d[k]);
}
function openDeal(i) {
  const panel = $('#dealPanel');
  dealOpen = i;
  panel.innerHTML = dealPanelHtml(i);
  panel.setAttribute('aria-labelledby', 'dealPanelTitle');
  panel.hidden = false;
  $$('#strip .deal').forEach((card) => {
    const on = +card.dataset.deal === i, b = $('[data-deal-open]', card);
    card.classList.toggle('is-open', on);
    b.setAttribute('aria-expanded', on);
    b.textContent = on ? 'Close' : 'Choose & add';
    b.setAttribute('aria-label', dealBtn(+card.dataset.deal, on));
    b.className = `btn ${on ? 'btn-ghost' : 'btn-red'}`;
  });
  // in a row the panel opens under the whole row; in a list (narrow screens) right under its deal
  const card = $(`#strip .deal[data-deal="${i}"]`);
  panel.style.order = getComputedStyle($('#strip')).gridTemplateColumns.split(' ').length > 1 ? '' : (+getComputedStyle(card).order || 0) + 1;
  // the panel's notch points up at its deal
  const pr = panel.getBoundingClientRect(), cr = card.getBoundingClientRect();
  panel.style.setProperty('--notch', `${Math.max(24, Math.min(pr.width - 24, cr.left + cr.width / 2 - pr.left))}px`);
  syncCounts();
  $('select', panel).focus({ preventScroll: true });
  panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
}
function closeDeal(refocus) {
  if (dealOpen < 0) return;
  const card = $(`#strip .deal[data-deal="${dealOpen}"]`), b = $('[data-deal-open]', card);
  dealOpen = -1;
  $('#dealPanel').hidden = true;
  card.classList.remove('is-open');
  b.setAttribute('aria-expanded', 'false');
  b.textContent = 'Choose & add';
  b.setAttribute('aria-label', dealBtn(+card.dataset.deal, false));
  b.className = 'btn btn-red';
  if (refocus) b.focus();
}
$('#strip').addEventListener('click', (e) => {
  const open = e.target.closest('[data-deal-open]');
  if (!open) return;
  const i = +open.closest('.deal').dataset.deal;
  dealOpen === i ? closeDeal(true) : openDeal(i);
});
$('#dealPanel').addEventListener('change', (e) => {
  const i = dealOpen, s = e.target.closest('[data-slot]');
  if (s) {
    const j = +s.dataset.slot;
    dealPick[i].pizzas[j] = s.value;
    $(`[data-slot-img="${j}"]`).src = sized(STILLS[s.value].top, 240);
    // the stack follows: the box's label, and the pizza in the open box on top
    const deal = $(`#strip .deal[data-deal="${i}"]`);
    $(`[data-tw="${j}"]`, deal).textContent = byId(s.value).short;
    if (j === 0) { const art = $('.tw-floor img', deal); art.srcset = srcset(STILLS[s.value].top); art.src = sized(STILLS[s.value].top, 480); }
    syncDealPrice(i);
    return;
  }
  const one = e.target.closest('[data-one]');
  if (one) {
    dealPick[i][one.dataset.one] = { [one.value]: 1 };
    syncDealPrice(i);
    announce(`${one.value} chosen.`);
  }
});
$('#dealPanel').addEventListener('click', (e) => {
  if (e.target.closest('[data-deal-close]')) return closeDeal(true);
  const i = dealOpen, d = DEALS[i], pick = dealPick[i];
  const c = e.target.closest('[data-cnt]');
  if (c) {
    const kind = c.dataset.cnt, name = c.dataset.name, q = d[kind], p = pick[kind], cur = p[name] || 0;
    let donor = null;
    if (+c.dataset.d < 0) {
      if (!cur) return;
      p[name] = cur - 1;
    } else {
      if (cur >= q) return;
      if (used(p) >= q) {   // full: swap one in from the default item, or else from the biggest pile
        donor = [KIND[kind].names[0], ...Object.keys(p).sort((a, b) => p[b] - p[a])].find((nm) => nm !== name && p[nm] > 0);
        if (!donor) return;
        p[donor] -= 1;
      }
      p[name] = cur + 1;
    }
    syncCounts();
    syncDealPrice(i);
    if (c.disabled) $(`[data-cnt="${kind}"][data-name="${name}"][data-d="${-c.dataset.d}"]`, $('#dealPanel'))?.focus();
    announce(`${name}: ${p[name]}.${donor ? ` ${donor}: ${p[donor]}.` : ''} ${KIND[kind].many}: ${used(p)} of ${q} chosen.`);
    return;
  }
  const add = e.target.closest('[data-deal-add]');
  if (add) {
    const list = (o) => Object.entries(o).filter(([, n]) => n).map(([nm, n]) => `${n}× ${nm}`).join(', ');
    const desc = [pick.pizzas.map((id) => byId(id).name).join(', ') + ` (${SIZE_SHORT[d.size]})`, list(pick.drinks), list(pick.desserts)].filter(Boolean).join(' · ');
    addToCart({ name: `${d.title} deal`, size: desc, price: d.price, thumb: STILLS[pick.pizzas[0]].top }, add);
    flashAdded(add, `the ${d.title} deal, ${eur(d.price)}`);
  }
});

/* ================= 3D PIZZA ================= */
// With the open-the-box intro running, the hero builds its pizza only once the intro's pizza has landed
// (two WebGL scenes at once are heavy on phones); the intro waits for its first frame, then cross-fades.
const stage = $('#pizza3d');
stage.classList.add('is-loading');
let pizza = null, heroDrawn;
window.pmHeroReady = new Promise((res) => (heroDrawn = res));
const introOn = document.documentElement.classList.contains('intro-on');
const sliceMsg = (r) => (r === 'out' ? 'Slice pulled out. Tap it to put it back, or drag to turn the pizza.' : 'Slice back in place.');
const webgl = (window.pmGL ??= (() => { try { const g = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl'); g?.getExtension('WEBGL_lose_context')?.loseContext(); return !!g; } catch (e) { return false; } })());   // shared with js/intro.js
// without the intro, the 3D waits for a quiet moment so it doesn't hold up your first taps
const idle = () => new Promise((res) => (window.requestIdleCallback ? requestIdleCallback(res, { timeout: 3000 }) : setTimeout(res, 1500)));
(introOn ? (window.pmIntroDone || Promise.resolve()) : idle())
  .then(() => (webgl ? import('./pizza3d.js') : Promise.reject(new Error('no WebGL'))))
  .then(({ createPizza }) => {
    pizza = createPizza(stage, { autoIntro: !introOn, onReady: heroDrawn });
    if (introOn) pizza.intro(true);
    stage.addEventListener('slice', (e) => toast(sliceMsg(e.detail)));
  }).catch(() => {
    heroDrawn();
    stage.classList.remove('is-loading');
    stage.style.cursor = 'auto';
    stage.setAttribute('aria-label', 'Our Veggie Garden pizza on a wooden board');
    stage.innerHTML = `<img src="${STILLS.garden.angle}" alt="" style="width:86%;margin:4% auto">`;
    $('#pullSlice').hidden = true;
  });
$('#pullSlice').addEventListener('click', () => {
  if (!pizza) return;
  toast(sliceMsg(pizza.grabRandom()));
});
$('#heroAdd').addEventListener('click', (e) => { addToCart(lineItem(byId('garden'), 1), e.currentTarget); flashAdded(e.currentTarget, pizzaDesc(byId('garden'), 1)); });
heroLabel();

/* ================= OPEN NOW ================= */
(function openStatus() {
  const s = shopState(), d = berlinNow().getDay();
  const text = s.open ? `Open now · until ${s.until}` : `Closed · opens ${s.nextLabel}`;
  const el = $('#openStatus');
  el.classList.add(s.open ? 'is-open' : 'is-closed');
  $('span', el).textContent = text;
  $('#openFoot').textContent = text;
  const row = { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 1 }[d];
  $$('.hours div')[row]?.classList.add('is-today');
  // today's oven ticket: the date, open or not, and what that means for pickup and delivery
  const today = $('#todayOpen');
  today.classList.add(s.open ? 'is-open' : 'is-closed');
  $('span', today).textContent = s.open ? `Open now, until ${s.until}` : `Closed now · opens ${s.nextLabel}`;
  $('#todayDate').textContent = berlinNow().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  // closed: the soonest a pre-order is ready or at the door (the day only when it isn't today)
  const soon = (lead) => { const t = startAt(lead), at = new Date(t.getTime() + lead * 60000); return `${hm(at)}${dayWord(t) === 'today' ? '' : ` ${dayWord(t)}`}`; };
  $('#todayPickup').textContent = inTime(20) ? 'ready in about 20 min' : `pre-order, ready ${soon(20)}`;
  $('#todayDelivery').textContent = inTime(30) ? 'in about 30 min' : `pre-order, from ${soon(30)}`;
  // closed (or too close to closing): the hero's button says what it can actually do
  const ahead = startAt(20);
  if (ahead) $('#heroCta').textContent = `Pre-order for ${hm(ahead)}${dayWord(ahead) === 'today' ? '' : ` ${dayWord(ahead)}`}`;
})();

/* ================= DELIVERY AREA: type a postcode or tap one ================= */
$('#zoneList').innerHTML = AREAS.map(([area, codes]) => `<li><span class="zone-area">${area}</span>
  <span class="zone-codes">${codes.map((z) => `<button type="button" class="zone-code num" data-zone="${z}" aria-pressed="false" aria-label="${z}, ${area}">${z}</button>`).join('')}</span></li>`).join('');
function checkZip(v, inpSel = '#zip', msgSel = '#zipMsg') {
  const inp = $(inpSel), msg = $(msgSel);
  if (!/^\d{5}$/.test(v)) {
    msg.className = `${msgClass(msgSel)} no`;
    delete msg.dataset.zip;
    inp.setAttribute('aria-invalid', 'true');
    msg.dataset.kind = 'format';
    msg.innerHTML = `<span>${ICON.close}Please enter a five-digit postcode, e.g. 13187.</span>`;
    inp.focus();
    return;
  }
  zip = v;
  inp.removeAttribute('aria-invalid');
  paintZip(msgSel, v);   // the check you used answers out loud; the others and the basket follow quietly
  renderCart();
}
$('#zipForm').addEventListener('submit', (e) => { e.preventDefault(); checkZip($('#zip').value.trim()); });
$('#heroZipForm').addEventListener('submit', (e) => { e.preventDefault(); checkZip($('#heroZip').value.trim(), '#heroZip', '#heroZipMsg'); });
$('#zoneList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-zone]');
  if (!b) return;
  checkZip(b.dataset.zone);
  const m = $('#zipMsg').getBoundingClientRect();
  if (m.top < 70 || m.bottom > innerHeight) $('#zipMsg').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
});
['#zipMsg', '#heroZipMsg'].forEach((m) => $(m).addEventListener('click', (e) => {
  const b = e.target.closest('[data-zip]');
  if (!b) return;
  setMode(b.dataset.zip);
  toMenu();
}));
// typing again clears a "five digits, please" message as soon as the field is fixable again
ZIP_FORMS.forEach(([i, m]) => $(i).addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
  e.target.removeAttribute('aria-invalid');
  const msg = $(m);
  if (msg.dataset.kind === 'format') { msg.textContent = ''; msg.className = msgClass(m); delete msg.dataset.kind; }
}));
renderCart();   // the restored postcode lights its tile

/* ================= HEADER STATE ================= */
const header = $('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ================= FLY TO BASKET (continuity: item -> basket) ================= */
function flyToCart(from, thumb) {
  const bar = $('#orderBar'), btn = !bar.hidden && bar.offsetParent ? bar : $('#cartBtn');
  const bump = () => { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); };
  if (!from || reduced || !from.getBoundingClientRect || !btn.offsetParent) return bump();
  const a = from.getBoundingClientRect(), b = btn.getBoundingClientRect();
  const x0 = a.left + a.width / 2 - 20, y0 = a.top + a.height / 2 - 20;
  const x1 = b.left + Math.min(b.width, 60) / 2 - 20, y1 = b.top + b.height / 2 - 20;
  const dot = document.createElement('div');
  dot.className = 'fly';
  dot.innerHTML = thumb ? `<img src="${sized(thumb, 240)}" alt="">` : ICON.box;
  document.body.appendChild(dot);
  const peak = Math.min(y0, y1) - 120;
  dot.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(.6) rotate(0deg)`, opacity: 0 },
    { transform: `translate(${x0}px, ${y0}px) scale(1.15) rotate(40deg)`, opacity: 1, offset: .15 },
    { transform: `translate(${(x0 + x1) / 2}px, ${peak}px) scale(1) rotate(200deg)`, offset: .55 },
    { transform: `translate(${x1}px, ${y1}px) scale(.35) rotate(360deg)`, opacity: .9 },
  ], { duration: 720, easing: 'cubic-bezier(.45, 0, .2, 1)' }).onfinish = () => { dot.remove(); bump(); };
}

/* ================= THE CORNER: call, find us, ask Max ================= */
// phones and tablets: one round button opens the three; Escape or a tap elsewhere closes them
const corner = $('#corner'), cornerToggle = $('#cornerToggle');
function openCorner(open) {
  corner.classList.toggle('is-open', open);
  cornerToggle.setAttribute('aria-expanded', open);
  cornerToggle.querySelector('.sr-only').textContent = open ? 'Close contact options' : 'Contact us';
}
cornerToggle.addEventListener('click', () => openCorner(!corner.classList.contains('is-open')));
document.addEventListener('click', (e) => { if (corner.classList.contains('is-open') && !corner.contains(e.target)) openCorner(false); });
corner.addEventListener('keydown', (e) => { if (e.key === 'Escape' && corner.classList.contains('is-open')) { openCorner(false); cornerToggle.focus(); } });
$$('.corner-tab', corner).forEach((t) => t.addEventListener('click', () => openCorner(false)));
// Ask Max loads on first use (js/chat.js) and reads the menu, prices, hours and delivery area from here
$$('[data-ask]').forEach((b) => b.addEventListener('click', () => {
  import('./chat.js').then((m) => m.openAsk(b)).catch(() => toast('The chat could not load. Call us on 030 123 456 78.'));
}));

/* ================= MOTION (the pizza turns as you scroll; view switches get a short entrance) ================= */
const EASE = [0.16, 1, 0.3, 1];
import('../vendor/motion/motion.esm.js').then(({ animate, scroll, stagger }) => {
  motionApi = { animate, stagger };
  // scrolling past the hero turns the pizza on its board
  if (!reduced) scroll((prog) => pizza && pizza.setSpin(prog * 2.2), { target: $('.hero'), offset: ['start start', 'end start'] });

  document.addEventListener('menuview', (e) => {
    if (reduced) return;
    if (e.detail === 'wheel') animate('#wheel', { rotate: [-120, 0], scale: [.88, 1] }, { duration: .9, ease: EASE });
    if (e.detail === 'cards') enter('#cards .pcard');
    if (e.detail === 'board') enter('#board .board-row');
    if (e.detail === 'boxes') animate('.pbox-lid', { transform: ['rotateX(100deg)', 'rotateX(48deg)'] }, { duration: .7, delay: stagger(.05), ease: EASE });
  });
}).catch(() => {});

/* ================= FOR ASK MAX (js/chat.js): the shop's own data and actions, one source for both ================= */
export const shop = {
  PIZZAS, BOARD, DEALS, AREAS, HOURS, SIZES, SIZE_NAME, SIZE_SHORT, CRUST, ALLERGENS, ADDITIVES, BASE_CODES, MIN_DELIVERY, ICON, TAGS,
  contact: { phone: '030 123 456 78', tel: '+493012345678', address: 'Wollankstr. 20, 13187 Berlin' },
  byId, eur, esc, sized, separately, shopState, when, fmtH, zipState, areaOf, berlinNow, reduced,
  cartCount, cartSum,
  addPizza: (p, k, withCrust, from) => addToCart(lineItem(p, k, !!withCrust), from),
  addItem: (it, from) => addToCart({ name: it.n, size: it.d, price: it.p }, from),
  useZip: (v) => checkZip(v),
  openBasket: () => openCart(true),
  toMenu,
};
