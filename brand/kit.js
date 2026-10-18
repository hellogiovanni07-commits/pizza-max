// Pizza Max — the kit. Every material is a <template data-id> in index.html; this file lays them on the
// table at true relative scale, sizes them (one unit = 1 mm for print, 1 px for screens), opens the spec
// view, prints a single material at true size with bleed and crop marks, and renders one material alone for
// export (?export=<id>&scale=<px per unit>) or its print artwork alone (?art=<id>&scale=).
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SLUG = 9;   // mm outside the bleed, for the crop marks and the job line

/* ---------------------------------------------------------------- the order */
// across: how much of the group (mm, or px for screens) spans the table on a wide screen; acrossSm on a phone.
// piles: things that lie on top of each other, at [x, y, turn] in the group's units.
const ZONES = [
  { id: 'identity', tape: 'the brand itself', line: 'Logo, colour, type, voice and the bits that make it ours', across: 1000, acrossSm: 480 },
  { id: 'print', tape: 'for the printer', line: 'Cards, flyers, menus and paper at true size; the PDFs carry bleed and crop marks', across: 1000, acrossSm: 480,
    piles: [{ name: 'Business and stamp cards', dims: '85 × 55 mm', ids: ['bc-front', 'bc-back', 'loyalty-front', 'loyalty-back'], at: [[0, 8, -4], [62, 46, 3], [128, 0, -2], [184, 40, 5]] }] },
  { id: 'packaging', tape: 'the box & friends', line: 'Everything a pizza leaves the shop in', across: 1500, acrossSm: 720,
    piles: [
      { name: 'Box lid with label and seal', dims: '330 × 330 mm', ids: ['box-lid', 'box-label', 'seal-sticker'], at: [[0, 0, 1], [236, 26, 5], [140, 298, 10]] },
      { name: 'Cup on a napkin', dims: '165 × 165 mm', ids: ['napkin', 'cup'], at: [[0, 0, 3], [22, 44, -14]] },
    ] },
  { id: 'signage', tape: 'outside & on the walls', line: 'Shopfront, pavement, screen and car', across: 3000, acrossSm: 1300 },
  { id: 'wear', tape: 'what the team wears', line: 'Shirts, aprons, caps and name badges', across: 2100, acrossSm: 1150,
    piles: [{ name: 'Apron with a name badge', dims: '600 × 820 mm', ids: ['apron', 'badge'], at: [[0, 0, -.5], [392, 410, -4]] }] },
  { id: 'screens', tape: 'for phones & screens', line: 'Social posts, profile images, email and messages, at native pixels', across: 4400, acrossSm: 2000 },
];
const MM = 'mm', PX = 'px';
// r: how the object lies (degrees); out: files the export makes (art = the print artwork alone, for the printer)
const KIT = [
  // identity
  { id: 'logo', z: 'identity', name: 'Primary logo', w: 210, h: 148, u: MM, r: -1.2, stock: 'Master artwork', colours: 'Basil green, tomato red on white', notes: 'Keep the swoosh and the handwritten line together with the wordmark. Clear space on every side: the height of the "P" in Pizza.', out: ['pdf', 'png'] },
  { id: 'versions', z: 'identity', name: 'Logo on every ground', w: 210, h: 148, u: MM, r: .8, stock: 'Master artwork', colours: 'Full colour, reversed, one colour, on kraft', notes: 'Full colour on white or planks only. On green or red use the white version; on kraft use deep green and dark red; one-colour black for receipts, stamps and fax.', out: ['pdf', 'png'] },
  { id: 'wordmark', z: 'identity', name: 'One-line wordmark', w: 210, h: 60, u: MM, r: -.5, stock: 'Master artwork', colours: 'Any one brand colour', notes: 'For narrow places: the header bar, receipts, the box side, email footers. Minimum width 30 mm in print, 120 px on screen.', out: ['pdf', 'png'] },
  { id: 'seal', z: 'identity', name: 'Round seal', w: 60, h: 60, u: MM, r: 4, stock: 'Stamp, sticker, embroidery', colours: 'One colour', notes: 'Works as an ink stamp on bags and receipts, a box sticker, or a chest patch.', out: ['pdf', 'png'] },
  { id: 'appicon', z: 'identity', name: 'App icon & favicon', w: 148, h: 105, u: MM, r: -2, stock: 'Screen set', colours: 'Tomato red, white, basil green', notes: 'Export 1024, 512, 192, 180 (Apple), 48, 32 and 16 px. The small sizes drop the swoosh; at 16 px only the M is left.', out: ['png'] },
  { id: 'rules', z: 'identity', name: 'Clear space & don\'ts', w: 210, h: 148, u: MM, r: .6, stock: 'Guide card', colours: '-', notes: 'Never stretch, recolour, outline, add effects or set the logo on a busy photo. Minimum size: 25 mm wide in print, 100 px on screen.', out: ['pdf', 'png'] },
  { id: 'colours', z: 'identity', name: 'Colour chips', w: 210, h: 148, u: MM, r: -.8, stock: 'Guide card', colours: 'All brand colours', notes: 'CMYK values are a starting point; ask the printer for a proof on the real paper. Screens use the HEX values.', out: ['pdf', 'png'] },
  { id: 'type', z: 'identity', name: 'Type specimen', w: 148, h: 210, u: MM, r: 1, stock: 'Guide card', colours: '-', notes: 'Plus Jakarta Sans for headlines and product names (letter-spaced capitals), Inter for everything you read, Caveat only for short handwritten notes. Never put prices or allergens in Caveat alone.', out: ['pdf', 'png'] },
  { id: 'voice', z: 'identity', name: 'How we talk', w: 148, h: 210, u: MM, r: -1.5, stock: 'Notepad page', colours: '-', notes: 'Short, warm, plain English (and plain German). Say what is true and checkable; never invent awards, reviews or history.', out: ['pdf', 'png'] },
  { id: 'stickers', z: 'identity', name: 'Sticker sheet', w: 148, h: 210, u: MM, r: 2, stock: 'Gloss sticker paper, kiss-cut', colours: 'Red, green, ink, kraft, white', notes: 'Die-cut line 2 mm outside each sticker. Use one or two per layout, never a pile.', out: ['pdf', 'png'] },
  { id: 'icons', z: 'identity', name: 'Icon set', w: 210, h: 148, u: MM, r: .5, stock: 'SVG set', colours: 'Ink, deep green or white', notes: 'Line icons, 1.8 stroke on a 24 grid, round ends. Use them at 16 px or more; pair every icon with a word.', out: ['pdf', 'png'] },
  { id: 'materials', z: 'identity', name: 'Surfaces', w: 210, h: 148, u: MM, r: -1, stock: 'Swatch card on kraft board', colours: 'Planks, kraft, thermal paper, deep green', notes: 'Our grounds: white-painted planks (web, posters), kraft board (boxes, bags), thermal paper (tickets), deep green (team wear, bags).', out: ['pdf', 'png'] },
  { id: 'imagery', z: 'identity', name: 'Pizza pictures', w: 297, h: 130, u: MM, r: 0, stock: 'Photo prints', colours: '-', notes: 'Only our own renders or photos of our own pizzas. Top view for menus, boxes and the wheel; three-quarter view for posters and social. Always whole, hot and on wood.', out: ['pdf', 'png'] },
  // print
  { id: 'bc-front', z: 'print', name: 'Business card, front', w: 85, h: 55, u: MM, r: -3, bleed: 3, stock: '400 g uncoated, matt', colours: '4/4 CMYK', notes: 'Safe zone 4 mm inside the trim.', out: ['pdf', 'png'] },
  { id: 'bc-back', z: 'print', name: 'Business card, back', w: 85, h: 55, u: MM, r: 2, bleed: 3, stock: '400 g uncoated, matt', colours: '4/4 CMYK', notes: 'Name, phone, address, web and QR are placeholders.', out: ['pdf', 'png'] },
  { id: 'flyer-front', z: 'print', name: 'A5 flyer, front', w: 148, h: 210, u: MM, r: -1, bleed: 3, stock: '170 g gloss', colours: '4/4 CMYK', notes: 'For letterboxes in the delivery area. The pizza bleeds off the right edge.', out: ['pdf', 'png'] },
  { id: 'flyer-back', z: 'print', name: 'A5 flyer, back', w: 148, h: 210, u: MM, r: 1.5, bleed: 3, stock: '170 g gloss', colours: '4/4 CMYK', notes: 'Deals and the pizza list with all three sizes. Update prices before every print run.', out: ['pdf', 'png'] },
  { id: 'hanger', z: 'print', name: 'Door hanger', w: 100, h: 240, u: MM, r: -2, bleed: 3, stock: '350 g, die-cut hole Ø 34 mm', colours: '4/4 CMYK', notes: 'Hole centre 30 mm from the top; slit to the right edge.', out: ['pdf', 'png'] },
  { id: 'menu-out', z: 'print', name: 'Takeaway menu, outside', w: 297, h: 210, u: MM, r: .5, bleed: 3, stock: '150 g silk, roll fold to DL', colours: '4/4 CMYK', notes: 'Panels left to right: inside flap, back, cover. Fold marks at 97 and 197 mm (the flap is 2 mm narrower).', out: ['pdf', 'png'] },
  { id: 'menu-in', z: 'print', name: 'Takeaway menu, inside', w: 297, h: 210, u: MM, r: -.5, bleed: 3, stock: '150 g silk, roll fold to DL', colours: '4/4 CMYK', notes: 'Prices and allergens from the website data; check both before printing.', out: ['pdf', 'png'] },
  { id: 'poster', z: 'print', name: 'A3 poster', w: 297, h: 420, u: MM, r: 0, bleed: 3, stock: '200 g silk', colours: '4/0 CMYK', notes: 'For the shop window and the counter wall. Also prints at A2 and A1 (scale up, same layout).', out: ['pdf', 'png'] },
  { id: 'tent', z: 'print', name: 'Counter card', w: 100, h: 150, u: MM, r: 2.5, bleed: 3, stock: '350 g, folded tent', colours: '4/4 CMYK', notes: 'Stands next to the till. Print the same face on both sides of the fold.', out: ['pdf', 'png'] },
  { id: 'loyalty-front', z: 'print', name: 'Stamp card, front', w: 85, h: 55, u: MM, r: -2.5, bleed: 3, stock: '350 g uncoated (stampable)', colours: '4/4 CMYK', notes: 'The offer is a placeholder: decide the reward before printing.', out: ['pdf', 'png'] },
  { id: 'loyalty-back', z: 'print', name: 'Stamp card, back', w: 85, h: 55, u: MM, r: 1.5, bleed: 3, stock: '350 g uncoated (stampable)', colours: '4/4 CMYK', notes: 'Ten 9 mm stamp circles; use the round seal as the stamp.', out: ['pdf', 'png'] },
  { id: 'voucher', z: 'print', name: 'Gift voucher', w: 210, h: 99, u: MM, r: .8, bleed: 3, stock: '300 g uncoated', colours: '4/4 CMYK', notes: 'Value, code and date are written by hand at the till.', out: ['pdf', 'png'] },
  { id: 'letterhead', z: 'print', name: 'Letterhead', w: 210, h: 297, u: MM, r: -.8, bleed: 0, stock: '100 g office paper', colours: 'Office printer friendly', notes: 'German business letters need the full company details (owner, address, tax number) in the footer: placeholders.', out: ['pdf', 'png'] },
  { id: 'receipt', z: 'print', name: 'Order ticket', w: 80, h: 190, u: MM, r: -1.5, bleed: 0, stock: '80 mm thermal roll', colours: 'Black only', notes: 'For the till printer: logo as a one-colour bitmap, everything else as text.', out: ['pdf', 'png'] },
  { id: 'window', z: 'print', name: 'Opening hours decal', w: 300, h: 400, u: MM, r: 0, bleed: 0, stock: 'White cut vinyl, inside of the glass', colours: 'White (+ red cut vinyl for MAX)', notes: 'Mirror the cut file when it goes on the inside of the window.', out: ['pdf', 'png'] },
  // packaging
  { id: 'box-open', z: 'packaging', name: 'Pizza box, open', w: 330, h: 690, u: MM, r: -1, stock: 'Mockup', colours: '-', notes: 'How the box looks on the customer\'s table. The inside of the lid stays unprinted (food contact).', out: ['png'] },
  { id: 'box-lid', z: 'packaging', name: 'Box lid print', w: 330, h: 330, u: MM, r: 1, bleed: 5, stock: 'Brown kraft E-flute, food safe inks', colours: '2 spot colours: deep green, dark red', notes: 'Maxi 32 cm box (330 mm). Scale to 270 mm for Standard and 400 mm for Wumbo.', out: ['pdf', 'png'] },
  { id: 'box-side', z: 'packaging', name: 'Box side band', w: 330, h: 45, u: MM, r: 0, bleed: 3, stock: 'Brown kraft E-flute', colours: '1 spot colour: deep green', notes: 'Prints on all four sides; the arrow points to the lid opening.', out: ['pdf', 'png'] },
  { id: 'box-label', z: 'packaging', name: 'Box label', w: 70, h: 45, u: MM, r: -3, bleed: 0, stock: 'Thermal or blank sticker roll', colours: 'Black only', notes: 'Staff tick size, crust and name so the right box goes to the right door.', out: ['pdf', 'png'] },
  { id: 'seal-sticker', z: 'packaging', name: 'Box seal sticker', w: 50, h: 50, u: MM, r: 8, bleed: 2, stock: 'Round sticker, strong adhesive', colours: '4/0 CMYK', notes: 'Closes the lid on delivery boxes; tearing it shows the box was not opened.', out: ['pdf', 'png'] },
  { id: 'bag-delivery', z: 'packaging', name: 'Delivery bag', w: 450, h: 420, u: MM, r: 1.5, stock: 'Insulated bag, screen print', colours: 'White on deep green', notes: 'Print area 300 x 200 mm on the lid flap.', out: ['png'] },
  { id: 'bag-paper', z: 'packaging', name: 'Pickup bag', w: 260, h: 330, u: MM, r: -2, stock: 'Kraft paper bag with twisted handles', colours: '2 colours: deep green, dark red', notes: 'For drinks, desserts and pickup orders.', out: ['png'] },
  { id: 'cup', z: 'packaging', name: 'Drink cup', w: 136, h: 100, u: MM, size: 'Ø 90 mm, 115 mm tall', art: [118, 115], r: 0, stock: '0.4 l paper cup', colours: '2 colours: tomato red, basil green', notes: 'The wrap artwork repeats twice around the cup; the print file is one repeat.', out: ['png', 'art'] },
  { id: 'napkin', z: 'packaging', name: 'Napkin', w: 165, h: 165, u: MM, r: 3, stock: '33 x 33 cm napkin, quarter fold', colours: '1 colour: tomato red', notes: 'The corner print shows after folding.', out: ['png'] },
  // signage
  { id: 'fascia', z: 'signage', name: 'Shop sign', w: 3000, h: 600, u: MM, r: 0, stock: 'Aluminium composite, cut letters', colours: 'Deep green panel, white and red letters', notes: 'Measure the real fascia before ordering; the logo tab may hang 15 cm below the panel.', out: ['pdf', 'png'] },
  { id: 'aboard', z: 'signage', name: 'Pavement board', w: 600, h: 900, u: MM, r: -1, stock: 'Write-on board in a wooden A-frame', colours: 'Printed header, chalk marker below', notes: 'Header printed, the lower half stays blank for today\'s special in chalk marker.', out: ['pdf', 'png'] },
  { id: 'tv', z: 'signage', name: 'Menu screen', w: 1920, h: 1080, u: PX, phys: 950, r: 0, stock: 'Full HD screen above the counter (43 inch shown)', colours: 'Screen', notes: 'Show as a still or loop with the deal panel changing every 8 seconds.', out: ['png'] },
  { id: 'magnet', z: 'signage', name: 'Car door magnet', w: 500, h: 330, u: MM, r: 1, stock: 'Magnetic vehicle foil', colours: '4/0 CMYK', notes: 'Readable from 10 m: phone number at least 45 mm tall.', out: ['pdf', 'png'] },
  // wear
  { id: 'tee-front', z: 'wear', name: 'T-shirt, front', w: 560, h: 720, u: MM, art: [560, 720], r: -1, stock: 'Deep green cotton tee', colours: 'White and light green print', notes: 'Chest print 90 mm wide, left side. The print file is the artwork alone at true size.', out: ['png', 'art'] },
  { id: 'tee-back', z: 'wear', name: 'T-shirt, back', w: 560, h: 720, u: MM, art: [560, 720], r: 1.5, stock: 'Deep green cotton tee', colours: 'White and light green print', notes: 'Back print 280 mm wide, 80 mm below the collar.', out: ['png', 'art'] },
  { id: 'apron', z: 'wear', name: 'Apron', w: 600, h: 820, u: MM, art: [600, 820], r: -.5, stock: 'Bib apron, heavy cotton', colours: 'White print on deep green', notes: 'Print or embroider the logo 160 mm wide on the bib.', out: ['png', 'art'] },
  { id: 'cap', z: 'wear', name: 'Cap', w: 280, h: 260, u: MM, size: 'One size, 56–60 cm', art: [55, 55], r: 2, stock: 'Six-panel cotton cap', colours: 'Embroidered, white thread', notes: 'Front panel: the seal, 55 mm. The print file is the embroidery artwork.', out: ['png', 'art'] },
  { id: 'badge', z: 'wear', name: 'Name badge', w: 76, h: 25, u: MM, r: -2, stock: 'Printed badge with magnet', colours: '4/0', notes: 'Name in Plus Jakarta Sans, 6 mm caps.', out: ['pdf', 'png'] },
  // screens
  { id: 'ig-post', z: 'screens', name: 'Instagram post, square', w: 1080, h: 1080, u: PX, r: -1, stock: '1080 x 1080 px', colours: 'sRGB', notes: 'Hero pizza post. Keep text out of the outer 60 px.', out: ['png'] },
  { id: 'ig-deal', z: 'screens', name: 'Instagram post, deal', w: 1080, h: 1350, u: PX, r: 1, stock: '1080 x 1350 px (4:5)', colours: 'sRGB', notes: 'Deal posts show the price large and the old price struck.', out: ['png'] },
  { id: 'ig-story', z: 'screens', name: 'Story', w: 1080, h: 1920, u: PX, r: -.5, stock: '1080 x 1920 px (9:16)', colours: 'sRGB', notes: 'Keep text out of the top 250 px and the bottom 340 px (app controls).', out: ['png'] },
  { id: 'highlights', z: 'screens', name: 'Story highlight covers', w: 1600, h: 400, u: PX, r: 0, stock: '5 covers, 1080 x 1920 px each, circle-safe', colours: 'sRGB', notes: 'Menu, Deals, Oven, Delivery, Hours. Icon inside the centre 600 px circle.', out: ['png'] },
  { id: 'gbp-logo', z: 'screens', name: 'Profile picture', w: 720, h: 720, u: PX, r: 2, stock: '720 x 720 px', colours: 'sRGB', notes: 'For Google, Instagram, Facebook and delivery apps; shown as a circle.', out: ['png'] },
  { id: 'fb-cover', z: 'screens', name: 'Facebook cover', w: 1640, h: 624, u: PX, r: 0, stock: '1640 x 624 px', colours: 'sRGB', notes: 'Phones crop the sides: keep text in the centre 1100 px.', out: ['png'] },
  { id: 'gbp-cover', z: 'screens', name: 'Google profile cover', w: 1080, h: 608, u: PX, r: -1, stock: '1080 x 608 px', colours: 'sRGB', notes: 'Google crops it differently in search and maps: no text, just the food and the logo.', out: ['png'] },
  { id: 'app-banner', z: 'screens', name: 'Delivery app banner', w: 1500, h: 1000, u: PX, r: 1, stock: '1500 x 1000 px', colours: 'sRGB', notes: 'Delivery platforms place their own text and logo on top: keep it to food, planks and a small logo.', out: ['png'] },
  { id: 'og', z: 'screens', name: 'Link preview image', w: 1200, h: 630, u: PX, r: -.5, stock: '1200 x 630 px', colours: 'sRGB', notes: 'Shown when the website link is shared in chats and social posts.', out: ['png'] },
  { id: 'email', z: 'screens', name: 'Newsletter email', w: 600, h: 1200, u: PX, r: 1, stock: '600 px wide email', colours: 'sRGB', notes: 'Build it in your email tool with live text; this is the layout to copy. Unsubscribe link and imprint are required.', out: ['png'] },
  { id: 'sms', z: 'screens', name: 'Order confirmation message', w: 390, h: 760, u: PX, r: -1.5, stock: 'SMS / WhatsApp template', colours: '-', notes: 'Template text with {name}, {order}, {time} fields for the till or ordering system.', out: ['png'] },
];
const byId = Object.fromEntries(KIT.map((k) => [k.id, k]));
let current = null, returnTo = null, lifted = null, toastT;

