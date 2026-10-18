// Pizza Max — Ask Max, the shop's chat helper. It answers from the shop's own menu, prices, deals, opening hours,
// delivery area and allergen data (read from app.js, so the chat and the page never disagree), and it can add
// pizzas and dishes to the basket or check a postcode. It runs in the browser: nothing anyone types leaves the page.
// It reads loosely: spelling slips ("margarita", "deliveryy"), plurals, case, accents and the common German words
// ("Öffnungszeiten", "liefert ihr nach 13187?") are understood. When it doesn't know, it says so and gives the phone
// number; it never makes up a fact, a time or a price.
import { shop } from './app.js';

const {
  PIZZAS, BOARD, DEALS, AREAS, HOURS, SIZES, SIZE_NAME, SIZE_SHORT, CRUST, ALLERGENS, ADDITIVES, BASE_CODES,
  MIN_DELIVERY, ICON, TAGS, contact, byId, eur, esc, separately, shopState, when, fmtH, zipState, areaOf, berlinNow,
} = shop;
const $ = (s, r = document) => r.querySelector(s);
const TEL = `<a href="tel:${contact.tel}">${contact.phone}</a>`;
const MIN = eur(MIN_DELIVERY).replace(/\.00$/, '');   // "€15", as the site writes it
const phoneSheet = () => matchMedia('(max-width: 560px)').matches;

