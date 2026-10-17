// Pizza Max — page logic: menu views, ordering, deals, basket, checkout, 3D hookup, motion.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const eur = (n) => '€' + n.toFixed(2);
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
  trash: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  box: '<svg class="i-box" viewBox="0 0 40 40" aria-hidden="true"><rect class="ib-a" x="4" y="12" width="32" height="22" rx="3"/><path class="ib-b" d="M4 12h32l-4-7H8z"/><text class="ib-c" x="20" y="27" text-anchor="middle">MAX</text></svg>',
};

/* ================= DATA ================= */
const SIZES = ['Standard 26 cm', 'Maxi 32 cm', 'Wumbo 38 cm'];
const SIZE_SHORT = ['26 cm', '32 cm', '38 cm'];
const CRUST = 2.5;
const BASE_CODES = ['A', 'A1'];   // every pizza: 24-hour wheat dough
const PIZZAS = [
  { id: 'marg', name: 'Margherita Deluxe', ing: 'Mozzarella, Gouda, sliced tomatoes, basil pesto', codes: ['G', 'C', 'H', 'H4'], price: [8.5, 12.5, 17.4], tags: ['veg'] },
  { id: 'salami', name: 'Salami Max', ing: 'Double beef salami, cheese, oregano', codes: ['G', '2', '3'], price: [9.0, 13.0, 17.9], tags: ['meat'], sticker: 'Bestseller' },
  { id: 'diavolo', name: 'Diavolo', ing: 'Hot salami, mozzarella, jalapeños, red onion, chilli oil', codes: ['G', '2', '3'], price: [9.5, 13.5, 18.4], tags: ['meat', 'hot'] },
  { id: 'funghi', name: 'Funghi Fresco', ing: 'Mushrooms, garlic, thyme, mozzarella', codes: ['G'], price: [8.9, 12.9, 17.6], tags: ['veg'] },
  { id: 'garden', name: 'Veggie Garden', ing: 'Mozzarella, peppers, olives, mushrooms, tomatoes, rocket', codes: ['G'], price: [9.2, 13.2, 17.9], tags: ['veg'] },
  { id: 'tonno', name: 'Tonno Cipolla', ing: 'Tuna, mozzarella, red onion, capers, olives', codes: ['D', 'G'], price: [9.4, 13.4, 18.2], tags: ['fish'] },
  { id: 'hawaii', name: 'Hawaii', ing: 'Cooked ham, pineapple, extra cheese', codes: ['G', '2', '3'], price: [9.2, 13.2, 17.9], tags: ['meat'] },
  { id: 'supreme', name: 'Max Supreme', ing: 'Salami, ham, mozzarella, peppers, olives, mushrooms, onion, jalapeños', codes: ['G', '2', '3'], price: [10.9, 14.9, 19.9], tags: ['meat', 'hot'] },
];
const byId = (id) => PIZZAS.find((p) => p.id === id);
const ALLERGENS = { A: 'gluten', A1: 'wheat', C: 'egg', D: 'fish', G: 'milk', H: 'tree nuts', H4: 'cashew' };
const ADDITIVES = { 2: 'preservative', 3: 'antioxidant' };
function allergenLine(p) {
  const codes = [...BASE_CODES, ...p.codes];
  const alg = codes.filter((c) => ALLERGENS[c]).map((c) => ALLERGENS[c]);
  const add = codes.filter((c) => ADDITIVES[c]).map((c) => ADDITIVES[c]);
  return `<b>Allergens:</b> ${alg.join(', ')}${add.length ? ` · <b>Contains:</b> ${add.join(', ')}` : ''}`;
}
const STILLS = Object.fromEntries(PIZZAS.map((p) => [p.id, { angle: `assets/pizza/${p.id}-angle.webp`, top: `assets/pizza/${p.id}-top.webp` }]));

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
  { title: 'Solo', items: ['1 Maxi pizza, 32 cm', '1 drink, 0.5 l'], price: 13.9, was: 15.9, pizzas: ['salami'], size: 1, drinks: 1, desserts: 0 },
  { title: 'Duo', items: ['2 Maxi pizzas, 32 cm', '2 drinks', '1 dessert'], price: 29.9, was: 36.6, pizzas: ['marg', 'diavolo'], size: 1, drinks: 2, desserts: 1 },
  { title: 'Party', items: ['3 Wumbo pizzas, 38 cm', '4 drinks', '2 desserts'], price: 59.9, was: 76.0, pizzas: ['supreme', 'garden', 'hawaii'], size: 2, drinks: 4, desserts: 2, featured: true },
];

const ZONE = ['13187', '13189', '13156', '13158', '13086', '13088', '13125', '13127', '13129', '10437', '10439', '10409'];   // example delivery area
const zipState = (v) => (!/^\d{5}$/.test(v) ? 'short' : ZONE.includes(v) ? 'ok' : 'out');