// how thick each thing is when it lies on the table: it decides the shadow
const DEPTH = {
  card: ['logo', 'versions', 'wordmark', 'appicon', 'rules', 'colours', 'type', 'icons', 'materials', 'bc-front', 'bc-back', 'loyalty-front', 'loyalty-back', 'hanger', 'tent', 'voucher', 'magnet', 'badge'],
  thin: ['seal', 'stickers', 'receipt', 'box-label', 'seal-sticker', 'voice'],
  board: ['box-open', 'box-lid', 'box-side', 'bag-delivery', 'bag-paper', 'aboard'],
  cloth: ['tee-front', 'tee-back', 'apron', 'cap', 'cup', 'napkin'],
  vinyl: ['window'],
};
const depthOf = (k) => Object.keys(DEPTH).find((d) => DEPTH[d].includes(k.id)) || (k.u === PX ? 'screen' : 'paper');

// what the owner must replace before anything is printed
const PLACEHOLDERS = [
  ['Address', 'Wollankstr. 20, 13187 Berlin'],
  ['Phone', '030 123 456 78'],
  ['Website', 'pizzamax.berlin'],
  ['Social handle', '@pizzamax.berlin'],
  ['Email', 'hello@pizzamax.berlin'],
  ['Owner name, tax number', 'letterhead footer'],
  ['QR codes', 'every QR is a placeholder pattern'],
  ['Stamp card reward', 'decide the offer'],
  ['Staff names', 'badges and business cards'],
  ['Prices and deals', 'check against the website'],
];