/* ================= READING WHAT PEOPLE TYPE ================= */
// lower case, no accents (ä -> a, ß -> ss), € as a word, punctuation out; then a light stem (pizzas -> pizza)
const norm = (s) => String(s).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’`]/g, '').replace(/€/g, ' euro ').replace(/[^a-z0-9]+/g, ' ').trim();
const stem = (w) => (w.length > 3 && /[^su]s$/.test(w) ? w.slice(0, -1) : w);
const toks = (s) => norm(s).split(' ').filter(Boolean).map(stem);

// edit distance with swapped neighbours counted once ("pizaz"), stopping early past the allowed number of slips
function osa(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let p2 = null, p1 = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const c = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      c[j] = Math.min(p1[j] + 1, c[j - 1] + 1, p1[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) c[j] = Math.min(c[j], p2[j - 2] + 1);
      low = Math.min(low, c[j]);
    }
    if (low > max) return max + 1;
    p2 = p1; p1 = c;
  }
  return p1[b.length];
}
// how well a typed word matches a known word: 1 exact, .85 one slip, .8 a longer form, .7 two slips.
// Words of four letters or fewer and everyday words must be exact ("open" is not "oven", "what" is not "wheat");
// numbers match only exactly.
const PLAIN = new Set(['what', 'whats', 'where', 'when', 'which', 'with', 'that', 'this', 'have', 'your', 'does', 'from', 'they', 'them',
  'will', 'would', 'could', 'should', 'there', 'here', 'about', 'much', 'many', 'some', 'more', 'take', 'like', 'make', 'give', 'want',
  'know', 'tell', 'show', 'also', 'just', 'very', 'good', 'time', 'then', 'than', 'into', 'only', 'come', 'were', 'been', 'need', 'please']);
function sim(t, w) {
  if (t === w) return 1;
  if (/\d/.test(t) || /\d/.test(w) || PLAIN.has(t)) return 0;
  if (w.length >= 4 && t.length > w.length && t.startsWith(w)) return 0.8;      // delivering ~ deliver
  const k = w.length <= 4 ? 0 : w.length <= 6 ? 1 : 2;
  if (!k || t.length < 4) return 0;
  const d = osa(t, w, k);
  return d > k ? 0 : d === 1 ? 0.85 : 0.7;
}
// a known phrase in the message: its best score and where it starts (every word must match, in order)
function find(t, key) {
  let best = 0, at = -1;
  for (let i = 0; i + key.length <= t.length; i++) {
    let s = 0;
    for (let j = 0; j < key.length; j++) {
      const v = sim(t[i + j], key[j]);
      if (!v) { s = 0; break; }
      s += v;
    }
    if (s / key.length > best) { best = s / key.length; at = i; }
  }
  return { s: best, at };
}

/* ================= WHAT A MESSAGE CAN BE ABOUT ================= */
// [topic, strong words, weaker hints]
const TOPICS = [
  ['greet', ['hi', 'hello', 'hey', 'hallo', 'moin', 'servus', 'hiya', 'good morning', 'good evening', 'good afternoon', 'guten tag', 'guten abend', 'guten morgen'], []],
  ['thanks', ['thanks', 'thank you', 'thx', 'cheers', 'danke', 'dankeschon', 'vielen dank', 'merci'], ['great', 'perfect', 'super', 'awesome', 'cool', 'nice']],
  ['bye', ['bye', 'goodbye', 'ciao', 'tschuss', 'see you', 'bis dann', 'auf wiedersehen'], []],
  ['who', ['who are you', 'what are you', 'are you a bot', 'are you human', 'are you real', 'your name', 'are you ai', 'chatgpt', 'wer bist du', 'bist du ein bot'], ['bot', 'robot']],
  ['menu', ['menu', 'speisekarte', 'what do you have', 'what do you sell', 'what can i order', 'what can i eat', 'all pizzas', 'which pizzas', 'what pizzas', 'list of pizzas', 'was gibt es', 'was habt ihr'], ['pizza', 'food', 'essen', 'options', 'choice', 'list', 'have', 'sell']],
  ['price', ['price', 'cost', 'how much', 'preis', 'kosten', 'kostet', 'was kostet', 'wie viel', 'wieviel', 'euro', 'expensive', 'cheap', 'cheapest', 'teuer', 'billig', 'gunstig', 'budget'], []],
  ['deals', ['deal', 'offer', 'combo', 'bundle', 'angebot', 'special', 'discount', 'rabatt', 'sparen', 'save', 'saving', 'aktion', 'menu deal', 'sparmenu'], []],
  ['hours', ['open', 'opening', 'opening hours', 'hours', 'close', 'closing', 'closed', 'offnungszeiten', 'geoffnet', 'offen', 'schliesst', 'bis wann', 'what time', 'until when', 'how late', 'open now', 'open today'], ['when', 'wann', 'late', 'tonight', 'now', 'jetzt', 'today', 'heute', 'time', 'uhr']],
  ['delivery', ['deliver', 'delivery', 'liefern', 'liefert', 'lieferung', 'lieferservice', 'liefergebiet', 'bring', 'area', 'zone', 'postcode', 'post code', 'zip', 'zip code', 'plz', 'postleitzahl', 'do you come to', 'to my door', 'to my house'], ['home', 'where']],
  ['eta', ['how long', 'wait', 'waiting', 'minutes', 'fast', 'quick', 'lieferzeit', 'wartezeit', 'dauer', 'dauert', 'wie lange', 'arrive', 'when will', 'how soon', 'ready', 'delivery time', 'how long does delivery take'], ['time', 'when', 'take']],
  ['fee', ['fee', 'delivery fee', 'delivery cost', 'charge', 'minimum', 'min order', 'minimum order', 'mindestbestellwert', 'mindestbestellung', 'gebuhr', 'liefergebuhr', 'lieferkosten', 'free delivery', 'kostenlos', 'how much is delivery', 'delivery charge', 'cost of delivery', 'is delivery free', 'was kostet die lieferung'], ['free']],
  ['pickup', ['pickup', 'pick up', 'collect', 'collection', 'takeaway', 'take away', 'to go', 'abholen', 'abholung', 'selbst abholen', 'come by', 'walk in'], []],
  ['address', ['where are you', 'where is', 'address', 'location', 'located', 'adresse', 'find you', 'directions', 'map', 'street', 'wollankstr', 'wollankstrasse', 'how do i get', 'standort', 'anfahrt', 'wo seid ihr', 'wo ist'], ['where', 'wo']],
  ['phone', ['phone', 'call', 'number', 'telefon', 'telefonnummer', 'anrufen', 'nummer', 'contact', 'kontakt', 'reach you', 'talk to', 'speak to', 'real person', 'someone', 'staff', 'whatsapp', 'email', 'e mail'], ['human']],
  ['payment', ['pay', 'payment', 'paying', 'card', 'credit card', 'cash', 'bar', 'bezahlen', 'zahlen', 'zahlung', 'ec karte', 'kartenzahlung', 'paypal', 'apple pay', 'google pay', 'visa', 'mastercard', 'contactless', 'kontaktlos'], []],
  ['allergens', ['allergen', 'allergy', 'allergies', 'allergic', 'allergie', 'allergene', 'intolerance', 'unvertraglichkeit', 'additive', 'zusatzstoffe', 'inhaltsstoffe', 'lactose', 'laktose', 'nut', 'nusse', 'nuss', 'egg', 'eier', 'milk', 'milch', 'dairy', 'wheat', 'weizen', 'cashew', 'sesame', 'soy', 'soja', 'celery', 'mustard', 'what is in', 'whats in', 'ingredients', 'zutaten', 'contain'], []],
  ['veg', ['vegetarian', 'veggie', 'veg', 'vegetarisch', 'meat free', 'meatless', 'no meat', 'without meat', 'ohne fleisch', 'fleischlos'], []],
  ['vegan', ['vegan', 'vegane', 'veganer', 'plant based', 'dairy free', 'no cheese', 'without cheese', 'ohne kase'], []],
  ['glutenfree', ['gluten free', 'glutenfrei', 'celiac', 'coeliac', 'zoliakie', 'no gluten', 'without gluten', 'ohne gluten', 'gluten'], []],
  ['spicy', ['spicy', 'hot', 'scharf', 'chilli', 'chili', 'jalapeno', 'heat', 'fiery', 'pikant'], []],
  ['fish', ['fish', 'seafood', 'fisch', 'meeresfruchte'], []],
  ['meat', ['meat', 'fleisch', 'meaty', 'meat lover'], []],
  ['crust', ['crust', 'stuffed crust', 'cheese crust', 'stuffed', 'filled crust', 'kaserand', 'rand', 'border', 'extra cheese'], []],
  ['sizes', ['size', 'how big', 'diameter', 'cm', 'grosse', 'groesse', 'wie gross', 'how many people', 'people', 'personen', 'feeds', 'share', 'sharing'], ['big', 'small', 'large']],
  ['order', ['order', 'ordering', 'how to order', 'how do i order', 'bestellen', 'bestellung', 'buy', 'kaufen', 'basket', 'cart', 'warenkorb', 'checkout', 'order online'], []],
  ['add', ['add', 'i want', 'i would like', 'id like', 'i will take', 'ill take', 'i take', 'give me', 'get me', 'can i get', 'can i have', 'i need', 'ich mochte', 'ich nehme', 'ich hatte gern', 'put in', 'one please', 'please add'], ['want', 'take', 'need']],
  ['recommend', ['recommend', 'recommendation', 'suggest', 'suggestion', 'best', 'popular', 'favourite', 'favorite', 'bestseller', 'top', 'empfehlen', 'empfehlung', 'empfiehlst', 'what should i', 'tipp', 'signature', 'beliebt', 'most ordered'], ['good']],
  ['reviews', ['review', 'rating', 'stars', 'bewertung', 'google reviews', 'trustpilot'], []],
  ['dinein', ['table', 'reserve', 'reservation', 'reservieren', 'tisch', 'dine in', 'eat in', 'sit', 'seats', 'restaurant', 'vor ort essen'], []],
  ['jobs', ['job', 'jobs', 'work for', 'career', 'hiring', 'arbeit', 'minijob', 'bewerbung', 'driver job', 'fahrer'], []],
  ['catering', ['catering', 'event', 'large order', 'big order', 'office', 'party order', 'firmen'], []],
  ['oven', ['oven', 'stone oven', 'steinofen', 'ofen', 'dough', 'teig', 'homemade'], []],
  ['yes', ['yes', 'yeah', 'yep', 'ja', 'sure', 'ok', 'okay', 'please', 'gerne', 'genau'], []],
].map(([id, strong, weak]) => ({
  id, keys: [...strong.map((x) => ({ k: toks(x), w: 1 })), ...weak.map((x) => ({ k: toks(x), w: 0.5 }))].sort((a, b) => b.k.length - a.k.length),
}));

function topicScores(t) {
  const out = {};
  for (const { id, keys } of TOPICS) {
    let s = 0;
    const used = new Set();
    for (const { k, w } of keys) {
      const f = find(t, k);
      if (f.s < (w < 1 ? 0.85 : 0.7)) continue;
      const span = k.map((_, j) => f.at + j);
      if (span.some((i) => used.has(i))) continue;
      span.forEach((i) => used.add(i));
      s += w * f.s * (1 + 0.25 * (k.length - 1));
    }
    out[id] = s;
  }
  return out;
}

/* ---------- the things a message can name ---------- */
const PIZZA_ALIAS = {
  marg: ['margherita deluxe', 'margherita', 'margarita', 'margherita pizza'],
  salami: ['salami max', 'salami pizza', 'salami', 'pepperoni'],
  diavolo: ['diavolo', 'diavola', 'devil', 'hot salami'],
  funghi: ['funghi fresco', 'funghi', 'fungi', 'mushroom pizza', 'pilz pizza', 'pilzpizza'],
  garden: ['veggie garden', 'garden', 'vegetable pizza', 'gemuse pizza', 'gemusepizza'],
  tonno: ['tonno cipolla', 'tonno', 'tuna pizza', 'thunfisch pizza', 'thunfischpizza'],
  hawaii: ['hawaii', 'hawaiian', 'hawai', 'ananas pizza'],
  supreme: ['max supreme', 'supreme'],
};
const ITEM_ALIAS = {
  'Max Burger': ['max burger', 'beef burger', 'hamburger', 'cheeseburger'],
  'Cheese Smash': ['cheese smash', 'smash burger', 'smash'],
  'Chicken Crunch': ['chicken crunch', 'chicken burger', 'crispy chicken', 'chicken'],
  'Veggie Burger': ['veggie burger', 'halloumi burger', 'halloumi', 'vegetarian burger'],
  'Spaghetti Bolognese': ['spaghetti bolognese', 'bolognese', 'spaghetti'],
  'Penne Arrabbiata': ['penne arrabbiata', 'arrabbiata', 'arabiata', 'penne'],
  'Tagliatelle Carbonara': ['tagliatelle carbonara', 'carbonara', 'tagliatelle'],
  'Caesar Salad': ['caesar salad', 'caesar'],
  'Greek Salad': ['greek salad', 'greek', 'griechischer salat', 'feta salad'],
  'Rocket & Grana': ['rocket grana', 'rocket salad', 'rucola salat', 'rucola'],
  'Mini Margherita': ['mini margherita', 'kids pizza', 'kinderpizza', 'mini pizza'],
  'Nuggets & Fries': ['chicken nuggets', 'nuggets', 'fries', 'chips', 'pommes'],
  Tiramisu: ['tiramisu'],
  'Chocolate Lava Cake': ['chocolate lava cake', 'lava cake', 'chocolate cake', 'schokokuchen', 'schokoladenkuchen'],
  'Cola 0.5 l': ['coca cola', 'cola', 'coke'],
  'Lemonade 0.33 l': ['lemonade', 'limo', 'limonade'],
  'Still water 0.5 l': ['still water', 'water', 'wasser', 'stilles wasser'],
  'Sparkling water 0.5 l': ['sparkling water', 'sparkling', 'sprudel', 'mineral water', 'mineralwasser'],
};
const CAT_ALIAS = {
  burger: ['burger', 'burgers', 'hamburgers'],
  pasta: ['pasta', 'nudeln', 'noodles'],
  salate: ['salad', 'salat', 'salads', 'salate'],
  kids: ['kids', 'kid', 'children', 'child', 'kinder', 'kinderteller', 'little ones'],
  desserts: ['dessert', 'desserts', 'sweet', 'sweets', 'nachtisch', 'nachspeise', 'cake', 'kuchen'],
  getraenke: ['drink', 'drinks', 'beverage', 'getranke', 'trinken', 'soda', 'softdrink', 'soft drink'],
};
const DEAL_ALIAS = [['solo', 'solo deal'], ['duo', 'duo deal'], ['party', 'party deal']];
// ingredients people ask for, to the word the menu uses
const INGREDIENT = {
  mozzarella: ['mozzarella'], gouda: ['gouda'], tomato: ['tomato', 'tomatoes', 'tomate', 'tomaten'], basil: ['basil', 'basilikum'],
  pesto: ['pesto'], salami: ['salami', 'pepperoni'], beef: ['beef', 'rind', 'rindfleisch'], cheese: ['cheese', 'kase'], oregano: ['oregano'],
  jalapeno: ['jalapeno', 'jalapenos', 'peperoni'], onion: ['onion', 'onions', 'zwiebel', 'zwiebeln'], chilli: ['chilli oil', 'chili oil'],
  mushroom: ['mushroom', 'mushrooms', 'pilz', 'pilze', 'champignon', 'champignons'], garlic: ['garlic', 'knoblauch'], thyme: ['thyme', 'thymian'],
  pepper: ['pepper', 'peppers', 'paprika', 'bell pepper'], olive: ['olive', 'olives', 'oliven'], rocket: ['rocket', 'rucola', 'arugula'],
  tuna: ['tuna', 'thunfisch'], caper: ['caper', 'capers', 'kapern'], ham: ['ham', 'schinken'], pineapple: ['pineapple', 'ananas'],
};
const SIZE_WORDS = [
  ['small', 'smallest', 'klein', 'kleine', 'kleinste', 'standard', '26', '26cm'],
  ['medium', 'mittel', 'mittlere', 'maxi', '32', '32cm', 'regular'],
  ['large', 'largest', 'big', 'bigger', 'biggest', 'gross', 'grosse', 'wumbo', '38', '38cm', 'family', 'xl', 'huge'],
].map((ws) => ws.map(toks));
const QTY = { one: 1, ein: 1, eine: 1, einen: 1, single: 1, two: 2, zwei: 2, couple: 2, three: 3, drei: 3, four: 4, vier: 4, five: 5, funf: 5, six: 6, sechs: 6 };
const DAYS = [['sunday', 'sonntag', 'sun'], ['monday', 'montag', 'mon'], ['tuesday', 'dienstag', 'tue'], ['wednesday', 'mittwoch', 'wed'],
  ['thursday', 'donnerstag', 'thu'], ['friday', 'freitag', 'fri'], ['saturday', 'samstag', 'sonnabend', 'sat']];
const NEG = new Set(['without', 'no', 'ohne', 'not', 'kein', 'keine', 'never', 'free']);
const WITH = new Set(['with', 'mit', 'has', 'have', 'contain', 'containing', 'topped', 'top', 'including', 'which', 'welche', 'any']);

// everything named in the message; a longer name wins its words ("mini margherita" is a kids' dish, not the pizza)
function entities(t) {
  const found = [];
  const after = (at, set) => [1, 2].some((d) => at - d >= 0 && set.has(t[at - d]));
  const look = (kind, id, names) => names.forEach((n) => {
    const k = toks(n), f = find(t, k);
    if (f.s >= (k.length === 1 && k[0].length <= 5 ? 1 : 0.8)) found.push({ kind, id, at: f.at, len: k.length, s: f.s, pref: kind === 'ing' && (after(f.at, WITH) || after(f.at, NEG)) ? 1 : 0 });
  });
  Object.entries(PIZZA_ALIAS).forEach(([id, ns]) => look('pizza', id, ns));
  Object.entries(ITEM_ALIAS).forEach(([id, ns]) => look('item', id, ns));
  Object.entries(CAT_ALIAS).forEach(([id, ns]) => look('cat', id, ns));
  DEAL_ALIAS.forEach((ns, i) => look('deal', i, ns));
  Object.entries(INGREDIENT).forEach(([id, ns]) => look('ing', id, ns));
  found.sort((a, b) => b.len - a.len || b.pref - a.pref || b.s - a.s || a.at - b.at);
  const taken = new Set(), out = [];
  for (const e of found) {
    const span = Array.from({ length: e.len }, (_, j) => e.at + j);
    if (span.some((i) => taken.has(i))) continue;
    // a pizza or dish named by one word that is also an ingredient ("salami", "rocket") is the ingredient when the
    // message asks what has it ("pizzas with salami")
    span.forEach((i) => taken.add(i));
    out.push(e);
  }
  out.sort((a, b) => a.at - b.at);
  const near = (e, set) => [1, 2].some((d) => e.at - d >= 0 && set.has(t[e.at - d]));
  out.forEach((e) => { e.neg = near(e, NEG); e.qty = qtyBefore(t, e.at); });
  let size = null;
  SIZE_WORDS.forEach((ws, k) => ws.forEach((w) => { if (find(t, w).s >= 0.85) size = k; }));
  let day = null;
  if (t.some((w) => ['today', 'heute', 'tonight', 'now', 'jetzt'].includes(w))) day = 'today';
  if (t.some((w) => ['tomorrow', 'morgen'].includes(w)) && !find(t, toks('guten morgen')).s) day = 'tomorrow';
  if (t.some((w) => ['weekend', 'wochenende'].includes(w))) day = 'weekend';
  DAYS.forEach((names, d) => names.forEach((n) => { const k = toks(n)[0]; if (t.some((w) => (k.length <= 3 ? w === k : sim(w, k) >= 0.85))) day = d; }));
  const areas = AREAS.filter(([a]) => a.split(', ').some((n) => {
    const k = toks(n);
    return k.length === 1 && k[0].length <= 5 ? t.includes(k[0]) : find(t, k).s >= 0.85;
  }));
  return {
    list: out, areas,
    pizzas: out.filter((e) => e.kind === 'pizza'),
    items: out.filter((e) => e.kind === 'item'),
    cats: out.filter((e) => e.kind === 'cat'),
    deals: out.filter((e) => e.kind === 'deal'),
    ings: out.filter((e) => e.kind === 'ing'),
    size, day,
    crust: !!find(t, toks('crust')).s || !!find(t, toks('kaserand')).s,
    withWord: t.some((w) => WITH.has(w)),
  };
}
function qtyBefore(t, at) {
  for (const d of [1, 2]) {
    const w = t[at - d];
    if (!w) break;
    if (/^[1-9]$/.test(w)) return +w;
    if (QTY[w]) return QTY[w];
    if (!SIZE_WORDS.some((ws) => ws.some((k) => k[0] === w))) break;   // "2 large salami": look past the size
  }
  return 0;
}

/* ================= ANSWERS (only from the shop's own data) ================= */
const ctx = { pizza: null, item: null, deal: null, size: null, pending: null };
const items = BOARD.flatMap((c) => c.items.map((it) => ({ ...it, cat: c.cat, title: c.title })));
const itemBy = (n) => items.find((it) => it.n === n);
const allergenNames = (p) => {
  const codes = [...BASE_CODES, ...p.codes];
  return { alg: codes.filter((c) => ALLERGENS[c]).map((c) => ALLERGENS[c]), add: codes.filter((c) => ADDITIVES[c]).map((c) => ADDITIVES[c]) };
};
const listJoin = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const top = (id) => `assets/pizza/${id}-top-240.webp`;
const tagsHtml = (p) => `<div class="tags">${TAGS.filter(([t]) => p.tags.includes(t)).map(([, cls, label, icon]) => `<span class="pill ${cls}">${icon}<span class="pill-txt">${label}</span></span>`).join('')}</div>`;
const chips = (qs) => ({ chips: qs });

function pizzaCard(p, main = 1) {
  const sizes = [0, 1, 2].map((k) => `<button type="button" data-act="add" data-id="${p.id}" data-k="${k}"${k === main ? ' class="is-main"' : ''}
    aria-label="Add ${p.name}, ${SIZES[k]}, ${eur(p.price[k])}"><span>${k === main ? `Add ${SIZE_NAME[k]}` : SIZE_SHORT[k]}</span><b>${eur(p.price[k])}</b></button>`).join('');
  return `<div class="am-pz">
    <img src="${top(p.id)}" alt="" width="240" height="240">
    <p class="am-pz-name">${p.name}</p>
    <p class="am-pz-ing">${p.ing}</p>
    ${tagsHtml(p)}
    <div class="am-sizes">${sizes}</div>
  </div>`;
}
const pizzaRows = (ps, price = (p) => `from ${eur(p.price[0])}`) => `<ul class="am-list">${ps.map((p) => `<li><button type="button" data-act="pizza" data-id="${p.id}">
  <img src="${top(p.id)}" alt="" width="240" height="240"><span class="nm">${p.name}<small>${p.ing}</small></span><span class="pr">${price(p)}</span></button></li>`).join('')}</ul>`;
const itemRows = (its) => `<ul class="am-list">${its.map((it) => `<li><button type="button" class="no-img" data-act="additem" data-n="${esc(it.n)}" aria-label="Add ${esc(it.n)}, ${eur(it.p)}">
  <span class="nm">${esc(it.n)}<small>${esc(it.d)}</small></span><span class="pr">${ICON.plus.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px;margin-right:4px"')}${eur(it.p)}</span></button></li>`).join('')}</ul>`;

function statusLine() {
  const s = shopState();
  return s.open ? `We're open now, until ${s.until}.` : `We're closed right now and open ${s.nextLabel}; you can order ahead.`;
}
function hoursRows(highlightDay = berlinNow().getDay()) {
  const span = (d) => `${fmtH(HOURS[d][0])} – ${fmtH(HOURS[d][1])}`;
  const rows = [['Mon – Thu', [1, 2, 3, 4], span(1)], ['Fri – Sat', [5, 6], span(5)], ['Sunday', [0], span(0)]];
  return `<ul class="am-rows">${rows.map(([label, days, v]) => `<li${days.includes(highlightDay) ? ' class="is-today"' : ''}><span>${label}</span><i></i><b>${v}</b></li>`).join('')}</ul>`;
}
const DAY_NAME = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function dealBlock(i) {
  const d = DEALS[i], sep = separately(i);
  return `<div><p class="am-pz-name">${d.title}</p><p>${listJoin(d.items)}: <b>${eur(d.price)}</b>.</p>
    <p class="am-note">You choose the pizzas. With our standard pick that's ${eur(sep)} separately, so you save ${eur(sep - d.price)}.</p></div>`;
}
function zipReply(z) {
  const st = zipState(z);
  if (st === 'ok') {
    return { html: `<p>Yes, we deliver to <b>${z}</b> (${areaOf(z)}): ${MIN} minimum order, no delivery fee, at your door ${when(30)}.</p>
      <div class="am-acts"><button type="button" class="mini-btn" data-act="zip" data-z="${z}">Use ${z} for my order</button></div>`, ...chips(['Show me the pizzas', 'Today\'s deals']) };
  }
  return { html: `<p>Sorry, we don't deliver to <b>${z}</b>. You can pick up at ${contact.address}, ready ${when(20)}.</p>
    <p class="am-note">We deliver to ${AREAS.map(([a]) => a).join(', ')}.</p>`, ...chips(['Show me the pizzas', 'Where are you?', 'Opening hours']) };
}