/* ================= OPENING HOURS ================= */
const HOURS = { 0: [12, 23], 1: [11, 23], 2: [11, 23], 3: [11, 23], 4: [11, 23], 5: [11, 25], 6: [11, 25] };
const fmtH = (h) => `${String(h % 24).padStart(2, '0')}:00`;
function shopState(now = new Date()) {
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

/* ================= ORDERING (one control, used in every view) ================= */
const sel = new Map(PIZZAS.map((p) => [p.id, 1]));   // chosen size, Maxi by default
const crust = new Set();                              // pizzas with a cheese-stuffed crust
const priceOf = (p, k, withCrust = crust.has(p.id)) => p.price[k] + (withCrust ? CRUST : 0);
const lineItem = (p, k, withCrust = crust.has(p.id)) => ({
  name: p.name + (withCrust ? ' + cheese-stuffed crust' : ''), size: SIZES[k], price: priceOf(p, k, withCrust), thumb: STILLS[p.id].top,
});
const addLabel = (p, k) => `Add ${p.name}${crust.has(p.id) ? ' with cheese-stuffed crust' : ''}, ${SIZES[k]}, ${eur(priceOf(p, k))}, to basket`;
const crustLabel = (p) => `<label class="crust"><input type="checkbox" data-crust ${crust.has(p.id) ? 'checked' : ''} aria-label="Cheese-stuffed crust for ${p.name}, plus ${eur(CRUST)}"><span class="crust-txt">Cheese-stuffed crust</span> <span class="crust-p">+${eur(CRUST)}</span></label>`;
function orderControls(p) {
  const k = sel.get(p.id);
  return `<div class="order" data-id="${p.id}">
    <div class="seg" role="radiogroup" aria-label="Size, ${p.name}">
      ${SIZE_SHORT.map((s, j) => `<button type="button" role="radio" aria-checked="${j === k}" tabindex="${j === k ? 0 : -1}" data-size="${j}"><b>${s}</b><span class="num">${eur(priceOf(p, j))}</span></button>`).join('')}
    </div>
    ${crustLabel(p)}
    <button type="button" class="btn btn-red btn-block add-btn" data-add aria-label="${addLabel(p, k)}"><span class="add-label">Add to basket</span> · <span class="num">${eur(priceOf(p, k))}</span></button>
  </div>`;
}
// keep every copy of a pizza's controls in sync across views
function refreshOrder(id) {
  const p = byId(id), k = sel.get(id);
  $$(`.order[data-id="${id}"]`).forEach((o) => {
    $$('.seg button', o).forEach((b, j) => {
      b.setAttribute('aria-checked', j === k); b.tabIndex = j === k ? 0 : -1;
      $('span', b).textContent = eur(priceOf(p, j));
    });
    const c = $('[data-crust]', o); if (c) c.checked = crust.has(id);
    const add = $('[data-add]', o);
    if (add) {
      $('.num', add).textContent = eur(priceOf(p, k));
      add.setAttribute('aria-label', addLabel(p, k));
      add.classList.remove('tick'); void add.offsetWidth; add.classList.add('tick');
    }
    $$('[data-k]', o).forEach((b) => {
      const j = +b.dataset.k;
      b.querySelector('.lbl').textContent = `${SIZE_SHORT[j]} · ${eur(priceOf(p, j))}`;
      b.setAttribute('aria-label', addLabel(p, j));
    });
  });
  $$(`.pbox[data-id="${id}"] .pbox-base img`).forEach((img) => img.style.setProperty('--k', [.88, .96, 1.04][k]));
  if (id === 'garden') heroLabel();
}
// the hero's button adds the Veggie Garden shown on the board, at Maxi
function heroLabel() {
  const p = byId('garden'), b = $('#heroAdd');
  $('.num', b).textContent = eur(priceOf(p, 1));
  b.setAttribute('aria-label', addLabel(p, 1));
}
// brief "added" confirmation on whichever button was used (its width is held so neighbours don't jump)
function flashAdded(btn) {
  if (!btn.classList.contains('is-added')) btn.style.minWidth = `${btn.offsetWidth}px`;
  btn.classList.add('is-added');
  const label = $('.add-label', btn) || $('.lbl', btn);
  if (label) { label.dataset.text ??= label.textContent; label.textContent = 'Added ✓'; }
  else if (btn.classList.contains('add-mini')) { btn.dataset.icon ??= btn.innerHTML; btn.innerHTML = ICON.check; }
  clearTimeout(btn._t);
  btn._t = setTimeout(() => {
    btn.classList.remove('is-added');
    btn.style.minWidth = '';
    if (label) label.textContent = label.dataset.text; else if (btn.dataset.icon) btn.innerHTML = btn.dataset.icon;
    if (label) delete label.dataset.text;
    if (btn.dataset.icon) delete btn.dataset.icon;
  }, 1400);
}
document.addEventListener('click', (e) => {
  const o = e.target.closest('.order');
  if (!o) return;
  const p = byId(o.dataset.id);
  const sz = e.target.closest('.seg button');
  if (sz) { sel.set(p.id, +sz.dataset.size); refreshOrder(p.id); return; }
  const add = e.target.closest('[data-add]');
  if (add) { addToCart(lineItem(p, sel.get(p.id)), add); flashAdded(add); return; }
  const k = e.target.closest('[data-k]');
  if (k) {
    addToCart(lineItem(p, +k.dataset.k), k);
    flashAdded(k);
    // the list's size buttons also refresh their own label afterwards
    setTimeout(() => refreshOrder(p.id), 1450);
  }
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

const tagsHtml = (p) => `<div class="tags">
  ${p.sticker ? `<span class="sticker">${p.sticker}</span>` : ''}
  ${p.tags.includes('veg') ? '<span class="pill pill-veg">Vegetarian</span>' : ''}
  ${p.tags.includes('hot') ? '<span class="pill pill-hot">Spicy</span>' : ''}
  ${p.tags.includes('fish') ? '<span class="pill pill-fish">Fish</span>' : ''}
</div>`;
const productInfo = (p) => `${tagsHtml(p)}
  <h3 class="p-name">${p.name}</h3>
  <p class="p-desc">${p.ing}</p>
  <p class="p-alg">${allergenLine(p)}</p>`;

/* ================= BASKET ================= */
const MIN_DELIVERY = 15;
const cart = new Map();   // key -> { name, size, price, qty, thumb }
let mode = 'delivery', pay = 'cash', deliverZip = '', removed = null;
const cartCount = () => [...cart.values()].reduce((a, c) => a + c.qty, 0);
const cartSum = () => [...cart.values()].reduce((a, c) => a + c.qty * c.price, 0);

function addToCart(item, from) {
  const key = `${item.name}|${item.size}|${item.price}`;
  const it = cart.get(key) || { ...item, qty: 0 };
  it.qty += 1;
  cart.set(key, it);
  removed = null;
  renderCart();
  flyToCart(from, item.thumb);
  const sum = cartSum();
  const gap = mode === 'delivery' && sum < MIN_DELIVERY ? ` · ${eur(MIN_DELIVERY - sum)} more for delivery` : '';
  if (!$('#cart').hidden) return announce(`${item.name} added. Total ${eur(sum)}.`);
  toast(`${item.name} added${gap}`, isShown($('#orderBar')) ? null : { label: 'View basket', fn: () => openCart(true) });
}
function setMode(m) {
  mode = m;
  $$('.mode button').forEach((x) => { const on = x.dataset.mode === m; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
  $$('.deliv-only').forEach((f) => (f.hidden = m !== 'delivery'));
  $('#payCard').textContent = m === 'delivery' ? 'Card at the door' : 'Card at pickup';
  renderCart();
}
// the cheapest single item that closes the delivery gap (or the biggest one if none does)
function upsell(gap) {
  const pool = [...BOARD.flatMap((c) => c.items.map((it) => ({ name: it.n, size: it.d, price: it.p }))),
    ...PIZZAS.map((p) => lineItem(p, 0, false))].filter((x) => !cart.has(`${x.name}|${x.size}|${x.price}`));
  const closing = pool.filter((x) => x.price >= gap).sort((a, b) => a.price - b.price);
  return closing[0] || pool.sort((a, b) => b.price - a.price)[0];
}
let upsellItem = null;
function renderCart() {
  const n = cartCount(), sum = cartSum(), shop = shopState();
  $('#cartCount').textContent = n;
  $('#cartBtn').hidden = !n;
  const rows = [...cart.entries()].map(([k, c]) => `<li data-key="${encodeURIComponent(k)}">
      <span class="ci-name">${c.name}<small>${c.size}</small></span>
      <span class="qty" role="group" aria-label="Quantity, ${c.name}">
        <button type="button" data-dec aria-label="${c.qty > 1 ? 'One less' : 'Remove'}: ${c.name}">${c.qty > 1 ? ICON.minus : ICON.trash}</button>
        <b>${c.qty}</b>
        <button type="button" data-inc aria-label="One more: ${c.name}">${ICON.plus}</button>
      </span>
      <b class="ci-price num">${eur(c.qty * c.price)}</b>
    </li>`);
  if (removed) rows.splice(Math.min(removed.idx, rows.length), 0, `<li class="removed"><span>${removed.item.name} removed.</span><button type="button" class="mini-btn" data-undo>Undo</button></li>`);
  $('#cartList').innerHTML = rows.length ? rows.join('') : '<li class="cart-empty">Your basket is empty. Pick something tasty!</li>';
  $('#cartTotal').textContent = eur(sum);
  $('#formTotal').textContent = eur(sum);
  const short = mode === 'delivery' && sum > 0 && sum < MIN_DELIVERY;
  const min = $('#cartMin');
  min.classList.toggle('is-short', short);
  if (mode === 'pickup') min.textContent = 'Pickup at Wollankstr. 20, ready in about 20 minutes.';
  else if (!sum) min.textContent = `Delivery from ${eur(MIN_DELIVERY)}, always free.`;
  else if (short) {
    upsellItem = upsell(MIN_DELIVERY - sum);
    min.innerHTML = `Add ${eur(MIN_DELIVERY - sum)} more for delivery (orders over ${eur(MIN_DELIVERY)}).
      <span class="acts"><button type="button" class="mini-btn" data-act="pickup">Switch to pickup</button>${upsellItem ? `<button type="button" class="mini-btn" data-act="upsell">Add ${upsellItem.name} · ${eur(upsellItem.price)}</button>` : ''}</span>`;
  } else min.textContent = `Free delivery${deliverZip ? ` to ${deliverZip}` : ''}, in about 30 minutes.`;
  // delivery needs a postcode we serve before the details step, so nobody fills a form for nothing
  const needZip = mode === 'delivery' && n && !short && zipState(deliverZip) !== 'ok';
  const co = $('#checkout');
  co.disabled = !n || short || needZip;
  co.textContent = !n ? 'Basket is empty' : short ? 'Below delivery minimum' : needZip ? 'Enter your postcode to continue' : `Continue · ${eur(sum)}`;
  $('#formSumTitle').textContent = `Your order · ${n} item${n === 1 ? '' : 's'} · ${eur(sum)}`;
  $('#formList').innerHTML = [...cart.values()].map((c) => `<li><span>${c.qty}× ${c.name}</span><span class="num">${eur(c.qty * c.price)}</span></li>`).join('');
  $('#placeOrder').textContent = shop.open ? `Place order · ${eur(sum)}` : `Pre-order for ${shop.nextLabel} · ${eur(sum)}`;
  $('#orderBar').hidden = !n;
  document.body.classList.toggle('has-order', n > 0);
  $('#obCount').textContent = n;
  $('#obTotal').textContent = eur(sum);
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
function cartZipMsg() {
  const v = $('#cartZip').value, st = zipState(v), msg = $('#cartZipMsg'), inp = $('#cartZip');
  st === 'out' ? inp.setAttribute('aria-invalid', 'true') : inp.removeAttribute('aria-invalid');
  msg.className = 'cart-zip-msg' + (st === 'ok' ? ' ok' : st === 'out' ? ' no' : '');
  msg.innerHTML = st === 'ok' ? `We deliver to ${v}, in about 30 minutes.`
    : st === 'out' ? `We don't deliver to ${v} yet. <button type="button" class="mini-btn" data-act="pickup">Switch to pickup</button>` : '';
}
$('#cartZip').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
  deliverZip = zipState(e.target.value) === 'ok' ? e.target.value : '';
  cartZipMsg();
  renderCart();
});
$('#cartZipMsg').addEventListener('click', (e) => {
  if (!e.target.closest('[data-act="pickup"]')) return;
  setMode('pickup');
  $('.mode [data-mode="pickup"]').focus();
});
$$('.pay button').forEach((b) => b.addEventListener('click', () => {
  pay = b.dataset.pay;
  $$('.pay button').forEach((x) => { const on = x === b; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
}));

let lastFocus = null;
function showStep(step) {
  $('#cartMain').hidden = step !== 'basket';
  $('#cartForm').hidden = step !== 'form';
  $('#cartDone').hidden = step !== 'done';
  $('#cartTitle').textContent = { basket: 'Your basket', form: 'Your details', done: 'Order received' }[step];
}
const behindCart = () => [...document.body.children].filter((n) => !['cart', 'scrim', 'cartBtn', 'srLive'].includes(n.id) && n.tagName !== 'SCRIPT');
function openCart(open) {
  const el = $('#cart');
  if (open === !el.hidden) return;
  $('#toast').classList.remove('show');
  el.hidden = !open;
  $('#scrim').hidden = !open;
  behindCart().forEach((n) => (n.inert = open));          // a modal: the page behind can't be reached
  $('#cartBtn').setAttribute('aria-expanded', open);
  $('#cartBtn .sr-only').textContent = open ? 'Close basket' : 'Open basket';
  if (open) {
    lastFocus = document.activeElement;
    showStep('basket');
    $('#cartZip').value = deliverZip;
    cartZipMsg();
    $('#cartClose').focus();
  } else {
    removed = null; renderCart();
    // back to where you were, or the nearest visible thing (fixed elements have no offsetParent, so check boxes)
    const back = [lastFocus, cartCount() && $('#orderBar'), cartCount() && $('#cartBtn')].find((x) => x && isShown(x));
    back ? back.focus() : focusHeading($('#menu-title'));
  }
}
$('#cartBtn').addEventListener('click', () => openCart($('#cart').hidden));
$('#orderBar').addEventListener('click', () => openCart(true));
$('#cartClose').addEventListener('click', () => openCart(false));
$('#scrim').addEventListener('click', () => openCart(false));
$('#doneClose').addEventListener('click', () => openCart(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#cart').hidden) return openCart(false);
    if ($('#mainnav').classList.contains('open')) return closeNav(true);
  }
  if (e.key !== 'Tab') return;
  // keep focus inside whichever overlay is open
  let f = null;
  if (!$('#cart').hidden) f = $$('#cart button:not([disabled]), #cart input, #cart select, #cart summary').filter((x) => isShown(x) && x.tabIndex >= 0);
  else if ($('#mainnav').classList.contains('open')) f = [toggle, ...$$('#mainnav a')];
  if (!f || !f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
});
$('#checkout').addEventListener('click', () => {
  if (!cartCount()) return;
  showStep('form');
  setMode(mode);
  fillWhen();
  $('#fZipNote').innerHTML = `Delivering to postcode ${deliverZip}. <button type="button" class="link-btn" data-zip-change>Change</button>`;
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
  const shop = shopState(), lead = mode === 'delivery' ? 30 : 20;
  const start = shop.open ? new Date() : new Date(shop.next);
  const t = new Date(start.getTime() + (lead + 30) * 60000);
  t.setMinutes(t.getMinutes() <= 30 ? 30 : 60, 0, 0);
  const hm = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const opts = [`<option value="asap">${shop.open ? `As soon as possible (about ${lead} min)` : `As soon as we open (${shop.nextLabel})`}</option>`];
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
  if (mode === 'delivery' && zipState(deliverZip) !== 'ok') { showStep('basket'); return $('#cartZip').focus(); }
  const ok = Object.keys(CHECKS).map((id) => fieldError(id, CHECKS[id]($('#' + id).value)));
  if (ok.includes(false)) return $('#cartForm [aria-invalid="true"]').focus();
  const street = $('#fStreet').value.trim(), note = $('#fNote').value.trim(), when = $('#fWhen').value;
  const shop = shopState(), lead = mode === 'delivery' ? 30 : 20;
  const asap = when === 'asap', start = shop.open ? new Date() : shop.next;
  const eta = asap ? new Date(start.getTime() + lead * 60000) : new Date(+when);
  const hhmm = eta.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const where = mode === 'delivery' ? `Arriving around ${hhmm}.` : `Ready for pickup around ${hhmm} at Wollankstr. 20.`;
  // one story: the line, the tracker and the time all say the same thing
  $('#doneEta').textContent = !shop.open ? `Pre-ordered for ${shop.nextLabel}. ${where}` : asap ? `It's in the oven. ${where}` : `Scheduled. ${where}`;
  $('#doneTo').textContent = (mode === 'delivery' ? `To ${street}, ${deliverZip} · paying ${pay === 'cash' ? 'cash' : 'by card'} at the door` : `Paying ${pay === 'cash' ? 'cash' : 'by card'} at pickup`) + (note ? ` · Note: ${note}` : '');
  $('#doneNow').textContent = shop.open && asap ? 'In the oven' : 'Scheduled';
  $('#doneLast').textContent = mode === 'delivery' ? 'On its way' : 'Ready to collect';
  $('#doneList').innerHTML = [...cart.values()].map((c) => `<li><span>${c.qty}× ${c.name}</span><span class="num">${eur(c.qty * c.price)}</span></li>`).join('')
    + `<li class="tot"><span>Total</span><span class="num">${eur(cartSum())}</span></li>`;
  cart.clear(); removed = null; renderCart();
  showStep('done');
  const done = $('#cartDone');
  done.classList.remove('play'); void done.offsetWidth; done.classList.add('play');
  $('#cartTitle').focus();
});
renderCart();

/* ================= FILTER ================= */
let filter = 'all';
const passes = (tags) => filter === 'all' || tags.includes(filter) || (filter === 'meat' && tags.includes('fish'));
const shown = () => PIZZAS.filter((p) => passes(p.tags));
const shownItems = (c) => c.items.map((it, i) => ({ it, i })).filter(({ it }) => passes(it.t));

/* ================= VIEW 1: CARDS ================= */
function renderCards() {
  $('#panels').innerHTML = shown().map((p) => `
    <article class="card" data-id="${p.id}">
      <div class="card-art"><img src="${STILLS[p.id].angle}" alt="" width="760" height="760" loading="lazy" decoding="async"></div>
      ${productInfo(p)}
      ${orderControls(p)}
    </article>`).join('') + `
    <article class="card card-more">
      <h3>More from our menu</h3>
      <p>Burgers, pasta, salads, kids' dishes, desserts and drinks.</p>
      <div class="more-links">${BOARD.filter((c) => shownItems(c).length).map((c) => `<button type="button" class="mini-btn" data-goto="${c.cat}">${c.title}</button>`).join('')}</div>
      <button type="button" class="link-btn" data-goto-view="wheel">Can't decide? Spin the pizza wheel ${ICON.arrow}</button>
    </article>`;
}

/* ================= VIEW 2: PIZZA WHEEL ================= */
let wheelSel = 0;
const WHEEL_IMG = { x: 10.5, s: 199 };   // the top-view render's crust lands on the wheel's r=90 rim
function renderWheel() {
  const list = shown(), n = list.length;
  wheelSel = Math.min(wheelSel, n - 1);
  let defs = '<defs>', body = '<circle class="wheel-rim" cx="110" cy="110" r="97"/>';
  list.forEach((p, i) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2, am = (a0 + a1) / 2;
    const pt = (a, r) => [(110 + Math.cos(a) * r).toFixed(2), (110 + Math.sin(a) * r).toFixed(2)];
    const wedge = n === 1 ? 'M110 20 A90 90 0 1 1 109.99 20Z' : `M110 110 L${pt(a0, 90).join(' ')} A90 90 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${pt(a1, 90).join(' ')}Z`;
    const [nx, ny] = pt(am, 76);
    defs += `<clipPath id="wc${i}"><path d="${wedge}"/></clipPath>`;
    body += `<g class="wedge${i === wheelSel ? ' is-on' : ''}" data-i="${i}" tabindex="${i === wheelSel ? 0 : -1}" role="radio" aria-checked="${i === wheelSel}" aria-label="${p.name}"
      style="--dx:${n > 1 ? (Math.cos(am) * 9).toFixed(1) : 0}px;--dy:${n > 1 ? (Math.sin(am) * 9).toFixed(1) : 0}px">
      <g clip-path="url(#wc${i})"><image href="${STILLS[p.id].top}" x="${WHEEL_IMG.x}" y="${WHEEL_IMG.x}" width="${WHEEL_IMG.s}" height="${WHEEL_IMG.s}"/></g>
      <path class="wedge-edge" d="${wedge}"/>
      <circle class="wedge-dot" cx="${nx}" cy="${ny}" r="8"/>
      <text class="wedge-num" x="${nx}" y="${(+ny + 3.2).toFixed(1)}" text-anchor="middle">${i + 1}</text>
    </g>`;
  });
  $('#wheel').innerHTML = defs + '</defs>' + body;
  $('#wheel').setAttribute('role', 'radiogroup');
  $('#wheelLegend').innerHTML = list.map((p, i) => `<li data-i="${i}"${i === wheelSel ? ' class="is-on"' : ''}><b>${i + 1}</b>${p.name}</li>`).join('');
  wheelName(null);
  renderWheelDetail();
}
function renderWheelDetail() {
  const list = shown(), p = list[wheelSel];
  $('#wheelDetail').innerHTML = `
    <span class="kicker">Slice ${wheelSel + 1} of ${list.length}</span>
    ${productInfo(p)}
    ${orderControls(p)}
    <div class="wheel-nav">
      <button type="button" class="wn" data-step="-1" aria-label="Previous pizza">${ICON.arrow}</button>
      <span>Browse the slices</span>
      <button type="button" class="wn" data-step="1" aria-label="Next pizza">${ICON.arrow}</button>
    </div>`;
}
function pickWheel(i, scroll) {
  const list = shown();
  wheelSel = (i + list.length) % list.length;
  $$('#wheel .wedge').forEach((w) => { const on = +w.dataset.i === wheelSel; w.classList.toggle('is-on', on); w.setAttribute('aria-checked', on); w.setAttribute('tabindex', on ? 0 : -1); });
  $$('#wheelLegend li').forEach((li) => li.classList.toggle('is-on', +li.dataset.i === wheelSel));
  renderWheelDetail();
  wheelName(null);
  $('#wheelLive').textContent = `Slice ${wheelSel + 1} of ${list.length}: ${list[wheelSel].name}`;
  if (scroll && phone()) $('#wheelDetail').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
// the hub always names the chosen slice; hover or focus previews another
function wheelName(i) {
  const list = shown(), p = list[i ?? wheelSel];
  if (!p) return;
  const el = $('#wheelName');
  el.textContent = p.name;
  el.classList.toggle('is-preview', i != null && i !== wheelSel);
}
$('#wheel').addEventListener('click', (e) => { const w = e.target.closest('.wedge'); if (w) pickWheel(+w.dataset.i, true); });
$('#wheel').addEventListener('pointerover', (e) => { const w = e.target.closest('.wedge'); wheelName(w ? +w.dataset.i : null); });
$('#wheel').addEventListener('pointerleave', () => wheelName(null));
$('#wheel').addEventListener('focusin', (e) => { const w = e.target.closest('.wedge'); if (w) wheelName(+w.dataset.i); });
$('#wheel').addEventListener('focusout', () => wheelName(null));
$('#wheel').addEventListener('keydown', (e) => {
  const w = e.target.closest('.wedge');
  if (!w) return;
  const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (d) { e.preventDefault(); pickWheel(+w.dataset.i + d); $(`#wheel .wedge[data-i="${wheelSel}"]`).focus(); }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickWheel(+w.dataset.i, true); }
});
$('#wheelLegend').addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) pickWheel(+li.dataset.i, true); });
// spin: two turns while the hub flicks through the names, then it stops on a random pizza
let spinning = false;
function spinWheel() {
  const list = shown();
  if (spinning || list.length < 2) return;
  let i;
  do { i = Math.floor(Math.random() * list.length); } while (i === wheelSel);
  if (reduced) return pickWheel(i);
  spinning = true;
  const name = $('#wheelName');
  let k = wheelSel;
  const flick = setInterval(() => { name.textContent = list[++k % list.length].name; }, 90);
  $('#wheel').animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(720deg)' }], { duration: 1500, easing: 'cubic-bezier(.2, .75, .25, 1)' });
  setTimeout(() => {
    clearInterval(flick);
    spinning = false;
    pickWheel(i, true);
  }, 1500);
}
$('#wheelSpin').addEventListener('click', spinWheel);
$('#wheelDetail').addEventListener('click', (e) => {
  const step = e.target.closest('[data-step]');
  if (step) pickWheel(wheelSel + +step.dataset.step);
});

/* ================= VIEW 3: FULL LIST ================= */
function renderBoard() {
  const pz = shown();
  $('#board').innerHTML = (pz.length ? `<section class="board-cat board-pizza" id="board-pizza" aria-label="Pizza">
      <h3>Pizza</h3>
      <ul>${pz.map((p) => `<li><span class="n">${p.name}</span><span class="leader"></span><span class="p num">from ${eur(p.price[0])}</span>
        <span class="d">${p.ing}</span>
        <span class="d alg">${allergenLine(p)}</span>
        <span class="order order-list" data-id="${p.id}">
          ${crustLabel(p)}
          <span class="size-adds">${SIZE_SHORT.map((s, k) => `<button type="button" data-k="${k}" aria-label="${addLabel(p, k)}">${ICON.plus}<span class="lbl">${s} · ${eur(priceOf(p, k))}</span></button>`).join('')}</span>
        </span></li>`).join('')}</ul>
    </section>` : '') + BOARD.filter((c) => shownItems(c).length).map((c) => `
    <section class="board-cat" id="board-${c.cat}" aria-label="${c.title}">
      <h3>${c.title}</h3>
      <p class="cat-alg">Allergens on request: just ask when you order.</p>
      <ul>${shownItems(c).map(({ it, i }) => `<li><span class="n">${it.n}</span><span class="leader"></span><span class="p num">${eur(it.p)}</span>
        <button type="button" class="add-mini" data-c="${c.cat}" data-i="${i}" aria-label="Add ${it.n}, ${eur(it.p)}, to basket">${ICON.plus}</button><span class="d">${it.d}</span></li>`).join('')}</ul>
    </section>`).join('');
}
$('#board').addEventListener('click', (e) => {
  const b = e.target.closest('.add-mini');
  if (!b) return;
  const it = catItems(b.dataset.c)[+b.dataset.i];
  addToCart({ name: it.n, size: it.d, price: it.p }, b);
  flashAdded(b);
});

/* ================= VIEW 4: BOXES ================= */
function renderBoxes() {
  $('#boxes').innerHTML = shown().map((p) => `
    <article class="pbox" data-id="${p.id}">
      <div class="pbox-stage" aria-hidden="true">
        <div class="pbox-lid"><span class="lid-logo"><small>Pizza</small>MAX</span></div>
        <div class="pbox-base"><img src="${STILLS[p.id].top}" alt="" width="760" height="760" decoding="async" style="--k:${[.88, .96, 1.04][sel.get(p.id)]}"></div>
      </div>
      ${productInfo(p)}
      ${orderControls(p)}
    </article>`).join('');
}

/* ================= VIEW SWITCH + FILTER ================= */
const tabs = $$('.menu-switch [role="tab"]');
let motionApi = null;   // set once Motion loads; gives re-rendered items a short entrance
function enter(selector) {
  if (!motionApi || reduced) return;
  motionApi.animate($$(selector), { opacity: [0, 1], y: [12, 0] }, { duration: .35, delay: motionApi.stagger(.03), ease: [0.16, 1, 0.3, 1] });
}
let view = 'panels';
function showView(name, focus) {
  view = name;
  tabs.forEach((t) => {
    const on = t.dataset.view === name;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
    $('#' + t.getAttribute('aria-controls')).hidden = !on;
  });
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
function renderAll() { renderCards(); renderWheel(); renderBoard(); renderBoxes(); }
$('#filter').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  filter = b.dataset.filter;
  $$('#filter button').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
  wheelSel = 0;
  renderAll();
  enter({ panels: '#panels .card', boxes: '#boxes .pbox', board: '#board .board-cat', wheel: '#wheelDetail' }[view]);
  const nP = shown().length, nO = BOARD.reduce((a, c) => a + shownItems(c).length, 0);
  announce(`${b.textContent}: ${nP} pizza${nP === 1 ? '' : 's'} and ${nO} other dish${nO === 1 ? '' : 'es'}.`);
});
function gotoCategory(cat) {
  showView('board');
  // a filter that hides this category is lifted first, so a category link always lands
  if (!$(`#board-${cat}`)) $('#filter [data-filter="all"]').click();
  const sec = $(`#board-${cat}`);
  if (!sec) return;
  setTimeout(() => {   // after the view switch has laid out (a timer, not a frame: frames pause in background tabs)
    sec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    focusHeading($('h3', sec));
    $$('li', sec).forEach((x) => { x.classList.remove('is-flash'); void x.offsetWidth; x.classList.add('is-flash'); });
  });
}
$('#panels').addEventListener('click', (e) => {
  const g = e.target.closest('[data-goto]');
  if (g) return gotoCategory(g.dataset.goto);
  const v = e.target.closest('[data-goto-view]');
  if (v) {
    showView(v.dataset.gotoView);
    $('#menu-title').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    focusHeading($('#menu-title'));
    if (v.dataset.gotoView === 'wheel') setTimeout(spinWheel, reduced ? 0 : 500);
  }
});
renderAll();
// box and wheel images load in the background so switching views never shows empty boxes
const warm = () => PIZZAS.forEach((p) => { const i = new Image(); i.src = STILLS[p.id].top; });
'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 3000 }) : setTimeout(warm, 2000);

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
  if (cat === 'pizza' && view === 'board') showView('panels');
  // the link may be hidden now (phone menu closed): focus follows the jump instead of staying behind
  const t = href && href.startsWith('#') && $(href);
  if (t) setTimeout(() => focusHeading(t.matches('h1, h2, h3') ? t : $('h2, h3', t)), 0);
}));
const spyLinks = $$('#mainnav [data-spy]');
const spy = (id) => spyLinks.forEach((l) => (l.dataset.spy === id ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
const spyIO = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) spy(en.target.dataset.spyId); }), { rootMargin: '-45% 0px -50% 0px' });
[['.hero', 'none'], ['#aktion', 'aktion'], ['#menu', 'menu'], ['.ofen', 'none']].forEach(([s, id]) => { const el = $(s); el.dataset.spyId = id; spyIO.observe(el); });