/* ---------------------------------------------------------------- shared pieces */
// a placeholder QR (not scannable): finder squares and a deterministic module pattern
function qrSymbol() {
  const n = 25, cells = [];
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const finder = (x, y) => x < 7 && y < 7;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (finder(x, y) || finder(n - 1 - x, y) || finder(x, n - 1 - y)) continue;
    if (rnd() > .52) cells.push(`M${x + 2} ${y + 2}h1v1h-1z`);
  }
  const fp = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  return `<symbol id="qr" viewBox="0 0 29 29"><path fill-rule="evenodd" d="${fp(2, 2)}${fp(20, 2)}${fp(2, 20)}${cells.join('')}"/></symbol>`;
}
function sprite() {
  $('#sprite').insertAdjacentHTML('beforeend', qrSymbol());
}

// a material: the template's content inside a sized box (u = px per unit)
function material(id, art = false) {
  const k = byId[id], t = $(art ? `template[data-art="${id}"]` : `template[data-id="${id}"]`);
  const [w, h] = art ? k.art : [k.w, k.h];
  const m = document.createElement('div');
  m.className = art ? `m m-art art-${id}` : `m m-${id}`;
  m.style.setProperty('--w', w);
  m.style.setProperty('--h', h);
  if (t) m.append(uniqueIds(t.content.cloneNode(true)));
  return m;
}