function added(text) {
  const n = shop.cartCount(), sum = shop.cartSum();
  const gap = sum < MIN_DELIVERY ? ` For delivery, add ${eur(MIN_DELIVERY - sum)} more (the minimum is ${MIN}; delivery is free).` : '';
  return { html: `<p>Added: <b>${esc(text)}</b>. Your basket: ${n} ${n === 1 ? 'item' : 'items'}, ${eur(sum)}.${gap}</p>
    <div class="am-acts"><button type="button" class="btn btn-red" data-act="basket">View basket</button></div>`, ...chips(['Add a drink', 'Desserts', 'Today\'s deals']) };
}
function addPizza(p, k, qty = 1, crust = false, from = null) {
  for (let i = 0; i < Math.max(1, qty); i++) shop.addPizza(p, k, crust, from);
  ctx.pizza = p.id; ctx.size = k;
  const price = p.price[k] + (crust ? CRUST : 0);
  return added(`${qty > 1 ? `${qty} × ` : ''}${p.name}${crust ? ' with cheese-stuffed crust' : ''}, ${SIZES[k]}, ${eur(price * Math.max(1, qty))}`);
}
function addItem(it, qty = 1, from = null) {
  for (let i = 0; i < Math.max(1, qty); i++) shop.addItem(it, from);
  ctx.item = it.n;
  return added(`${qty > 1 ? `${qty} × ` : ''}${it.n}, ${eur(it.p * Math.max(1, qty))}`);
}