/* ================= DEALS (choose your pizzas, drinks and desserts) ================= */
const DRINKS = catItems('getraenke').map((d) => d.n), DESSERTS = catItems('desserts').map((d) => d.n);
const dealPick = DEALS.map((d) => ({ pizzas: [...d.pizzas], drinks: { [DRINKS[0]]: d.drinks }, desserts: d.desserts ? { [DESSERTS[0]]: d.desserts } : {} }));
const counter = (i, kind, names, total) => `<fieldset class="pick"><legend>${kind === 'drinks' ? 'Drinks' : 'Desserts'} <span data-left="${kind}">${total} of ${total} chosen</span></legend>
  ${names.map((n) => `<div class="pick-row"><span>${n}</span><span class="qty" role="group" aria-label="${n}">
    <button type="button" data-cnt="${kind}" data-name="${n}" data-d="-1" aria-label="One less ${n}">${ICON.minus}</button>
    <b data-val="${kind}:${n}">${dealPick[i][kind][n] || 0}</b>
    <button type="button" data-cnt="${kind}" data-name="${n}" data-d="1" aria-label="One more ${n}">${ICON.plus}</button></span></div>`).join('')}
</fieldset>`;
$('#strip').innerHTML = DEALS.map((d, i) => {
  const save = Math.round((1 - d.price / d.was) * 100);
  return `<article class="deal${d.featured ? ' deal-featured' : ''}" data-deal="${i}">
    ${d.featured ? '<span class="deal-flag">Best value</span>' : ''}
    <span class="save" aria-label="Save ${save} percent">−${save}%</span>
    <div class="deal-art deal-art-${d.pizzas.length}">${d.pizzas.map((id) => `<img src="${STILLS[id].top}" alt="" width="760" height="760" loading="lazy" decoding="async">`).join('')}</div>
    <h3>${d.title}</h3>
    <ul>${d.items.map((x) => `<li>${x}</li>`).join('')}</ul>
    <div class="deal-choose" id="dealChoose${i}" hidden>
      ${d.pizzas.map((_, j) => `<label class="pick-pizza">Pizza ${j + 1} <span class="sr-only">of ${d.pizzas.length}</span>
        <select data-slot="${j}">${PIZZAS.map((p) => `<option value="${p.id}"${p.id === d.pizzas[j] ? ' selected' : ''}>${p.name}</option>`).join('')}</select></label>`).join('')}
      ${counter(i, 'drinks', DRINKS, d.drinks)}
      ${d.desserts ? counter(i, 'desserts', DESSERTS, d.desserts) : ''}
      <button type="button" class="btn btn-red btn-block" data-deal-add><span class="add-label">Add ${d.title} deal</span> · <span class="num">${eur(d.price)}</span></button>
    </div>
    <div class="deal-row">
      <span class="deal-price num">${eur(d.price)}<s>${eur(d.was)}</s></span>
      <button type="button" class="btn btn-red" data-deal-open aria-expanded="false" aria-controls="dealChoose${i}">Choose &amp; add</button>
    </div>
  </article>`;
}).join('');
const used = (o) => Object.values(o).reduce((a, b) => a + b, 0);
// counters say how many are left, "+" switches off once the deal's quota is reached, "-" at zero
function syncCounts(card) {
  const i = +card.dataset.deal, d = DEALS[i], pick = dealPick[i];
  ['drinks', 'desserts'].filter((k) => d[k]).forEach((kind) => {
    const n = used(pick[kind]), left = d[kind] - n;
    $(`[data-left="${kind}"]`, card).textContent = left ? `${n} of ${d[kind]} chosen, ${left} left` : `${n} of ${d[kind]} chosen`;
    $$(`[data-cnt="${kind}"]`, card).forEach((b) => {
      const v = pick[kind][b.dataset.name] || 0;
      b.disabled = +b.dataset.d > 0 ? left <= 0 : v <= 0;
      $(`[data-val="${kind}:${b.dataset.name}"]`, card).textContent = v;
    });
  });
  $('[data-deal-add]', card).disabled = ['drinks', 'desserts'].some((k) => d[k] && used(pick[k]) !== d[k]);
}
$('#strip').addEventListener('change', (e) => {
  const s = e.target.closest('[data-slot]');
  if (!s) return;
  const card = s.closest('.deal'), i = +card.dataset.deal;
  dealPick[i].pizzas[+s.dataset.slot] = s.value;
  $$('.deal-art img', card)[+s.dataset.slot].src = STILLS[s.value].top;
});
$('#strip').addEventListener('click', (e) => {
  const card = e.target.closest('.deal');
  if (!card) return;
  const i = +card.dataset.deal, d = DEALS[i], pick = dealPick[i];
  const open = e.target.closest('[data-deal-open]');
  if (open) {
    const panel = $('.deal-choose', card), show = panel.hidden;
    panel.hidden = !show;
    open.setAttribute('aria-expanded', show);
    open.textContent = show ? 'Close' : 'Choose & add';
    open.className = `btn ${show ? 'btn-ghost' : 'btn-red'}`;
    if (show) { syncCounts(card); $('select', panel).focus(); }
    return;
  }
  const c = e.target.closest('[data-cnt]');
  if (c) {
    const kind = c.dataset.cnt, cur = pick[kind][c.dataset.name] || 0, next = cur + +c.dataset.d;
    if (next < 0 || (+c.dataset.d > 0 && used(pick[kind]) >= d[kind])) return;
    pick[kind][c.dataset.name] = next;
    syncCounts(card);
    if (c.disabled) $(`[data-cnt="${kind}"][data-name="${c.dataset.name}"][data-d="${-c.dataset.d}"]`, card)?.focus();
    const n = used(pick[kind]);
    announce(`${c.dataset.name}: ${next}. ${kind === 'drinks' ? 'Drinks' : 'Desserts'}: ${n} of ${d[kind]} chosen.`);
    return;
  }
  const add = e.target.closest('[data-deal-add]');
  if (add) {
    const list = (o) => Object.entries(o).filter(([, n]) => n).map(([nm, n]) => `${n}× ${nm}`).join(', ');
    const desc = [pick.pizzas.map((id) => byId(id).name).join(', ') + ` (${SIZE_SHORT[d.size]})`, list(pick.drinks), list(pick.desserts)].filter(Boolean).join(' · ');
    addToCart({ name: `${d.title} deal`, size: desc, price: d.price, thumb: STILLS[pick.pizzas[0]].top }, add);
    flashAdded(add);
  }
});

