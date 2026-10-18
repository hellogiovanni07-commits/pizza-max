---
name: Pizza Max
description: A Berlin-Pankow stone-oven pizzeria whose website, box, print and screens all lie on the same white-plank counter.
colors:
  tomato: "#c62f26"
  ripe-tomato: "#a3231c"
  basil: "#43a047"
  deep-basil: "#2e7d32"
  pine: "#1d5d22"
  basil-text: "#256628"
  kraft: "#c9a670"
  kraft-hi: "#dcbd8b"
  kraft-light: "#e3c99c"
  kraft-floor: "#ead3ab"
  kraft-edge: "#d9bd8e"
  kraft-dark: "#a9834c"
  kraft-ink: "#2c1f0e"
  oven-gold: "#ffcf6e"
  flour-white: "#f7f6f3"
  surface-white: "#ffffff"
  thermal: "#fcfbf8"
  ink: "#1f1f1f"
  body-text: "#3a3a3a"
  muted: "#5f5f5f"
  line: "#e6e2dc"
  leader: "#b5afa5"
  control: "#8f897f"
  chip: "#f1eee8"
  basil-tint: "#eef7ee"
  tomato-tint: "#fdebea"
  disabled-bg: "#d9d4cc"
  disabled-ink: "#5a544b"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 4.6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  product-name:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.12em"
  price:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.1
    fontFeature: "tnum"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    letterSpacing: "0.14em"
  button:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    letterSpacing: "0.01em"
  hand:
    fontFamily: "Caveat, Segoe Print, cursive"
    fontSize: "1.7rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  tag: "4px"
  tab: "6px"
  control: "8px"
  segment: "10px"
  panel: "14px"
  card: "16px"
  pill: "999px"
spacing:
  control-gap: "8px"
  gutter-phone: "16px"
  gutter: "20px"
  grid-gap: "24px"
  section-head: "32px"
  section-phone: "60px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.surface-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
    height: "44px"
  button-primary-large:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.control}"
    padding: "14px 28px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.ripe-tomato}"
  button-primary-added:
    backgroundColor: "{colors.deep-basil}"
    textColor: "{colors.surface-white}"
  button-primary-disabled:
    backgroundColor: "{colors.disabled-bg}"
    textColor: "{colors.disabled-ink}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface-white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
    height: "44px"
  button-ghost:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
    height: "44px"
  button-light:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.pine}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 22px"
    height: "44px"
  button-mini:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    height: "44px"
  box-quick-add:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    size: "44px"
  size-segment:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.muted}"
    rounded: "{rounded.segment}"
    padding: "4px"
    height: "44px"
  size-segment-order:
    backgroundColor: "{colors.chip}"
    textColor: "{colors.body-text}"
    rounded: "{rounded.segment}"
    padding: "4px"
    height: "64px"
  size-segment-selected:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.tomato}"
    rounded: "{rounded.control}"
  filter-pill:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.body-text}"
    typography: "{typography.body-small}"
    rounded: "{rounded.pill}"
    padding: "6px 18px"
    height: "44px"
  filter-pill-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface-white}"
  diet-pill-veg:
    backgroundColor: "{colors.basil-tint}"
    textColor: "{colors.basil-text}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  diet-pill-hot:
    backgroundColor: "{colors.tomato-tint}"
    textColor: "{colors.ripe-tomato}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  sticker:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.surface-white}"
    typography: "{typography.hand}"
    rounded: "{rounded.tag}"
    padding: "0 10px 2px"
  today-ticket:
    backgroundColor: "{colors.thermal}"
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    padding: "20px 20px 24px"
    width: "410px"
  deal-lid:
    backgroundColor: "{colors.kraft}"
    textColor: "{colors.kraft-ink}"
    rounded: "{rounded.tab}"
    padding: "24px 22px 20px"
  deal-ticket:
    backgroundColor: "{colors.thermal}"
    textColor: "{colors.ink}"
    typography: "{typography.price}"
    padding: "14px 16px 18px"
  menu-box:
    backgroundColor: "{colors.kraft-floor}"
    textColor: "{colors.body-text}"
    rounded: "{rounded.tab}"
  cant-decide-box:
    backgroundColor: "{colors.kraft}"
    textColor: "{colors.kraft-ink}"
    rounded: "{rounded.control}"
    padding: "30px 26px"
  pizza-sheet:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.body-text}"
    rounded: "{rounded.card}"
    padding: "12px 18px 18px"
  input-field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "48px"
  logo-tab:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.tab}"
    padding: "10px 12px"
    width: "160px"
  top-bar:
    backgroundColor: "{colors.deep-basil}"
    textColor: "{colors.surface-white}"
    height: "40px"
  footer:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.basil-tint}"
  cart-button:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    size: "58px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.segment}"
    padding: "10px 12px 10px 18px"
  order-ticket:
    backgroundColor: "{colors.thermal}"
    textColor: "{colors.ink}"
    padding: "26px 20px 30px"
    width: "290px"
---

# Design System: Pizza Max

## Overview

**Creative North Star: "The White-Plank Counter"**

Every Pizza Max surface is the shop counter seen from above. White-painted wood planks are the ground. Real things lie on them, each casting a soft, warm shadow: the shop's thermal order ticket, kraft box lids, open boxes holding the shop's own pizzas, a flyer, a phone. Green frames the scene, red marks what you act on or pay, kraft is the box, thermal paper carries the facts. The website (`index.html`) is that counter at phone size, built to get a hungry visitor from "I want pizza" to an order. The brand kit (`brand/index.html`) is the same counter at true print size. It holds 57 materials across identity, print, packaging, signage, team wear and screens, laid out at true relative scale. Both read the same colours, the same plank recipe, the same three self-hosted fonts and the same Blender renders.