// a template can be shown more than once; give each copy's ids (and the hrefs that point at them) a suffix
let copies = 0;
function uniqueIds(frag) {
  const els = [...frag.querySelectorAll('[id]')];
  if (!els.length) return frag;
  const n = ++copies;
  els.forEach((el) => {
    const old = el.id, now = `${old}-${n}`;
    el.id = now;
    frag.querySelectorAll(`[href="#${old}"]`).forEach((r) => r.setAttribute('href', `#${now}`));
  });
  return frag;
}
const ratio = (k) => k.w / k.h;
function dims(k) { return k.size || (k.u === PX ? `${k.w} × ${k.h} px` : k.w >= 1000 ? `${k.w / 1000} × ${k.h / 1000} m` : `${k.w} × ${k.h} mm`); }

/* ---------------------------------------------------------------- export, print */
const params = new URLSearchParams(location.search);
const alone = (m) => document.body.replaceChildren(...$$('#sprite, #sprite2'), m);
if (params.has('export') || params.has('art')) {
  // ?export=<id>&scale=: the material alone, top-left, for headless capture; ?art=<id>: its print artwork alone
  sprite();
  const art = params.has('art'), id = params.get(art ? 'art' : 'export'), k = byId[id];
  document.documentElement.classList.add('is-export');
  const m = material(id, art);
  const scale = +(params.get('scale') || (k.u === PX ? 1 : 300 / 25.4));
  m.style.setProperty('--u', `${scale}px`);
  alone(m);
  document.title = `${id}${art ? ' print' : ''} ${scale}`;
} else if (params.has('print')) {
  // ?print=<id>: the material alone at true size, with its bleed and crop marks, for printing to PDF
  sprite();
  document.documentElement.classList.add('is-print-only');
  const k = byId[params.get('print')];
  alone(press(k));
  pageSize(k);
} else {
  sprite();
  buildTable();
}