const A = {
  greet: () => ({ html: `<p>Hi! Ask me about our pizzas and prices, the deals, opening hours, allergens or whether we deliver to you. ${statusLine()}</p>`, ...chips(['What\'s on the menu?', 'Today\'s deals', 'Do you deliver to me?']) }),
  thanks: () => ({ html: '<p>You\'re welcome! Anything else? Otherwise: enjoy your pizza.</p>', ...chips(['Show me the pizzas', 'View basket']) }),
  bye: () => ({ html: '<p>Bye, and enjoy your pizza!</p>' }),
  who: () => ({ html: `<p>I'm the shop's chat helper. I answer from our menu, prices, opening hours and delivery area, right here in your browser. I'm not a person, so for anything I can't answer, call us on ${TEL}.</p>`, ...chips(['What\'s on the menu?', 'Opening hours']) }),
  menu: () => ({
    html: `<p>Eight pizzas, each in three sizes: Standard 26 cm, Maxi 32 cm and Wumbo 38 cm. Tap one for the details.</p>${pizzaRows(PIZZAS)}
      <p>We also have burgers, pasta, salads, kids' dishes, desserts and drinks.</p>
      <div class="am-acts"><button type="button" class="mini-btn" data-act="goto" data-to="#menu">Open the menu on the page</button></div>`,
    ...chips(['Burgers', 'Pasta', 'Salads', 'Drinks']),
  }),
  deals: () => ({ html: `<p>Our three deals, each in our boxes:</p>${DEALS.map((_, i) => dealBlock(i)).join('<div class="am-rule"></div>')}
      <div class="am-acts"><button type="button" class="mini-btn" data-act="goto" data-to="#aktion">Choose a deal</button></div>`, ...chips(['Which pizzas can I choose?', 'Opening hours']) }),
  hours: (e) => {
    if (typeof e.day === 'number') {
      const [o, c] = HOURS[e.day];
      return { html: `<p>On ${DAY_NAME[e.day]} we're open ${fmtH(o)} – ${fmtH(c)}.</p>${hoursRows(e.day)}<p class="am-note">${statusLine()}</p>` };
    }
    if (e.day === 'tomorrow') {
      const d = (berlinNow().getDay() + 1) % 7, [o, c] = HOURS[d];
      return { html: `<p>Tomorrow (${DAY_NAME[d]}) we're open ${fmtH(o)} – ${fmtH(c)}.</p>${hoursRows(d)}` };
    }
    if (e.day === 'weekend') return { html: `<p>At the weekend: Friday and Saturday 11:00 – 01:00, Sunday 12:00 – 23:00.</p>${hoursRows()}` };
    return { html: `<p>${statusLine()}</p>${hoursRows()}<p class="am-note">Times are Berlin time.</p>`, ...chips(['How long does delivery take?', 'Do you deliver to me?']) };
  },
  delivery: () => ({
    html: `<p>We deliver free around Pankow, with a ${MIN} minimum order. Type your postcode and I'll check it.</p>
      <ul class="am-rows">${AREAS.map(([a, z]) => `<li><span>${a}</span><i></i><b>${z.join(', ')}</b></li>`).join('')}</ul>`,
    ...chips(['13187', 'How long does delivery take?']),
  }),
  eta: () => ({ html: `<p>Delivery: at your door ${when(30)}. Pickup: ready ${when(20)}.</p><p class="am-note">${statusLine()}</p>`, ...chips(['Do you deliver to me?', 'Show me the pizzas']) }),
  fee: () => ({ html: `<p>Delivery is free, with a <b>${MIN} minimum order</b>. Pickup has no minimum.</p>`, ...chips(['Do you deliver to me?', 'Show me the pizzas']) }),
  pickup: () => ({ html: `<p>Pick up at ${contact.address}: ready ${when(20)}. Order here, or call ${TEL}.</p>`, ...chips(['Opening hours', 'Show me the pizzas']) }),
  address: () => ({ html: `<p>We're at <b>${contact.address}</b>.</p><div class="am-acts"><button type="button" class="mini-btn" data-act="goto" data-to="#kontakt">Show it on the page</button></div>`, ...chips(['Opening hours', 'Do you deliver to me?']) }),
  phone: () => ({ html: `<p>Call us on ${TEL}, during opening hours. ${statusLine()}</p><p class="am-note">Orders by phone are welcome too.</p>` }),
  payment: () => ({ html: '<p>You pay when your pizza arrives, or when you pick it up: <b>cash or card</b>. There\'s no online payment.</p>', ...chips(['How do I order?', 'Show me the pizzas']) }),
  allergens: () => ({
    html: `<p>Every pizza is made with our wheat dough (gluten, wheat). Ask me about any pizza, for example "allergens in the Diavolo". The key:</p>
      <ul class="am-rows">${Object.entries(ALLERGENS).map(([c, n]) => `<li><span>${c}</span><i></i><b>${n}</b></li>`).join('')}${Object.entries(ADDITIVES).map(([c, n]) => `<li><span>${c}</span><i></i><b>${n}</b></li>`).join('')}</ul>
      <p class="am-note">For burgers, pasta and the other dishes, allergens are on request: call ${TEL}.</p>`,
    ...chips(['Pizzas without nuts', 'Is anything gluten-free?']),
  }),
  veg: () => {
    const ps = PIZZAS.filter((p) => p.tags.includes('veg'));
    const others = items.filter((it) => it.t.includes('veg') && it.cat !== 'getraenke').map((it) => it.n);
    return { html: `<p>Our vegetarian pizzas:</p>${pizzaRows(ps)}<p class="am-note">Also vegetarian: ${listJoin(others)}.</p>`, ...chips(['Is anything vegan?', 'Spicy pizzas']) };
  },
  vegan: () => ({ html: `<p>None of our pizzas is vegan: they all have cheese (milk). For the other dishes, ask us on ${TEL}.</p>`, ...chips(['Vegetarian pizzas']) }),
  glutenfree: () => ({ html: `<p>Every pizza is made with our wheat dough, so none of them is gluten-free. For the other dishes, allergens are on request: ${TEL}.</p>` }),
  spicy: () => ({ html: `<p>The hot ones:</p>${pizzaRows(PIZZAS.filter((p) => p.tags.includes('hot')))}<p class="am-note">Also spicy: Penne Arrabbiata.</p>` }),
  fish: () => ({ html: `<p>Our fish pizza:</p>${pizzaRows(PIZZAS.filter((p) => p.tags.includes('fish')))}` }),
  meat: () => ({ html: `<p>With meat:</p>${pizzaRows(PIZZAS.filter((p) => p.tags.includes('meat')))}` }),
  crust: () => ({ html: `<p>A cheese-stuffed crust is <b>+${eur(CRUST)}</b> on any pizza, in any size. Say for example "Diavolo Maxi with crust" and I'll add it.</p>`, ...chips(['Show me the pizzas']) }),
  sizes: () => ({ html: '<p>Three sizes: <b>Standard 26 cm</b>, <b>Maxi 32 cm</b> and <b>Wumbo 38 cm</b>, the biggest. The Party deal has three Wumbos.</p>', ...chips(['Show me the pizzas', 'Today\'s deals']) }),
  order: () => ({ html: `<p>Tap a pizza and a size to add it, or just tell me, for example "a Maxi Salami Max". The basket is in the corner; you pay cash or card at the door or at pickup. You can also call ${TEL}.</p>`, ...chips(['Show me the pizzas', 'Today\'s deals']) }),
  recommend: () => {
    ctx.pizza = 'salami';
    return { html: `<p>The Salami Max wears our Bestseller sticker. For heat, try the Diavolo; without meat, the Veggie Garden.</p>${pizzaCard(byId('salami'))}`, ...chips(['Diavolo', 'Veggie Garden']) };
  },
  oven: () => ({ html: '<p>Every pizza is baked on the stone, from dough rested for 24 hours, with tomato sauce from our own pot.</p>', ...chips(['Show me the pizzas', 'Today\'s deals']) }),
  reviews: () => ({ html: '<p>We don\'t have reviews on the site yet. They will come from real customers; we don\'t make any up.</p>' }),
  dinein: () => ({ html: `<p>I can't book tables. For eating in, please call us on ${TEL}.</p>` }),
  jobs: () => ({ html: `<p>I don't know about jobs, sorry. Please ask us on ${TEL}.</p>` }),
  catering: () => ({ html: `<p>For a big order, call us on ${TEL} so we can plan it. The Party deal (3 Wumbo pizzas, 4 drinks, 2 desserts, ${eur(DEALS[2].price)}) is a good start.</p>` }),
  price: () => {
    const lo = PIZZAS.reduce((a, p) => (p.price[0] < a.price[0] ? p : a)), hi = PIZZAS.reduce((a, p) => (p.price[2] > a.price[2] ? p : a));
    return { html: `<p>Pizzas run from <b>${eur(lo.price[0])}</b> (${lo.name}, 26 cm) to <b>${eur(hi.price[2])}</b> (${hi.name}, 38 cm).</p>${pizzaRows([...PIZZAS].sort((a, b) => a.price[0] - b.price[0]))}`, ...chips(['Today\'s deals', 'Burgers']) };
  },
};

