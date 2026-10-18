# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Local people in Berlin-Pankow who want a hot pizza at home or on the way home, and mostly order on their phones. They decide fast, hungry, often in the evening; price, delivery time and "do you deliver to me?" decide the order. Secondary: walk-in and pickup customers at the shop counter. The owner and staff use the brand materials (print, packaging, signage, social posts) to run and promote the shop.

## Product Purpose

Pizza Max is a stone-oven pizzeria in Berlin-Pankow that sells pizza, plus burgers, pasta, salads, kids' dishes, desserts and drinks, for delivery and pickup. The website and brand materials exist to get a local, hungry visitor from "I want pizza" to a placed order or a phone call, and to make the shop recognisable on every box, flyer and screen.

## Positioning

A neighbourhood stone-oven pizzeria with its own dough and sauce, delivered in its own branded box: "...tasty in the box!". Pizzas come in three sizes (Standard 26 cm, Maxi 32 cm, Wumbo 38 cm), with a cheese-stuffed crust option and bundle deals (Solo, Duo, Party).

## Operating Context

Orders arrive by phone, at the counter and through the website; pizzas leave in kraft cardboard boxes printed with the logo. Opening hours: Mon–Thu 11:00–23:00, Fri–Sat 11:00–01:00, Sun 12:00–23:00. Delivery has a minimum order of €15 and is free; delivery about 30 minutes, pickup about 20 minutes. The website is a local build with no backend.

## Capabilities and Constraints

- Menu: 8 pizzas with prices per size, other categories with single prices, 3 bundle deals (see pizza-max/js/app.js data).
- Business details are placeholders until the owner provides real ones: address Wollankstr. 20, Berlin; phone 030 123 456 78; social handles and web address not yet decided (placeholder @pizzamax.berlin / pizzamax.berlin). Every material must list placeholders in one "replace before printing" place.
- Not yet decided by the owner: last-order times for delivery and pickup (the website only refuses to promise a time after closing), and any bake details beyond the stone oven and 24-hour dough (no oven temperature or bake time is claimed until confirmed).
- Allergen data exists only for pizzas; other dishes say "on request".
- Ask Max, the site's chat helper, answers from this same data in the browser (no AI service, nothing sent anywhere); it says so when it doesn't know and gives the phone number.
- Self-hosted fonts and scripts only (GDPR, Germany); no third-party requests.

## Brand Commitments

- Name and logo: "Pizza MAX" — green "Pizza" above a big red italic "MAX", a green double swoosh, and the tagline "...tasty in the box!" in a handwritten face; on the website it hangs from the header like a white tab.
- Colours: basil green #43a047 / deep green #2e7d32 / red #c62f26 on white-painted wood planks; kraft cardboard for boxes.
- Type: Plus Jakarta Sans (display, letter-spaced capitals for product names), Inter (body), Caveat (handwritten notes, stickers). Client-mandated.
- Voice: short, warm, plain English; handwritten asides ("pull a slice!", "Bestseller").
- Real 3D renders of every pizza (assets/pizza/*-angle.webp, *-top.webp) and ingredient props (assets/props/).

## Evidence on Hand

Menu, prices, deals, sizes and opening hours as above; Blender renders of all 8 pizzas and 5 props; the 3D box and hero pizza in js/pizza3d.js. No real photos of the shop, staff or oven yet; no real reviews, ratings, order counts or press. Never invent reviews, ratings, customers or allergen data.

## Product Principles

1. The pizza is the hero: show the real food, never stock imagery.
2. Answer the hungry questions first: what, how much, how fast, do you deliver to me.
3. One recognisable shop everywhere: the same logo, box and handwriting on every surface.
4. Honest by default: placeholders are marked, no invented proof.

## Accessibility & Inclusion

Website targets WCAG 2.2 AA (contrast, 44px tap targets, keyboard, reduced motion). Printed materials keep body text at a readable size and high contrast; key information is never only in the handwritten face.