// the sheet that goes to the printer: trim + bleed + room for crop marks. The bleed is a slightly enlarged
// copy of the material behind it, so edge colours and pictures run on past the trim.
function sheet(k) { const b = k.u === MM ? (k.bleed || 0) : 0, o = b ? b + SLUG : 0; return { b, o, W: k.w + 2 * o, H: k.h + 2 * o }; }
function press(k) {
  const { b, o, W, H } = sheet(k);
  const p = document.createElement('div');
  p.className = 'press';
  p.style.cssText = `width:${W}mm;height:${H}mm`;
  const m = material(k.id);
  m.style.setProperty('--u', '1mm');
  if (b) {
    const fill = material(k.id);
    fill.classList.add('bleed-fill');
    fill.setAttribute('aria-hidden', 'true');
    fill.style.setProperty('--u', '1mm');
    fill.style.cssText += `;left:${o}mm;top:${o}mm;transform:scale(${(k.w + 2 * b) / k.w},${(k.h + 2 * b) / k.h})`;
    p.append(fill);
  }
  m.style.cssText += `;left:${o}mm;top:${o}mm`;
  p.append(m);
  if (b) {
    // crop marks: 5 mm hairlines starting 1 mm beyond the bleed, in line with the trim
    const x1 = o, x2 = o + k.w, y1 = o, y2 = o + k.h, s = b + 1, e = s + 5, L = [];
    for (const x of [x1, x2]) L.push([x, y1 - e, x, y1 - s], [x, y2 + s, x, y2 + e]);
    for (const y of [y1, y2]) L.push([x1 - e, y, x1 - s, y], [x2 + s, y, x2 + e, y]);
    p.insertAdjacentHTML('beforeend', `<svg class="marks" viewBox="0 0 ${W} ${H}" aria-hidden="true">${L.map(([a, c, d, f]) => `<line x1="${a}" y1="${c}" x2="${d}" y2="${f}"/>`).join('')}</svg>
      <p class="slug">PIZZA MAX · ${k.name} · trim ${k.w} × ${k.h} mm · bleed ${b} mm · ${k.stock}</p>`);
  }
  return p;
}
function pageSize(k) {
  let st = $('#pageSize');
  if (!st) { st = document.createElement('style'); st.id = 'pageSize'; document.head.append(st); }
  const { W, H } = sheet(k);
  st.textContent = `@page { size: ${W}mm ${H}mm; margin: 0; }`;
}