function unknown(scores) {
  const LABEL = { menu: 'What\'s on the menu?', deals: 'Today\'s deals', hours: 'Opening hours', delivery: 'Do you deliver to me?', allergens: 'Allergens', price: 'Prices', pickup: 'Pickup', payment: 'How can I pay?' };
  const near = Object.entries(scores).filter(([id, s]) => LABEL[id] && s >= 0.35).sort((a, b) => b[1] - a[1]).map(([id]) => LABEL[id]);
  const qs = [...new Set([...near, 'What\'s on the menu?', 'Opening hours', 'Do you deliver to me?', 'Today\'s deals'])].slice(0, 4);
  return { html: `<p>Sorry, I didn't catch that. I know our menu, prices, deals, opening hours, allergens and delivery area. For anything else, call us on ${TEL}.</p>`, chips: qs };
}

/* ================= DECIDING WHAT TO ANSWER ================= */
function answer(text, hint = {}) {
  const raw = String(text).trim().slice(0, 200);
  const t = toks(raw);
  const e = entities(t);
  const sc = topicScores(t);
  const best = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
  const strong = (id, min = 0.7) => sc[id] >= min;
  const zip = (raw.match(/\b(\d{5})\b/) || [])[1];
  const qty = (en) => en.qty || 0;
  const wantsAdd = strong('add') || (strong('order') && (e.pizzas.length || e.items.length));
  const size = e.size ?? ctx.size ?? 1;

  if (hint.pizza) { ctx.pizza = hint.pizza; return { html: pizzaCard(byId(hint.pizza), ctx.size ?? 1) }; }
  if (!t.length) return null;
  if (zip) return zipReply(zip);
  if (/^\d{3,4}$|^\d{6,}$/.test(raw.replace(/\s/g, ''))) return { html: '<p>Postcodes in Berlin have five digits, for example 13187. Which one is yours?</p>' };
  if (e.areas.length && !e.pizzas.length && !e.items.length) {
    return { html: e.areas.map(([a, z]) => `<p>Yes, we deliver to <b>${a}</b> (${z.join(', ')}): ${MIN} minimum order, no delivery fee, at your door ${when(30)}.</p>`).join(''), ...chips(['Show me the pizzas', 'Today\'s deals']) };
  }

  // ingredient questions: "which pizzas have mushrooms", "pizza without onion", "mit Ananas"
  const ingAsk = e.ings.length && (e.withWord || e.ings.some((x) => x.neg) || (!e.pizzas.length && !e.items.length && best[1] < 0.7));
  if (ingAsk && !e.pizzas.some((p) => p.len > 1)) {
    const has = (p, id) => (id === 'cheese' ? /mozzarella|gouda|cheese/i.test(p.ing) : toks(p.ing).some((w) => INGREDIENT[id].some((n) => toks(n).length === 1 && sim(w, toks(n)[0]) >= 0.8)));
    const want = e.ings.filter((x) => !x.neg).map((x) => x.id), avoid = e.ings.filter((x) => x.neg).map((x) => x.id);
    const ps = PIZZAS.filter((p) => want.every((id) => has(p, id)) && avoid.every((id) => !has(p, id)));
    const say = [want.length ? `with ${listJoin(want)}` : '', avoid.length ? `without ${listJoin(avoid)}` : ''].filter(Boolean).join(' and ');
    if (!ps.length) return { html: `<p>None of our pizzas comes ${say}. For changes to a pizza, ask us on ${TEL}.</p>`, ...chips(['Show me the pizzas']) };
    return { html: `<p>Pizzas ${say}:</p>${pizzaRows(ps)}` };
  }

  // allergens in a named pizza, or pizzas with or without an allergen
  const algWord = { nut: 'H', nuss: 'H', nusse: 'H', cashew: 'H4', egg: 'C', eier: 'C', ei: 'C', fish: 'D', fisch: 'D', milk: 'G', milch: 'G', dairy: 'G', lactose: 'G', laktose: 'G', wheat: 'A1', weizen: 'A1' };
  const algCodes = [...new Set(t.filter((w) => algWord[w]).map((w) => algWord[w]))];
  if (strong('allergens') && (e.pizzas.length || (ctx.pizza && !algCodes.length))) {
    const ps = e.pizzas.length ? e.pizzas.map((x) => byId(x.id)) : [byId(ctx.pizza)];
    ctx.pizza = ps[ps.length - 1].id;
    return { html: ps.map((p) => { const { alg, add } = allergenNames(p); return `<p><b>${p.name}</b>: ${p.ing}. Allergens: ${alg.join(', ')}${add.length ? `; contains ${add.join(', ')}` : ''}.</p>`; }).join('') };
  }
  if (algCodes.length && !e.items.length) {
    const neg = t.some((w) => NEG.has(w));
    const hasCode = (p) => algCodes.some((c) => [...BASE_CODES, ...p.codes].includes(c));
    const ps = PIZZAS.filter((p) => (neg ? !hasCode(p) : hasCode(p)));
    const names = algCodes.map((c) => ALLERGENS[c]);
    if (!ps.length) return { html: `<p>Every one of our pizzas ${neg ? 'has' : 'is free of'} ${listJoin(names)}.${neg ? '' : ''} For the other dishes, ask us on ${TEL}.</p>` };
    return { html: `<p>Pizzas ${neg ? 'without' : 'with'} ${listJoin(names)}:</p>${pizzaRows(ps)}<p class="am-note">Every pizza has gluten and wheat (our dough) and milk (the cheese).</p>` };
  }
  if (strong('vegan')) return A.vegan();
  if (strong('glutenfree') && !strong('allergens', 1.5)) return A.glutenfree();

  // a named deal
  if (e.deals.length && !e.pizzas.length) { ctx.deal = e.deals[0].id; return { html: dealBlock(e.deals[0].id) + '<div class="am-acts"><button type="button" class="mini-btn" data-act="goto" data-to="#aktion">Choose it</button></div>' }; }

  // named pizzas: add them, price them, or show them
  if (e.pizzas.length) {
    const ps = e.pizzas.map((x) => ({ p: byId(x.id), q: qty(x) }));
    if (wantsAdd || ps.some((x) => x.q >= 2)) {
      let last;
      ps.forEach(({ p, q }) => { last = addPizza(p, size, q || 1, e.crust); });
      e.items.forEach((x) => { last = addItem(itemBy(x.id), x.qty || 1); });
      if (ps.length > 1 || e.items.length) {
        const n = shop.cartCount(), sum = shop.cartSum();
        const names = [...ps.map(({ p, q }) => `${q > 1 ? `${q} × ` : ''}${p.name} (${SIZE_NAME[size]})`), ...e.items.map((x) => `${x.qty > 1 ? `${x.qty} × ` : ''}${x.id}`)];
        return { html: `<p>Added: <b>${listJoin(names)}</b>. Your basket: ${n} items, ${eur(sum)}.</p>
          <div class="am-acts"><button type="button" class="btn btn-red" data-act="basket">View basket</button></div>`, ...chips(['Add a drink', 'Desserts']) };
      }
      return last;
    }
    if (ps.length === 1) {                                   // "is the Margherita vegetarian?"
      const p1 = ps[0].p, yn = (ok, what) => `<p>${ok ? 'Yes' : 'No'}, the ${p1.name} ${ok ? 'is' : 'isn\'t'} ${what}.</p>`;
      const quick = strong('vegan') ? yn(false, 'vegan: it has cheese (milk)') : strong('glutenfree') ? yn(false, 'gluten-free: our dough is wheat')
        : strong('veg') ? yn(p1.tags.includes('veg'), 'vegetarian') : strong('spicy') ? yn(p1.tags.includes('hot'), 'spicy') : strong('fish') ? yn(p1.tags.includes('fish'), 'a fish pizza') : '';
      if (quick) { ctx.pizza = p1.id; return { html: quick + pizzaCard(p1, e.size ?? 1) }; }
    }
    ctx.pizza = ps[ps.length - 1].p.id;
    if (e.size !== null) ctx.size = e.size;
    if (strong('price') && e.size !== null && ps.length === 1) {
      const p = ps[0].p;
      return { html: `<p>${p.name}, ${SIZES[e.size]}: <b>${eur(p.price[e.size])}</b>${e.crust ? `, or ${eur(p.price[e.size] + CRUST)} with the cheese-stuffed crust` : ''}.</p>${pizzaCard(p, e.size)}` };
    }
    if (ps.length > 1) return { html: `<p>Here they are:</p>${pizzaRows(ps.map((x) => x.p), (p) => `${eur(p.price[size])}`)}<p class="am-note">Prices for ${SIZES[size]}.</p>` };
    const p = ps[0].p;
    return { html: `${pizzaCard(p, e.size ?? 1)}${p.sticker ? `<p class="am-note">It wears our ${p.sticker} sticker.</p>` : ''}${e.crust ? `<p class="am-note">Cheese-stuffed crust: +${eur(CRUST)}, say "with crust" when you add it.</p>` : ''}` };
  }

  // named dishes and drinks
  if (e.items.length) {
    const its = e.items.map((x) => ({ it: itemBy(x.id), q: qty(x) }));
    if (wantsAdd || its.some((x) => x.q >= 2)) { let last; its.forEach(({ it, q }) => { last = addItem(it, q || 1); }); return last; }
    ctx.item = its[0].it.n;
    return { html: `<p>${its.map(({ it }) => `<b>${esc(it.n)}</b>: ${esc(it.d)}, ${eur(it.p)}.`).join(' ')}</p>${itemRows(its.map((x) => x.it))}<p class="am-note">Tap to add it to your basket.</p>` };
  }
  // a whole category
  if (e.cats.length) {
    const c = BOARD.find((b) => b.cat === e.cats[0].id);
    return { html: `<p>${c.title}:</p>${itemRows(c.items)}<p class="am-note">Tap one to add it to your basket.</p>` };
  }

  // cheapest / most expensive
  if (t.some((w) => ['cheapest', 'cheap', 'billig', 'billigste', 'gunstig', 'gunstigste', 'budget'].includes(w))) {
    const lo = [...PIZZAS].sort((a, b) => a.price[0] - b.price[0]);
    return { html: `<p>Our lowest-priced pizza is the <b>${lo[0].name}</b>: ${eur(lo[0].price[0])} at 26 cm. The Solo deal (1 Maxi pizza + 1 drink) is ${eur(DEALS[0].price)}.</p>${pizzaCard(lo[0], 0)}` };
  }
  if (find(t, toks('most expensive')).s || find(t, toks('teuerste')).s) {
    const hi = [...PIZZAS].sort((a, b) => b.price[2] - a.price[2])[0];
    return { html: `<p>The top of the menu is the <b>${hi.name}</b>: ${eur(hi.price[2])} at 38 cm.</p>${pizzaCard(hi, 2)}` };
  }

  // follow-ups about the pizza we were just talking about (only when the message names no other topic)
  const p = ctx.pizza && byId(ctx.pizza);
  if (p && wantsAdd) return addPizza(p, size, 1, e.crust);
  if (p && e.size !== null && best[1] < 1) { ctx.size = e.size; return { html: `<p>${p.name}, ${SIZES[e.size]}: <b>${eur(p.price[e.size])}</b>.</p>${pizzaCard(p, e.size)}` }; }
  if (p && best[0] === 'price' && best[1] < 2) return { html: `<p>${p.name}: ${[0, 1, 2].map((k) => `${SIZE_SHORT[k]} ${eur(p.price[k])}`).join(' · ')}.</p>${pizzaCard(p, ctx.size ?? 1)}` };
  if (strong('yes') && best[0] === 'yes' && ctx.pending) { const f = ctx.pending; ctx.pending = null; return f(); }
  if (wantsAdd && best[0] === 'add') return { html: '<p>Which one would you like? Tap a pizza, or tell me its name and size, for example "a Maxi Diavolo".</p>' + pizzaRows(PIZZAS) };


  // the topic with the best score, if it is clear enough
  if (best[1] >= 0.7 && A[best[0]]) return A[best[0]](e);
  if (sc.menu >= 0.4) return A.menu();
  if (best[0] === 'yes' && best[1] >= 0.7) return { html: '<p>Great! What can I get you?</p>', ...chips(['Show me the pizzas', 'Today\'s deals']) };
  return unknown(sc);
}