/* ================= 3D PIZZA ================= */
const stage = $('#pizza3d');
stage.classList.add('is-loading');
let pizza = null;
// with the open-the-box intro running, the pizza waits and takes over when the box's pizza lands on it
const introOn = document.documentElement.classList.contains('intro-on');
import('./pizza3d.js').then(({ createPizza }) => {
  pizza = createPizza(stage, { autoIntro: !introOn });
  if (introOn) (window.pmIntroDone || Promise.resolve()).then(() => pizza.intro(true));
  stage.addEventListener('slice', (e) => toast(e.detail === 'out' ? 'Slice pulled out. Tap it again to put it back.' : 'Slice put back'));
}).catch((err) => {
  console.error(err);
  stage.classList.remove('is-loading');
  stage.innerHTML = `<img src="${STILLS.garden.angle}" alt="" style="width:86%;margin:4% auto">`;
});
$('#pullSlice').addEventListener('click', () => {
  if (!pizza) return;
  const r = pizza.grabRandom();
  toast(r === 'out' ? 'Slice pulled out. Pull another, or drag the pizza to turn it.' : 'Slice put back');
});
$('#heroAdd').addEventListener('click', (e) => { addToCart(lineItem(byId('garden'), 1), e.currentTarget); flashAdded(e.currentTarget); });
heroLabel();