/* ---------------------------------------------------------------- the table */
function fit(obj) {
  const k = byId[obj.dataset.id], box = obj.querySelector('.m'), frame = obj.querySelector('.obj-frame');
  const cs = getComputedStyle(frame);
  const w = frame.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (w > 0) box.style.setProperty('--u', `${w / k.w}px`);
}
function opener(k) {
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'obj-open';
  open.setAttribute('aria-label', `Open ${k.name}, ${dims(k)}`);
  open.addEventListener('click', () => openSpec(k.id, open));
  return open;
}
function objectEl(k, opts = {}) {
  const fig = document.createElement('figure');
  fig.className = `obj d-${depthOf(k)}`;
  fig.dataset.id = k.id;
  fig.style.setProperty('--r', `${opts.r ?? k.r}deg`);
  fig.style.setProperty('--ar', ratio(k));
  const frame = document.createElement('div');
  frame.className = 'obj-frame';
  frame.append(material(k.id));
  fig.append(frame, opener(k));
  if (opts.caption !== false) {
    const cap = document.createElement('figcaption');
    cap.innerHTML = `<span>${k.name}</span><span class="num">${dims(k)}</span>`;
    fig.append(cap);
  }
  return fig;
}
function pileEl(p) {
  const fig = document.createElement('figure');
  fig.className = 'pile';
  const bed = document.createElement('div');
  bed.className = 'pile-bed';
  p.ids.forEach((id, i) => {
    const o = objectEl(byId[id], { r: p.at[i][2], caption: false });
    o.dataset.at = i;
    bed.append(o);
  });
  fig.append(bed);
  fig.insertAdjacentHTML('beforeend', `<figcaption><span>${p.name}</span><span class="num">${p.dims}</span></figcaption>`);
  fig.pile = p;
  return fig;
}