/* ================= THE PANEL ================= */
const panel = $('#askMax'), scrim = $('#askScrim');
let built = false, trigger = null;
const SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function build() {
  panel.innerHTML = `<div class="ask-head">
      <img src="assets/favicon.svg" alt="" width="38" height="38">
      <div><h2 id="askTitle" tabindex="-1">Ask Max</h2><p>Our menu, prices, hours and delivery</p></div>
      <button type="button" class="cart-close" data-act="close" aria-label="Close the chat">${ICON.close}</button>
    </div>
    <div class="ask-log" id="askLog" role="log" aria-live="polite" aria-label="Conversation with Ask Max" tabindex="0"></div>
    <form class="ask-form" id="askForm" autocomplete="off">
      <label class="sr-only" for="askInput">Your question</label>
      <input id="askInput" type="text" enterkeyhint="send" maxlength="200" placeholder="Ask about pizzas, prices, hours…">
      <button type="submit" aria-label="Send">${SEND}</button>
    </form>`;
  $('#askForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const inp = $('#askInput'), q = inp.value.trim();
    if (!q) return inp.focus();
    inp.value = '';
    say(q);
  });
  panel.addEventListener('click', onAct);
  panel.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { ev.stopPropagation(); closeAsk(); }
    if (ev.key === 'Tab' && phoneSheet()) {                 // the bottom sheet keeps focus inside, like the basket
      const f = [...panel.querySelectorAll('button, input, a[href], [tabindex="0"]')].filter((x) => x.getClientRects().length);
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    }
  });
  scrim.addEventListener('click', () => closeAsk());
  document.addEventListener('basketopen', () => closeAsk(true));
  built = true;
  reply(A.greet().html, ['What\'s on the menu?', 'Today\'s deals', 'Opening hours', 'Do you deliver to me?', 'Vegetarian pizzas', 'Allergens']);
}