/* ================= OPEN NOW ================= */
(function openStatus() {
  const s = shopState(), d = new Date().getDay();
  const text = s.open ? `Open now · until ${s.until}` : `Closed · opens ${s.nextLabel}`;
  const el = $('#openStatus');
  el.classList.add(s.open ? 'is-open' : 'is-closed');
  $('span', el).textContent = text;
  $('#openFoot').textContent = text;
  const row = { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 1 }[d];
  $$('.hours div')[row]?.classList.add('is-today');
})();

/* ================= DELIVERY CHECK (contact section) ================= */
$('#zipForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const inp = $('#zip'), msg = $('#zipMsg'), v = inp.value.trim();
  msg.className = 'zip-msg';
  if (!/^\d{5}$/.test(v)) {
    inp.setAttribute('aria-invalid', 'true');
    msg.classList.add('no');
    msg.textContent = 'Please enter a five-digit postcode, e.g. 13187.';
    inp.focus();
    return;
  }
  inp.removeAttribute('aria-invalid');
  const yes = ZONE.includes(v);
  if (yes) deliverZip = v;
  msg.classList.add(yes ? 'ok' : 'no');
  msg.innerHTML = yes
    ? `<span>Yes! We deliver to ${v} in about 30 minutes, free from ${eur(MIN_DELIVERY)}.</span><button type="button" class="mini-btn" data-zip="delivery">Start your order</button>`
    : `<span>${v} is outside our delivery area. You can pick up at Wollankstr. 20 while we're open.</span><button type="button" class="mini-btn" data-zip="pickup">Order for pickup</button>`;
  renderCart();
});
$('#zipMsg').addEventListener('click', (e) => {
  const b = e.target.closest('[data-zip]');
  if (!b) return;
  setMode(b.dataset.zip);
  $('#menu').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
});
$('#zip').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5); e.target.removeAttribute('aria-invalid'); });

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
  dot.innerHTML = thumb ? `<img src="${thumb}" alt="">` : ICON.box;
  document.body.appendChild(dot);
  const peak = Math.min(y0, y1) - 120;
  dot.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(.6) rotate(0deg)`, opacity: 0 },
    { transform: `translate(${x0}px, ${y0}px) scale(1.15) rotate(40deg)`, opacity: 1, offset: .15 },
    { transform: `translate(${(x0 + x1) / 2}px, ${peak}px) scale(1) rotate(200deg)`, offset: .55 },
    { transform: `translate(${x1}px, ${y1}px) scale(.35) rotate(360deg)`, opacity: .9 },
  ], { duration: 720, easing: 'cubic-bezier(.45, 0, .2, 1)' }).onfinish = () => { dot.remove(); bump(); };
}

/* ================= PHONE CAROUSEL DOTS ================= */
function carouselDots(row, label) {
  let dots = row.nextElementSibling;
  if (!dots || !dots.classList.contains('dots')) {
    dots = document.createElement('div');
    dots.className = 'dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', label);
    row.after(dots);
  }
  const items = [...row.children];
  dots.innerHTML = items.map((_, i) => `<button type="button" aria-label="Show ${i + 1} of ${items.length}"${i ? '' : ' aria-current="true"'}></button>`).join('');
  const btns = [...dots.children];
  btns.forEach((b, i) => b.addEventListener('click', () => items[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })));
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) btns.forEach((b, i) => (items[i] === en.target ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
  }), { root: row, threshold: .6 });
  items.forEach((it) => io.observe(it));
}
carouselDots($('#strip'), 'Deals');

// deal stickers stamp in once they scroll into view
const stampIO = new IntersectionObserver((ents) => ents.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add('stamp'); stampIO.unobserve(en.target); }
}), { threshold: .6 });
$$('.save').forEach((el) => stampIO.observe(el));

/* ================= MOTION (scroll-linked and list entrances; the hero entrance is CSS) ================= */
const EASE = [0.16, 1, 0.3, 1];
import('../vendor/motion/motion.esm.js').then(({ animate, inView, scroll, stagger }) => {
  motionApi = { animate, stagger };
  const target = (x) => x.target || x;   // inView hands over an IntersectionObserverEntry
  if (!reduced) {
    $$('.prop').forEach((el, i) => {
      const depth = [60, -40, 90, -60, 50][i % 5];
      scroll(animate(el, { translate: ['0 0', `0 ${depth}px`] }, { ease: 'linear' }), { target: $('.hero'), offset: ['start start', 'end start'] });
    });
    scroll((prog) => pizza && pizza.setSpin(prog * 2.2), { target: $('.hero'), offset: ['start start', 'end start'] });
  }
  const listIn = (s, child) => inView(s, (en) => {
    animate($$(child, target(en)), { opacity: [0, 1], ...(reduced ? {} : { y: [24, 0] }) }, { duration: .5, delay: stagger(.05), ease: EASE });
  }, { margin: '0px 0px -10% 0px' });
  listIn('#panels', '.card');
  listIn('#strip', '.deal');

  document.addEventListener('menuview', (e) => {
    if (reduced) return;
    if (e.detail === 'wheel') animate('#wheel', { rotate: [-120, 0], scale: [.88, 1] }, { duration: .9, ease: EASE });
    if (e.detail === 'panels') enter('#panels .card');
    if (e.detail === 'board') enter('#board .board-cat');
    if (e.detail === 'boxes') animate('.pbox-lid', { transform: ['rotateX(100deg)', 'rotateX(48deg)'] }, { duration: .7, delay: stagger(.05), ease: EASE });
  });

  // the oven band: the line fills as you scroll and lights each stop
  const track = $('.journey-track'), steps = $$('.j-step');
  if (!reduced && matchMedia('(min-width: 981px)').matches) {
    track.style.setProperty('--progress', 0);
    scroll((prog) => {
      track.style.setProperty('--progress', prog);
      steps.forEach((s, i) => s.classList.toggle('is-lit', prog >= i / (steps.length - 1) - .02));
    }, { target: track, offset: ['start 85%', 'end 55%'] });
  } else steps.forEach((s) => s.classList.add('is-lit'));
}).catch(() => {});
if (reduced) $$('.j-step').forEach((s) => s.classList.add('is-lit'));