The personality is a neighbourhood shop proud of its oven, not a chain. A bold italic "MAX" carries the name, product and deal names are letter-spaced capitals like a menu board, and Inter carries everything people read. Handwriting is rare and therefore warm: "pull a slice!", a "Bestseller" sticker, "Thanks, Name!" when an order is placed. The food leads, always as the shop's own renders: in open kraft boxes for the menu and the deals, to scale on the size ruler, live in 3D in the hero. Density is medium. One product block (render, name, ingredients, allergens, size, add) repeats across three menu views, and the first screen answers the hungry questions on a printed ticket.

On the surface, the voice is short, warm, plain English (and plain German), true and checkable: "Stone-oven pizza for Pankow.", "Minimum order €15, no delivery fee.", "order ahead, from 12:30 today". Its own words are stone oven, 24-hour dough, sauce from our own pot, Standard / Maxi / Wumbo, pull a slice. Savings are worked out from real prices ("separately €36.70 · you save €6.80" on the Duo), never shown as a bare percentage. Confirmed rejections: stock photos or anyone else's pizza; made-up reviews, ratings, awards, founding years, "best in Berlin" claims or oven statistics nobody has checked; shouting capitals with exclamation marks; a centred section title over a grey rule. Unknown business details stay visibly marked as placeholders.

**Key Characteristics:**
- White-painted planks as the one ground (the same recipe on the website and the kit table), with real stocks lying on top: thermal paper, kraft board, white card, pine cloth.
- Basil greens frame (bars, footer, focus, selection); tomato marks the order action and little else; kraft is packaging; thermal paper carries prices and facts in black.
- Plus Jakarta Sans for the shop's voice (italic 800 logo, letter-spaced caps for product names, spaced-caps labels), Inter for reading, Caveat for a handful of handwritten words.
- The shop's own renders only: top view inside boxes, on the size ruler and the wheel; one live 3D pizza in the hero.
- Soft, warm, downward shadows sized to each material's thickness; things lift a few pixels and straighten when touched.
- One authored motion moment per first visit (lift the lid of the box); everything else is direct feedback, and nothing moves under reduced motion.
- One unit is 1 mm in print and 1 px on screen: every kit material is drawn once, prints at true size with bleed and crop marks, and lies on the table at true relative scale.

## Colors

The shop's own kitchen palette: basil greens and tomato reds on flour-white planks, a family of kraft browns for the box, thermal white for tickets, ink for reading.