// lay one group out: every piece at the group's true scale, packed onto the table lowest-first, left-first
function layoutZone(sec) {
  const z = ZONES.find((x) => x.id === sec.id), spread = $('.spread', sec);
  const W = spread.clientWidth;
  if (!W) return;
  spread.dataset.w = W;
  const s = W / (W >= 700 ? z.across : z.acrossSm);   // px per unit on this table
  const span = (k) => (k.phys || k.w);
  const units = [...spread.children];
  for (const u of units) {
    if (u.pile) {
      const p = u.pile, ks = p.ids.map((id) => byId[id]);
      const x0 = Math.min(...p.at.map((a) => a[0])), y0 = Math.min(...p.at.map((a) => a[1]));
      const x1 = Math.max(...ks.map((k, i) => p.at[i][0] + span(k))), y1 = Math.max(...ks.map((k, i) => p.at[i][1] + span(k) / ratio(k)));
      const f = Math.min(1, W / ((x1 - x0) * s));
      $$('.obj', u).forEach((o) => {
        const k = byId[o.dataset.id], a = p.at[+o.dataset.at];
        o.style.left = `${(a[0] - x0) * s * f}px`;
        o.style.top = `${(a[1] - y0) * s * f}px`;
        o.style.width = `${span(k) * s * f}px`;
      });
      $('.pile-bed', u).style.cssText = `width:${(x1 - x0) * s * f}px;height:${(y1 - y0) * s * f}px`;
      u.style.width = `${(x1 - x0) * s * f}px`;
    } else {
      const k = byId[u.dataset.id];
      let w = span(k) * s;
      const cap = $('figcaption', u);
      $('.scale', cap)?.remove();
      if (w > W) {
        cap.insertAdjacentHTML('beforeend', `<span class="scale">shown smaller, 1 : ${(w / W).toFixed(1).replace('.0', '')} against the rest</span>`);
        w = W;
      }
      u.style.width = `${w}px`;
    }
  }
  $$('.obj', spread).forEach(fit);
  // bottom-left fill: each piece takes the highest free spot, then the leftmost, so small pieces drop into
  // the gaps under their shorter neighbours instead of leaving holes in the table
  const gap = W >= 700 ? 34 : 20, rects = [];
  const fits = (x, y, w, h) => x + w - gap <= W + .5 && rects.every((r) => x >= r.x + r.w || x + w <= r.x || y >= r.y + r.h || y + h <= r.y);
  const placed = units.map((u) => {
    const fw = Math.max(u.offsetWidth, u.querySelector(':scope > figcaption')?.offsetWidth || 0);   // a caption may be wider than a small piece
    const w = Math.min(W, fw) + gap, h = u.offsetHeight + gap;
    const xs = [0, ...rects.map((r) => r.x + r.w)], ys = [0, ...rects.map((r) => r.y + r.h)].sort((a, b) => a - b);
    let best = null;
    for (const y of ys) {
      for (const x of xs) if (fits(x, y, w, h) && (!best || x < best.x)) best = { x, y };
      if (best) break;
    }
    best ||= { x: 0, y: Math.max(0, ...rects.map((r) => r.y + r.h)) };
    rects.push({ ...best, w, h });
    u.style.left = `${best.x}px`;
    u.style.top = `${best.y}px`;
    return { u, x: best.x, y: best.y };
  });
  spread.style.height = `${Math.max(...rects.map((r) => r.y + r.h)) - gap}px`;
  // the tab order follows what the eye sees: top to bottom, then left to right
  placed.sort((a, b) => (Math.abs(a.y - b.y) < 60 ? a.x - b.x : a.y - b.y)).forEach(({ u }) => spread.append(u));
}

function buildTable() {
  // the order ticket: a line per group with its count
  $('#ticketLines').innerHTML = ZONES.map((z) => {
    const n = KIT.filter((k) => k.z === z.id).length;
    return `<li><a href="#${z.id}" data-zone="${z.id}"><span class="q num">${n}×</span><span class="t">${z.tape}</span></a></li>`;
  }).join('');
  $('#ticketTotal').textContent = KIT.length;
  $('#placeholders').innerHTML = PLACEHOLDERS.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('');

  // the hero spread on the counter
  $$('#hero [data-place]').forEach((slot) => {
    const k = byId[slot.dataset.place];
    const o = objectEl(k, { r: +slot.dataset.r || 0, caption: false });
    if (slot.classList.contains('phone')) phoneUi(o);
    slot.append(o);
  });

  // one table zone per group, piles first in the place of their first piece
  const table = $('#zones');
  ZONES.forEach((z) => {
    const sec = document.createElement('section');
    sec.className = `zone zone-${z.id}`;
    sec.id = z.id;
    sec.setAttribute('aria-labelledby', `${z.id}-t`);
    const items = KIT.filter((k) => k.z === z.id);
    sec.innerHTML = `<header class="zone-head"><h2 class="tape" id="${z.id}-t">${z.tape}</h2><p>${z.line} · ${items.length} items</p></header><div class="spread"></div>`;
    const spread = $('.spread', sec), piled = new Set();
    items.forEach((k) => {
      if (piled.has(k.id)) return;
      const p = (z.piles || []).find((x) => x.ids.includes(k.id));
      if (p) { p.ids.forEach((id) => piled.add(id)); spread.append(pileEl(p)); } else spread.append(objectEl(k));
    });
    table.append(sec);
  });

  // size and pack now (layout is synchronous), again once the fonts are in, and whenever the table width changes
  const relayout = () => $$('.zone').forEach(layoutZone);
  $$('#hero .obj').forEach(fit);
  relayout();
  document.fonts?.ready.then(relayout);
  const ro = new ResizeObserver((ents) => ents.forEach((en) => {
    const sp = en.target;
    if (sp.classList.contains('spread')) { if (+sp.dataset.w !== sp.clientWidth) layoutZone(sp.closest('.zone')); } else fit(sp.closest('.obj'));
  }));
  $$('.spread, #hero .obj-frame').forEach((el) => ro.observe(el));
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { $$('#hero .obj').forEach(fit); relayout(); }, 80); });

  // the ticket marks the group you are looking at
  const links = $$('#ticketLines a');
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.toggleAttribute('aria-current', a.dataset.zone === en.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  $$('.zone').forEach((z) => io.observe(z));

  // the spec view
  $('#specClose').addEventListener('click', () => $('#spec').close());
  $('#spec').addEventListener('click', (e) => { if (e.target === $('#spec')) $('#spec').close(); });
  $('#spec').addEventListener('close', () => {
    current = null;
    if (lifted) { lifted.classList.remove('is-lifted'); lifted = null; }
    returnTo?.focus();
  });
  $('#specPrint').addEventListener('click', () => current && printOne(current));
  addEventListener('resize', () => current && sizeSpec());
  // colour chips copy their HEX
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-copy]');
    if (!c || !navigator.clipboard) return;
    navigator.clipboard.writeText(c.dataset.copy).then(() => toast(`${c.dataset.copy} copied`), () => {});
  });
}