const log = () => $('#askLog');
function scrollTo(el) {
  const l = log();
  const want = el.offsetTop - 12;
  l.scrollTo({ top: Math.min(want, l.scrollHeight), behavior: shop.reduced ? 'auto' : 'smooth' });
}
function reply(html, qs) {
  const m = document.createElement('div');
  m.className = 'am';
  m.innerHTML = html + (qs && qs.length ? `<div class="ask-chips">${qs.map((q) => `<button type="button" data-act="ask" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : '');
  log().appendChild(m);
  return m;
}
function say(q, hint) {
  if (['view basket', 'open basket', 'show basket', 'my basket', 'basket', 'cart', 'warenkorb'].includes(norm(q))) { closeAsk(true); return shop.openBasket(); }
  const u = document.createElement('p');
  u.className = 'au';
  u.textContent = q;
  log().appendChild(u);
  let r;
  try { r = answer(q, hint); } catch (err) { r = { html: `<p>Something went wrong on my side. Please call us on ${TEL}.</p>` }; }
  if (r) reply(r.html, r.chips);
  scrollTo(u);
}

function onAct(ev) {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'close') return closeAsk();
  if (act === 'ask') return say(b.dataset.q);
  if (act === 'pizza') return say(byId(b.dataset.id).name, { pizza: b.dataset.id });
  if (act === 'add') {
    const r = addPizza(byId(b.dataset.id), +b.dataset.k, 1, false, b);
    b.classList.add('is-done');
    setTimeout(() => b.classList.remove('is-done'), 1400);
    reply(r.html, r.chips);
    return scrollTo(log().lastElementChild);
  }
  if (act === 'additem') {
    const r = addItem(itemBy(b.dataset.n), 1, b);
    reply(r.html, r.chips);
    return scrollTo(log().lastElementChild);
  }
  if (act === 'basket') { closeAsk(true); return shop.openBasket(); }
  if (act === 'zip') {
    shop.useZip(b.dataset.z);
    reply(`<p>Done: your order will go to ${esc(b.dataset.z)}. Now pick your pizzas.</p>`, ['Show me the pizzas', 'Today\'s deals']);
    return scrollTo(log().lastElementChild);
  }
  if (act === 'goto') {
    const to = $(b.dataset.to);
    if (phoneSheet()) closeAsk(true);
    if (b.dataset.to === '#menu') return shop.toMenu();
    to.scrollIntoView({ behavior: shop.reduced ? 'auto' : 'smooth', block: 'start' });
    const h = to.querySelector('h2');
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
}

export function openAsk(from) {
  if (!built) build();
  trigger = from || trigger;
  panel.hidden = false;
  scrim.hidden = !phoneSheet();
  document.body.classList.add('ask-open');
  document.querySelectorAll('[data-ask]').forEach((x) => x.setAttribute('aria-expanded', 'true'));
  panel.setAttribute('aria-modal', phoneSheet() ? 'true' : 'false');
  setTimeout(() => (phoneSheet() ? $('#askTitle') : $('#askInput')).focus({ preventScroll: true }), 30);
}
// quiet: closed because something else takes over (the basket, a jump on phones); focus stays where that goes
export function closeAsk(quiet = false) {
  if (panel.hidden) return;
  panel.hidden = true;
  scrim.hidden = true;
  document.body.classList.remove('ask-open');
  document.querySelectorAll('[data-ask]').forEach((x) => x.setAttribute('aria-expanded', 'false'));
  if (!quiet) {
    const seen = (x) => x && x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden';
    const back = seen(trigger) ? trigger : seen($('#cornerToggle')) ? $('#cornerToggle') : null;
    if (back) back.focus();
  }
}

// the reading and answering, to check answers from the browser console
export { answer };