### Primary
- **Tomato** (#c62f26): the order action ("Order now", "Add to basket · €13.20", "Choose & add", "Place order"), the round cart button, the phone order bar, the red "+" on each box row on phones, "MAX" in the logo, the favicon and app icon ground, the "Bestseller" sticker, "pull a slice!", the phone number in Contact, today's row in the opening hours, the selected size name and the selected menu tab underline. 5.5:1 on white: works as text at any size and behind white text.
- **Ripe Tomato** (#a3231c): hover and pressed red; red text on tinted grounds (the spicy pill, form errors, "minimum not reached"); "MAX" printed on kraft (menu box lids, the box lid print, the pickup bag, the 3D box). 7.5:1 on white.

### Secondary
- **Basil** (#43a047): the logo green ("Pizza", the double swoosh) and thin accents: the nav underline, the 2px rule under menu categories, flyer heading underlines, the letterhead foot rule. 3.3:1 on white: logo, large display and non-text marks only.
- **Deep Basil** (#2e7d32): the framing green. Website top bar, delivery band, basket header, the "Added" state of buttons, the focus ring, checkbox accent, the "open now" dot on the today ticket, browser theme colour. White on it reaches 5.1:1.
- **Pine** (#1d5d22): the darkest green. Website footer, deal names and the inset print line on the kraft deal lids, "Pizza" on box lids, and in the kit the bars across flyers, posters and the menu screen, the shop sign, team wear, the delivery bag and the reversed-logo ground. White on pine reaches 7.9:1.
- **Basil Text** (#256628): green whenever green is text: links, success messages, the veggie pill, menu category titles, the "Also on the menu" hover. 7.0:1 on white.

### Tertiary
- **Kraft** (#c9a670): corrugated board. **Kraft Hi** (#dcbd8b) is the lit corner of a lid, so a lid is a gradient from the hi corner into kraft with a fibre grain over it. **Kraft Light** (#e3c99c) is the inside of a lid and the kit's slip. **Kraft Floor** (#ead3ab) with a **Kraft Edge** (#d9bd8e) rim is the inside of an open box where a pizza sits. **Kraft Dark** (#a9834c) draws the dashed stamp circles on the stamp card.
- **Kraft Ink** (#2c1f0e): small text on kraft (deal contents, the "can't decide" copy), 7.0:1 on kraft. Pine and ripe tomato sit on kraft only at logo and display sizes (3.5:1 and 3.3:1); white never does.
- **Oven Gold** (#ffcf6e): kit stickers only, with ink text: "New!" on the sticker sheet and the round sticker on the green Instagram deal post. The website still defines it (`--intro-gold`) but no longer uses it.

### Neutral
- **Flour White** (#f7f6f3): the plank ground: page background under the plank texture, the allergen strip, the deal chooser panel, the kit's guide cards.
- **Surface White** (#ffffff): the sticky header, the menu band's controls, contact band, every control, the hanging logo tab, the pizza sheet.
- **Thermal** (#fcfbf8): thermal paper: the hero's "Pizza Max today" ticket, the price stub on every deal, the kit's order and spec tickets, the till receipt.
- **Ink** (#1f1f1f): headings including the hero headline, product names, prices, the selected filter, the ink "Check" button, the open deal's ring, toasts, the placeholder tag. 16.5:1 on white.
- **Body Text** (#3a3a3a): running text. **Muted** (#5f5f5f): secondary text, struck "separately" prices, allergen lines, captions, section labels (6.4:1).
- **Line** (#e6e2dc): hairlines, list dividers. **Leader** (#b5afa5): the dotted leaders joining a name to its value. **Control** (#8f897f): borders of inputs, chips, ghost and round buttons, at 3.5:1, the non-text contrast floor. **Chip** (#f1eee8): the segmented control track and hover fills.
- **Basil Tint** (#eef7ee) and **Tomato Tint** (#fdebea): diet pill grounds; basil tint is also body copy on the green band and the footer base.
- **Disabled** (#d9d4cc ground with #5a544b ink): unavailable buttons.

### Named Rules
**The Mostly-Planks Rule.** By area a layout is roughly 58% flour white, 16% green, 12% tomato, 9% kraft and 5% ink (the kit's colour card). The planks carry everything; green frames, red points.

**The Red-Is-What-You-Do Rule.** Tomato goes on what you act on (order, add, choose, call) and on the one handwritten note or sticker pointing at a pizza. Prices are ink. A red that points at nothing is a mistake.

**The Thermal-Prints-Black Rule.** Whatever is printed on thermal paper is ink and muted only: ticket lines, leaders, totals, prices. On screen, a live control or status may sit on the paper (the red "Choose & add" on a deal stub, the green or red open dot on the today ticket); the printed matter around it stays black.

**The Text-on-Colour Rule.** White text sits on tomato, ripe tomato, deep basil, pine and ink. Basil is never a text ground and never body-size text. On kraft use kraft ink for small type and pine or ripe tomato for names and the logo, never white. Green text is always Basil Text.

## Typography

**Display Font:** Plus Jakarta Sans (500 to 800 and italic 800; fallback Inter, system-ui, sans-serif)
**Body Font:** Inter (400 to 600; fallback system-ui, sans-serif)
**Handwritten Font:** Caveat (600 to 700; fallback Segoe Print, cursive)

All three are self-hosted latin subsets in `fonts/` (woff2, variable weights), with the display and body files preloaded. No font request leaves the site. The pairing is client-mandated.

**Character:** A confident, slightly wide geometric sans speaks for the shop; a quiet workhorse carries everything people read; a marker hand adds a few warm words. The logo's italic 800 is the only italic in the system.

### Hierarchy
- **Display** (Plus Jakarta Sans 800, clamp(2.8rem, 4.6vw, 4.5rem), line-height 1, -0.035em, at most 12ch): the hero headline only, one sentence in ink ("Stone-oven pizza for Pankow."). Phones: clamp(2.4rem, 10.4vw, 3.2rem). In print the same treatment runs from 28 to 72 pt.
- **Headline** (Plus Jakarta Sans 800, clamp(2rem, 4vw, 2.75rem), 1.1, -0.02em): section titles, always left aligned ("Deals", "Our menu", "Give us a call", the delivery headline in white on green).
- **Title** (Plus Jakarta Sans 800, 1.3 to 1.5rem, 1.2, -0.01em): panel and dialog headings (deal chooser, "Can't decide?", review slot, kit spec ticket), basket totals.
- **Product Name** (Plus Jakarta Sans 700, 1.3rem, 1.25, +0.12em, uppercase): pizza names in the boxes, the wheel detail, the pizza sheet (+0.1em), menus and the menu screen. Deal names on kraft lids are the same face at 800 and +0.16em in pine. 11 to 14 pt in print.
- **Price** (Plus Jakarta Sans 800, 1.75rem, 1.1, tabular figures, ink): the deal price on its thermal stub; basket totals at 1.5rem. List prices are Plus Jakarta Sans 700 at body size. Inside a size segment the price is Inter, tabular.
- **Body** (Inter 400, 1rem, 1.6): running copy, kept to 38 to 62ch. 9 to 11 pt in print.
- **Body Small** (Inter 400, 0.9375rem, 1.6): ingredients, deal contents, ticket rows, notes. 0.875rem is the floor for anything that carries information (allergens, the "separately · you save" line, labels); 7 pt is the print floor.
- **Label** (Plus Jakarta Sans 700 to 800, 0.875rem, +0.12 to +0.14em, uppercase): short labels that name a block: "Pizza Max today" on the ticket, "Our delivery area" on the green band, "Also on the menu", "Show as" and "Filter", the allergen key title. Top-bar links use +0.06em.
- **Button** (Plus Jakarta Sans 700, 0.9375rem, +0.01em; 1rem on large buttons).
- **Hand** (Caveat 700, about 1.7rem, line-height 1): on screen only "pull a slice!" beside the 3D pizza, the "Bestseller" sticker (1.1rem), the logo tagline "...tasty in the box!", "Thanks, Name!" after an order, and the intro's "lift the lid!" and "...tasty in the box!". Always slightly rotated or bobbing, never a heading.

The logo lettering (Plus Jakarta Sans italic 800, "MAX" at -0.03em) is artwork, not a type style: never set other words in it.

### Named Rules
**The Menu-Board Caps Rule.** Product and deal names (MARGHERITA DELUXE, SOLO, DUO, PARTY) are Plus Jakarta Sans capitals spaced +0.12em (+0.16em for deal names on kraft; +0.08 to +0.1em on category heads, print tables and narrow rows). Headlines are never spaced caps: they are sentence case with tight tracking.

**The Few-Words-by-Hand Rule.** Caveat is the owner's hand, so it appears only where a person would write: the tagline, one note beside the pizza, a sticker, a thank-you. Section asides, area names and list headings are Plus Jakarta Sans labels. A price, allergen, opening time or delivery condition is never in Caveat.

**The Tabular Rule.** Every number people compare (prices, totals, sizes, postcodes, counts, dates, opening hours) uses tabular figures.

## Layout

The website is a stack of full-bleed bands on the planks, inside a centred container of min(1180px, 100% − 40px) (100% − 32px under 560px). Bands alternate by job: planks for the hero and the menu, white for deals and contact, deep basil for the delivery area, pine for the footer, flour white for the allergen key. Bands breathe 72 to 88px top and bottom (56 to 64px on phones). Every section head puts the title on the left with something useful beside it: a one-line Inter sentence ("Every deal comes in our boxes, and you choose the pizzas that go in them.") or the size ruler. The head sits 32px above the content.

The hero is the counter in three columns (copy .78fr, the 3D pizza 1.25fr, today's ticket .75fr, at least 340px). The copy block (headline, a one-sentence lead, one large red button) sits a little above the pizza's centre, so the air above the headline and under the button reads even and the headline clears the pizza's widest part; it leans into the board's empty corner, while the lead stays inside its column. Today's ticket lies at the foot of the right column, across the front edge of two closed Pizza Max boxes (the printed lid facing up), so the right column reads as one stack from box to ticket. The canvas may run 16% wider than its column so a pulled slice has room. Under 1260px the headline runs across the top with the pizza and the ticket beside it below, and the boxes leave; under 980px it stacks. Deals are three equal kraft lids with 28px gaps. The menu's boxes view is four columns with 44px row and 24px column gaps; it drops to three under 1100px and two under 820px.

Responsive behaviour is a set of real re-layouts, not shrinking:
- **980px:** the nav collapses behind a toggle, the logo tab shrinks to 132px, the hero stacks, deals go one column (three across between 700 and 980px so the chooser opens right under them), the size ruler moves under the title.
- **560px:** each menu box becomes a row (an 84px open box seen from above, the name and ingredients, "from €8.50" over a red "+" that opens the pizza sheet); deals become a swipe row of 86% lids in menu order with dots beneath; menu tabs and filters scroll in one row; the floating cart button gives way to a full-width red order bar; the basket and the pizza sheet become bottom sheets. From 981px up the basket is a full-height 420px drawer.
- Every control is at least 44 × 44px; text inputs are 44 to 48px tall; size segments in an order block 64px; large buttons 52px.

The kit lays a 290px sticky order ticket beside the table (up to 1560px wide). Each group lies at its own true scale: a group's width on the table stands for 1000 mm (identity, print), 1500 mm (packaging), 2100 mm (wear), 3000 mm (signage) or 4400 px (screens), less on phones. The pieces are packed bottom-left (each takes the highest free spot, then the leftmost) so small things fill the gaps. Things that belong together lie in piles: business and stamp cards, the box lid with its label and seal, the cup on a napkin, the apron with a name badge. A piece too big for the table says so in its caption ("shown smaller, 1 : 1.4 against the rest"). Under 900px the ticket becomes a compact strip of pill links above the counter.

### Named Rules
**The Unit Rule.** Kit materials are drawn once, in units: inside a material 1em is one unit and `--u` is that unit in pixels. One unit is 1 mm for print materials and 1 px for screen materials, so 3.2em of text is 3.2 mm (about 9 pt). On the table `--u` follows the group's scale. "Print at true size" sets `--u` to 1mm on a press sheet: the trim, a slightly enlarged copy behind it as the bleed (3 mm; 5 mm on the box lid, 2 mm on the seal sticker), 5 mm crop marks starting 1 mm beyond the bleed, and a 5 pt job line ("PIZZA MAX · name · trim · bleed · stock") in a 9 mm slug.

`python brand/export.py` writes the files:
- screen PNGs at native pixels;
- print PNGs at 200 dpi (longest side capped at 6000px);
- PDFs from the press sheet;
- `<id>-print.png` print files (the artwork alone, on a transparent ground) for screen-printed and embroidered pieces: tee front and back, apron, cap and the cup wrap.

Every raster carries its provenance.

**The Answer-First Rule.** The first screen answers what, how much, how fast and do you deliver to me, on the thermal ticket under the headline: open or closed now, pizza from €8.50, pickup and delivery times (or "order ahead … from 12:30 today" when closed), the delivery fee ("none, from €15") and a "Deliver to [postcode] Check" form.

## Elevation & Depth

Depth is daylight on a counter. Everything lies flat on the planks and casts a soft, warm brown shadow (rgba 30, 20, 10 to 60, 40, 15) slightly down, sized to how thick the thing is: thermal paper barely lifts, card a little, 3 mm kraft board shows a hard bottom edge and a deep soft shadow, cloth casts none of its own (the render carries it). There are no glows, no coloured shadows and no hard offsets beyond the board's own edge. Lift is the only state change in depth: on hover or focus an object rises 3 to 4px and its shadow deepens; in the kit it also straightens from its resting angle, and opening it lifts it off the table onto the spec stage.

### Shadow Vocabulary
- **Ambient panel** (`box-shadow: 0 10px 30px rgba(30, 20, 10, .08)`): the wheel detail, the full list board, the deal chooser.
- **Kraft board** (`box-shadow: 0 2px 0 rgba(110, 80, 40, .45), 0 18px 30px -14px rgba(60, 40, 15, .45)`): deal lids and the "can't decide" box; on hover `0 2px 0 rgba(110, 80, 40, .45), 0 26px 36px -14px rgba(60, 40, 15, .5)`.
- **Open box** (`box-shadow: inset 0 0 0 9px #d9bd8e, inset 0 14px 18px rgba(110, 70, 25, .28), 0 14px 24px rgba(0, 0, 0, .12)`): the inside of a menu box; the small deal boxes use a 7px rim.
- **Thermal ticket** (`filter: drop-shadow(0 10px 12px rgba(40, 25, 10, .16)) drop-shadow(0 1px 1px rgba(40, 25, 10, .1))`): the today ticket; the deal stub uses `drop-shadow(0 6px 8px rgba(40, 25, 10, .22))`, the kit ticket `0 12px 14px` at .22.
- **Red button** (`box-shadow: 0 6px 16px rgba(30, 20, 10, .16)`): primary buttons, the light button on green, the phone "+".
- **Sticker** (`box-shadow: 0 3px 8px rgba(30, 20, 10, .15)`): the Bestseller sticker.
- **Logo tab** (`box-shadow: 0 8px 24px rgba(0, 0, 0, .12)`): the white tab the logo hangs from.
- **Overlay** (`box-shadow: 0 20px 50px rgba(0, 0, 0, .2)`): the basket and the pizza sheet; the kit's spec dialog uses 0 30px 80px at .35.
- **Kit materials by thickness:** paper `0 1px 1px rgba(40, 25, 10, .1), 0 9px 18px -8px rgba(40, 25, 10, .3)`; card `0 1px 0 rgba(60, 40, 20, .3), 0 2px 3px rgba(40, 25, 10, .14), 0 12px 22px -10px rgba(40, 25, 10, .38)`; thin (stickers, labels, receipt) `0 .5px 1px rgba(40, 25, 10, .18), 0 4px 8px -4px rgba(40, 25, 10, .24)`; board `0 2px 0 rgba(110, 80, 40, .5), 0 3px 2px rgba(40, 25, 10, .18), 0 18px 30px -12px rgba(40, 25, 10, .45)`; vinyl `0 0 0 1px rgba(40, 25, 10, .06), 0 2px 3px rgba(40, 25, 10, .1)`; screen `0 1px 2px rgba(0, 0, 0, .2), 0 10px 20px -8px rgba(0, 0, 0, .32)`; cloth none. Lifted: `0 2px 3px rgba(40, 25, 10, .12), 0 26px 40px -14px rgba(40, 25, 10, .38)`.
- **Render** (`filter: drop-shadow(0 5px 5px rgba(0, 0, 0, .2))` to `drop-shadow(0 10px 12px rgba(40, 25, 10, .18))`): pizza renders in boxes, on the ruler and in the kit.

### Named Rules
**The Things-on-a-Counter Rule.** A shadow means "this object lies on the table", and its size says how thick the object is. Every shadow is soft, warm and falls downward; anything that is not a thing (text, rules, icons) casts none.

## Shapes

Modest rounded rectangles, with real-object edges where the object is real. Controls are 8px, the segmented track 10px with 7px segments, the board, wheel detail and deal chooser 14px, the pizza sheet and phone basket 16px (top corners only on phones). Kraft lids are 6px with a 3px inset print line; open boxes 4 to 6px; the "can't decide" box 8px. The sticker and top-bar links are 4px, the logo tab 6px. Filters, chips, diet pills, quantity steppers and the mini add button are full pills; round icon buttons (close, wheel arrows, add-mini, the phone "+"), the cart button, the seal and status dots are circles; the favicon and app icon are rounded squares at 22%.

The logo tab is rounded only at the bottom: it hangs from the top edge of the header, a flyer or a sign. Thermal paper has a torn zig-zag top and bottom edge (a CSS mask on the paper layer, 7 to 9px teeth) and sits a fraction of a degree off straight (−0.6 to −0.8°). Small deal boxes overlap, the middle one raised, at −3, +3 and −1.5°. Kit stickers have a white die-cut rim and group labels are strips of masking tape. Dotted leaders join a name to its value (the today ticket, the full list, "Also on the menu", the kit ticket, print menus). A dashed border means "to be filled in" or "a ticket rule": the review placeholder, "Replace before printing", stamp-card circles, the dashed rules across a ticket. Kit objects rest at −3 to +8° and straighten when touched.

## Components

### Buttons
Solid, warm and obvious: one red button per decision.
- **Shape:** gently rounded (8px), at least 44px tall (52px for the hero's "Order now"), Plus Jakarta Sans 700.
- **Primary:** tomato with white text and the red-button shadow, carrying the action and often the price ("Add to basket · €13.20", tabular). Hover goes to ripe tomato; press scales to 0.97. After adding it turns deep basil for 1.4s with a drawn check and "Added", holding its width so neighbours don't jump. Disabled is warm grey with dark grey ink and no shadow.
- **Ink:** solid ink with white text, black on hover: the "Check" button on the today ticket, where red would compete with "Order now".
- **Ghost:** translucent white with a 1.5px control-grey border and ink text; the border goes ink on hover. "Spin the wheel" under the wheel, "Keep browsing".
- **Light:** white with pine text on green grounds (the delivery band's "Check"); hover goes to basil tint.
- **Mini and round:** a white pill with a control border ("Add a Maxi, 32 cm · €13.20" under the hero pizza); a 44px circle with a tomato border and plus for adding from the full list, filling red on hover; on phones, a solid red 44px "+" under "from €8.50" on each box row.
- **Link button:** Basil Text (ink on kraft), Plus Jakarta Sans 700, underlined on hover.
- **Kit:** "Print at true size" is a tomato button (6px corners, 46px tall); "Close" is its ink-outlined ghost, inverting on hover.

### The Today Ticket (signature)
The hero's facts printed on the shop's thermal order ticket, at most 410px wide, turned −0.7°, with torn top and bottom edges and the thermal shadow. The head is "PIZZA MAX TODAY" in a spaced-caps label with the date beside it, tabular and muted. Then the open line in Plus Jakarta Sans 700, with a static 9px dot (deep basil when open, tomato when closed) and "Open now, until 23:00" or "Closed now · opens today at 12:00". A dashed rule follows, then four rows joined to their values by dotted leaders: Pizza "from €8.50", Pickup, Delivery, Delivery fee "none, from €15". When the shop is closed, pickup and delivery read as an order ahead. Under a second dashed rule: "Deliver to", a 44px postcode field and the ink "Check" button. The answer appears beneath with a drawn icon, in basil text (yes, with "Start your order") or ripe tomato (no, with the pickup alternative).

### Size Ruler and Size Control
- **Ruler:** beside "Our menu", the three sizes drawn to scale with the same top-view render at 2.1px per centimetre (26, 32, 38 cm), each named in Plus Jakarta Sans 800 over its centimetres, with "Every pizza made to order · cheese-stuffed crust +€2.50" beneath.
- **Size control:** a chip-grey track (10px corners, 4px padding) of three equal segments, each showing the size name (Plus Jakarta Sans 700), its centimetres (muted) and its price (tabular), 64px tall in an order block. The chosen segment is a white tile with a 2px ink ring and a soft shadow and its name in tomato. It is a radio group: arrow keys, Home and End move the choice, every copy of a pizza's controls across views stays in sync, and the render in the box grows or shrinks with the size. The same track chooses Delivery or Pickup and Cash or Card in the basket.

### Chips, Filters and Diet Pills
- **Filter pills:** white pills with a control border, Inter at body-small; the active filter is solid ink with white text.
- **Choice chips** (deal chooser): the same pill on a real radio button; checked is solid ink with white text and a drawn check.
- **Diet pills:** a 14px line icon plus a word on a tint: Vegetarian in basil text on basil tint, Spicy in ripe tomato on tomato tint, Fish in a single-use deep blue on a pale blue. They stay on every view; on phone box rows they collapse to the icon, with the word kept for screen readers.
- **Ticks:** every check is drawn, either as an inline SVG or through the `--tick` mask in currentColor, never a typed character.

### Sticker
The only sticker on the website is "Bestseller" on the Salami Max: Caveat 700 in white on tomato, 4px corners, turned −4°, with the sticker shadow. The kit's sticker sheet holds the print family, each die-cut with a white rim: red, ink, deep basil, kraft, ripe tomato "Spicy", gold "New!", white, an outlined "Thanks!" stamp, the arrow note. Stickers that state a fact ("Delivery from €15") are set in Plus Jakarta Sans 800, not Caveat. Use one per layout, two at most.

### Deals: Kraft Lids with a Price Stub
Each deal is printed on a box lid. A kraft board panel (the lit-corner gradient with fibre grain, 6px corners, the kraft board shadow) carries a 1.5px pine print line inset 9px. On the panel:
- the deal's pizzas, top view, in small open kraft boxes that overlap with the middle one raised;
- the name in pine spaced caps;
- the contents in kraft ink;
- a torn thermal stub with the price (Plus Jakarta Sans 800, 1.75rem, ink), the line "separately €77.10 · you save €17.20" (the Party as first shown) worked out from the menu prices of the pizzas, drinks and desserts chosen, and the red "Choose & add".

All three deals are equal: there is no featured tier, flag or percentage sticker. The lid lifts 3px on hover. An open deal gets a 3px ink ring and a full-width chooser panel below on flour white, its notch pointing at the lid. The chooser has a pizza picker with a thumbnail, drink and dessert chips, and its own stub and add.

### The Menu Boxes (default view)
Every pizza sits in its own open kraft box: a lid tilted back at 48° with the logo printed straight on the kraft ("Pizza" in pine, "MAX" in ripe tomato), and the box floor with its rim and the top-view render, scaled to the chosen size. On hover the lid opens further and the pizza turns 30°. Below come the product block (sticker and diet pills, the Product Name, ingredients in Body Small, allergens muted with "Allergens:" in body text) and the order block (size control, cheese-stuffed crust checkbox at +€2.50, red add button with the price). The row ends with "Can't decide?", a closed kraft box tile (8px, kraft board shadow, ink title, kraft-ink copy) with a red "Spin the wheel" and a "Full list" link. The other two views share the same product block: the **Pizza wheel**, whose detail panel has previous and next arrows around "Slice 3 of 8", and the **Full list**, a white board with dotted leaders and size buttons.
- **Phones:** each box becomes a row. A red "+" opens the **pizza sheet**, a bottom-sheet dialog (16px top corners, the overlay shadow) with the name in spaced caps, a close button, the top-view render, the diet pills, ingredients and allergens, then sizes, crust and add. It closes itself 1.3s after adding (the button reads "Added" meanwhile), returns focus to the "+", and then the toast says what was added.

### Also on the Menu
Under every view, the other categories as a menu board: the spaced-caps label "Also on the menu", then three columns (two under 1100px, one under 560px) of 44px rows. Each row has the category name (Burgers, Pasta, Salads, Kids, Desserts, Drinks in Plus Jakarta Sans 700), a dotted leader and "from" the lowest price (tabular), with its dishes on one muted line beneath and a hairline under each. Hovering a name turns it basil text with an underline; each row jumps to its category in the full list.

### Inputs and Fields
White, 1px control border, 8px corners, 44 to 48px tall, Inter at body size (the postcode fields use Plus Jakarta Sans 700 with slight tracking), placeholder #707070. Focus is a 2px deep basil outline offset 2px with the border turning deep basil; on green grounds the border and outline are white. Invalid fields get a tomato border (a pale red ring on green) and a message in ripe tomato. The basket's postcode field joins its label and input in one 52px box with 10px corners and shows a drawn check in basil text when the postcode is inside the area.

### Navigation
- **Top bar:** deep basil, 40px, the address with a pin, the open or closed status with a static pale green or pale red dot, and uppercase links (the phone number plain, Contact in a white outline). On phones a single "Call" button replaces the links.
- **Header:** sticky white at 96% with a blur and a hairline; it gains a soft shadow once scrolled. Links are Plus Jakarta Sans 700 uppercase at +0.05em in ink, turning basil text on hover; the current section also gets a 2px basil underline that grows from the centre. Under 980px a three-bar toggle opens a white panel of full-width rows ending in a red "Call" line.
- **Menu view tabs:** Boxes, Pizza wheel, Full list as text tabs with a 2px tomato underline on the selected one.
- **Footer:** pine, a slightly rotated white logo tab, Plus Jakarta Sans column heads in white, links in pale green that turn white and underline on hover, and the legal line with the demo-placeholder note.

### The Logo System (signature)
- **Primary badge:** "Pizza" in basil italic 800 at about 0.4 of the "MAX" size, set in at the top left; "MAX" in tomato italic 800, tight; a basil double swoosh (two curved strokes, the lower one thinner, round ends); "...tasty in the box!" in Caveat tomato, aligned right. Full colour only on white or planks.
- **The hanging white tab:** on the website the badge hangs from the top edge of the header on a white tab (160px wide, 132px under 980px) with only its bottom corners rounded and the logo tab shadow. Once the page scrolls, the badge folds into the one-line wordmark inside the bar. The kit reuses the tab on flyers, the menu cover, posters, the menu screen, social posts, the link preview and the shop sign (where it may hang 15 cm below the panel).
- **One-line wordmark:** "Pizza" (basil, half size) + "MAX" (tomato) on one baseline, tagline optional; a one-colour version exists. For narrow places: the scrolled header, receipts, the box side band, email footers.
- **On kraft:** printed straight on the board in two spot colours, pine "Pizza" and swoosh, ripe tomato "MAX" and tagline. Used on the menu box lids, the box lid print, the pickup bag and the 3D intro box. There is no white label behind it.
- **Round seal:** a white disc with two deep basil rings, ring text "STONE OVEN PIZZA · BERLIN-PANKOW · HOT & FRESH ·", Pizza, MAX and the swoosh inside. One colour as an ink stamp (bags, receipts, the stamp card), white embroidery (55 mm on the cap) or a sticker. The box seal sticker is its tomato version.
- **App icon and favicon:** a tomato square at 22% radius with a white italic "MAX" and a pale green swoosh. The small sizes drop the swoosh, and at 16px only the "M" remains; the website's favicon (`assets/favicon.svg`) is that "M". Exported at 1024, 512, 192, 180, 48, 32 and 16px.
- **Versions:** full colour on white or planks; reversed (white lettering, pale green swoosh) on deep basil, pine or tomato; two-colour on kraft; one-colour ink for receipts, stamps and fax.
- **Clear space and size:** clear space on every side equals the height of the "P" in Pizza. Minimum width: badge 25 mm in print and 100px on screen; wordmark 30 mm and 120px.
- **Never:** stretch it, recolour it, outline it or add effects, or set it on a busy picture (a pizza render included). Keep the swoosh and the handwritten line with the wordmark.

### The Order Ticket (kit signature)
The kit's navigation and specs are thermal order tickets printed in black. The ticket is thermal-white paper with a torn zig-zag top and bottom, turned −0.6°, with a soft drop shadow. It reads:
- "PIZZA MAX · PANKOW" in spaced Plus Jakarta Sans 800, then "KIT ORDER #001";
- under a dashed rule, one line per group in uppercase Inter 600, with a quantity column ("13×") and dotted leaders to an ITEMS total of 57;
- "Replace before printing" in a dashed ink box: a disclosure listing every placeholder (address, phone, website, handle, email, owner and tax number, QR codes, stamp-card reward, staff names, prices);
- a Caveat sign-off in ink: "...tasty in the box!".

The group in view is printed in reverse, white on an ink bar. Under 900px the ticket shrinks to a strip: the shop line, the total and a scrolling row of pill links. Opening an object lifts it off the table onto the spec stage, and a spec ticket slides in beside it. The spec ticket lists Size, Bleed, Stock, Colours and Group in small spaced caps over their values, then the notes, the file chips (PDF, PNG, print file) and the print button. Group headings on the table are Caveat on masking-tape strips.

### Pizza Imagery
Only the shop's own Blender renders: `blender/pizza_scene.py` for the eight pizzas and five ingredient props, `blender/box_scene.py` for stacks of the printed box (open on a pizza for the marketing pieces, closed for the hero), and `blender/wear_scene.py` for the kit's team wear and cup. Things that stand on the table cast their own shadow on a shadow catcher, cleaned and trimmed by `blender/box_finish.py`. The wear and cup are modelled cotton, twill and paper carrying the kit's own print files, lit with the same rig. All of them sit on a transparent ground; pizzas are served as 240, 480 and 760px WebP. **Top view** is the pizza's working view: in every menu box, in the deal boxes, on the size ruler, on the wheel, in the basket, the pizza sheet and printed menus. **Three-quarter view** is for a single pizza presented on its own in print and social (posters, flyers, posts, the menu screen). On the website the hero's pizza is the live 3D one. Pizzas are always whole, hot and on wood or in their box. Ingredient props decorate the kit's counter and social pieces and never lead; the website hero carries none. Real photos of the real pizzas may replace renders later; stock or generated food images never.

### Icons
Line icons on a 24 grid with a 1.8 stroke, round ends and joins, no fill, in currentColor: pizza, box, delivery, pickup, hours, stone oven, veggie, spicy, fish, phone, address, website, email, message, social, card, cash, deal, check. Drawn in ink, pine or deep basil, or white on dark grounds; used at 16px or more, always beside a word.

### The 3D Pizza and the Box Intro (signature)
- **The hero pizza:** the Veggie Garden at Maxi size on a round wooden board, built live in three.js with eight real slices. Drag to spin it; there is no zoom or pan, and vertical swipes still scroll the page. A Caveat "pull a slice!" button slides one slice out on stretchy cheese strings. The pizza turns slowly at first, then rests so a still pizza draws nothing, and turns as the page scrolls past it. The canvas fades out at its edges; while it loads, a pale dough disc pulses in its place. Beside it: "That's our Veggie Garden" and a mini add button.
- **The one authored moment:** on a first visit, a closed kraft Pizza Max box (printed in pine and ripe tomato) sits in a deep green spotlight and tilts toward the pointer. The intro shows once per device every 30 days, never on a deep link, never with a basket waiting, never with reduced motion.
  - Lift the lid by dragging, tapping or pressing Enter. It follows on a spring, steam escapes, Caveat "lift the lid!" bobs underneath, and "...tasty in the box!" wipes in, large and white.
  - The box drops away and the camera flies to the hero's exact view, so the pizza simply stays when the page appears.
  - "Skip intro" and Escape always work. If the 3D takes over 4 seconds, the page shows directly.
- **Reduced motion:** no intro; the hero pizza doesn't auto-rotate, glide or turn with scroll, toppings are simply there, and slice pulls are short and linear.

### Feedback Motion
One easing for the whole system, cubic-bezier(.16, 1, .3, 1): fast out, soft landing. Colour and border changes take 0.2s; small transforms 0.15 to 0.35s; objects lifting or lids opening 0.45 to 0.6s. Motion only answers something the visitor did:
- an added pizza flies to the basket along an arc and the basket bumps;
- the price ticks when the size changes;
- switching menu view drops the box lids in (0.7s, 0.05s stagger), turns the wheel in (0.9s) or brings the list categories in (0.35s);
- the wheel spins to a slice only when asked (1.6s);
- the pizza sheet and basket slide up;
- placing an order shuts a kraft lid (never past upright, so the print is never mirrored) and stamps "Thanks, Name!".

Nothing fades up on scroll, and headlines, badges and status dots don't animate on their own. In the kit, a material lifts off the table into the spec view and its ticket slides in. Under reduced motion transitions keep only opacity, colour and shadow, entrances become fades, smooth scrolling stops and every transform is held still.

### Honest Placeholders
Where the shop has no real content yet, the surface says so: the reviews slot is a dashed control-grey box at 72% white with an ink "Placeholder" tag, a title and a sentence explaining that real reviews come later; the footer carries a demo note; QR codes are a visible placeholder pattern; the kit lists every placeholder in one "Replace before printing" box.

## Do's and Don'ts

### Do:
- **Do** put every surface on the planks or a real stock (thermal paper, kraft board, white card, pine cloth) and give each object one soft, warm, downward shadow sized to its thickness.
- **Do** use Tomato (#c62f26) with white text for the order action, hovering to Ripe Tomato (#a3231c), and keep one red button per decision; set prices in ink.
- **Do** put prices and facts on thermal paper in black: the today ticket, the deal stubs, the kit's tickets.
- **Do** show a saving as the real difference ("separately €36.70 · you save €6.80" on the Duo), worked out from the menu prices.
- **Do** set product and deal names in Plus Jakarta Sans capitals at +0.12em (+0.16em on kraft lids), and prices in Plus Jakarta Sans with tabular figures.
- **Do** keep Caveat to the tagline, one note beside the pizza, a sticker and a thank-you; label blocks with Plus Jakarta Sans spaced caps instead.
- **Do** use Basil Text (#256628) for green text, Kraft Ink (#2c1f0e) for small text on kraft, and keep Basil (#43a047) for the logo, the swoosh and thin rules.
- **Do** print the logo straight on kraft in pine and ripe tomato, use the reversed white logo on deep basil, pine or tomato, and one-colour ink on thermal paper and stamps.
- **Do** keep clear space of one "P" height around the logo, and keep the badge at least 25 mm / 100px wide and the wordmark 30 mm / 120px.
- **Do** show only the shop's own renders: top view in boxes, on the ruler and the wheel; three-quarter view for a single pizza in print and social; whole, hot and on wood or in the box.
- **Do** draw icons and ticks as SVG on the 24 grid with a 1.8 round stroke, at 16px or more, always beside a word.
- **Do** make every control at least 44 × 44px with a 2px deep basil focus ring (white on green or dark grounds).
- **Do** build kit materials in units (1 unit = 1 mm in print, 1 px on screen) and re-run `python brand/export.py` after any change, so PDFs carry bleed, crop marks and the job line.
- **Do** mark placeholders as placeholders: a dashed border, an ink "Placeholder" tag, and an entry under "Replace before printing".

### Don't:
- **Don't** use stock photos, generated food images or anyone else's pizza.
- **Don't** stretch, recolour, outline or add effects to the logo, set it on a busy picture (a pizza render included), or put a white label behind it on kraft.
- **Don't** put white text on Basil (#43a047) or Kraft (#c9a670), or body-size text in Basil.
- **Don't** put a price, allergen, opening time or delivery condition in Caveat, or use Caveat for a heading or label.
- **Don't** show percentage-off stickers, "Best value" flags or a featured deal tier: every deal states its price and its real saving.
- **Don't** shout ("INSANELY CHEESY!!!") or claim the best pizza in Berlin, a founding year, awards, reviews or oven figures that aren't checked.
- **Don't** centre a section title over a grey rule; put the title on the left with something useful beside it.
- **Don't** pile stickers: one per layout, two at most.
- **Don't** use glows, coloured shadows or hard offset shadows.
- **Don't** type check or cross characters as icons; draw them.
- **Don't** add scroll fade-ups, looping status animations or a second authored motion moment; under reduced motion nothing moves.
- **Don't** swing a printed box lid past upright in motion: the print would show mirrored.