// the phone on the counter shows the post the way Instagram frames it
function phoneUi(o) {
  const frame = $('.obj-frame', o), m = $('.m', frame);
  const scr = document.createElement('div');
  scr.className = 'scr';
  scr.innerHTML = `<p class="scr-top"><span class="scr-av"></span><b>pizzamax.berlin</b><span class="scr-dots">···</span></p>`;
  scr.append(m);
  scr.insertAdjacentHTML('beforeend', `<p class="scr-acts"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.7 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/></svg><svg viewBox="0 0 24 24"><path d="M21 3 3 10l7 3 3 7z"/></svg><svg class="scr-save" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg></p>
    <p class="scr-cap"><b>pizzamax.berlin</b> Veggie Garden, straight from the stone oven.</p>`);
  frame.append(scr);
}

function openSpec(id, from) {
  const k = byId[id];
  current = id; returnTo = from;
  const stage = $('#specStage');
  stage.replaceChildren(material(id));
  $('#specName').textContent = k.name;
  const rows = [
    ['Size', dims(k)],
    ...(k.u === MM && k.bleed ? [['Bleed', `${k.bleed} mm on every side. The PDF carries the bleed and crop marks: trim on the marks.`]] : []),
    ['Stock', k.stock],
    ['Colours', k.colours],
    ['Group', ZONES.find((z) => z.id === k.z).tape],
  ];
  $('#specRows').innerHTML = rows.map(([a, b]) => `<li class="${b.length <= 26 ? 'short' : ''}"><span>${a}</span><span class="lead"></span><b>${b}</b></li>`).join('');
  $('#specNotes').textContent = k.notes;
  const label = { pdf: 'PDF', png: 'PNG', art: 'PRINT FILE' };
  const files = (k.out || []).map((f) => {
    const file = f === 'art' ? `${id}-print.png` : `${id}.${f}`;
    return `<a class="file" href="export/${file}" download>${label[f]}<span>${file}</span></a>`;
  });
  $('#specFiles').innerHTML = files.join('') || '<span class="none">Mockup only</span>';
  $('#specPrint').hidden = !(k.u === MM && (k.out || []).includes('pdf'));
  // the object lifts off the table and lands on the stage
  const src = from?.closest('.obj')?.querySelector('.m');
  const r0 = src?.getBoundingClientRect();
  $('#spec').showModal();
  sizeSpec();
  const m = $('.m', stage), r1 = m.getBoundingClientRect();
  if (r0 && r0.width && !reduced) {
    lifted = from.closest('.obj');
    lifted.classList.add('is-lifted');
    const turn = parseFloat(getComputedStyle(lifted).getPropertyValue('--r')) || 0;
    m.animate([
      { transform: `translate(${r0.left - r1.left}px, ${r0.top - r1.top}px) rotate(${turn}deg) scale(${r0.width / r1.width})`, transformOrigin: '0 0' },
      { transform: 'none', transformOrigin: '0 0' },
    ], { duration: 520, easing: 'cubic-bezier(.16, 1, .3, 1)' });
  }
}
function sizeSpec() {
  const k = byId[current], stage = $('#specStage'), m = $('.m', stage);
  const u = Math.min(stage.clientWidth / k.w, stage.clientHeight / k.h);
  m.style.setProperty('--u', `${u}px`);
}

// print one material at true size: it alone on the page, with its bleed and crop marks
function printOne(id) {
  const k = byId[id];
  const root = $('#printRoot');
  root.replaceChildren(press(k));
  pageSize(k);
  document.documentElement.classList.add('is-printing');
  const done = () => { document.documentElement.classList.remove('is-printing'); root.replaceChildren(); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  print();
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 1800);
}
