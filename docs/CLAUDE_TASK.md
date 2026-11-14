# TASK FOR CLAUDE CODE — Grand Hotel Plovdiv New Year 2027 landing

Build a polished, responsive, conversion-oriented single-page website promoting New Year 2027 at Grand Hotel Plovdiv 5★, in Russian and Bulgarian (language toggle RU/BG). This is a promotional page for a tour operator, but DO NOT put the operator name or logo in marketing headers/hero. Do not imply the page is the hotel's official website. Legal seller information and actual booking/payment details must be configurable and shown where required. No fabricated company details.

## Source of truth
- `official_offer_2027.pdf` is authoritative for ALL prices, inclusions, restrictions and booking terms. Carefully extract and verify the tables, don't invent prices or events. The package and accommodation-only prices are DIFFERENT products.
- `assets/` contains hotel images grouped by use. `photo_contact_sheet.jpg` helps select visuals. Some photos are from Booking.com and MUST NOT be published commercially without verified rights/permission. Build with local files now as preview assets only, and flag that licensing must be cleared before launch.
- Avoid using generic/stock photos and avoid invented images of the hotel. For city attractions, use placeholders until licensed images are provided.

## Design
Emerald & Champagne, NOT navy and gold. Palette: deep emerald #24372E, warm ivory #F1E9DC, muted champagne #C4A27C, sage #A8A08B. Luxurious editorial design, elegant typography, lots of whitespace, restrained oriental motifs (1001 Stories / Magic of the Orient), tasteful micro-interactions. Hero with a real hotel event/banquet image and dark green overlay; alternating light sections; elegant accessible contrast. Premium feel, not tacky, no heavy gold ornaments.

## Hero
Title: 'Новый год 2027 в Пловдиве' / 'Нова година 2027 в Пловдив'. Hotel: Grand Hotel Plovdiv 5★. Event theme: '1001 Stories — Magic of the Orient'. Lead price: 'от 71,65 €' / 'от 71,65 €', explicitly explain it is the 1-night accommodation-only price PER PERSON in a double Classic room, NOT a gala-inclusive package. Add secondary teaser 'Новогодний пакет с праздничным ужином от 280,90 € на человека' (1 night, double Classic). Date range 29 Dec 2026–2 Jan 2027. CTA 'Оставить заявку' / 'Изпратете запитване'. No direct booking or payment promise.

## Sections
1. Hero, pricing distinction immediately visible.
2. Why spend New Year in Plovdiv: city/culture, with no unlicensed photos.
3. 1001 Stories celebration: only verified inclusions and program details from official PDF.
4. Two clearly separated price selectors/tables: (A) accommodation + breakfast + SPA, (B) gala package; durations 1/2/3/4 nights, room types Classic/Comfort/Lux, double vs single. Make it very clear all source figures for double occupancy are PER BED/PER PERSON, not per room. For 4+ nights note individual offer. Avoid misleading price comparisons.
5. Horizontal room gallery (2–3 columns desktop) and clickable lightbox, filters Rooms / Events / Dining / SPA / Hotel. Mobile-friendly swipe, lazy load. Use `assets/` local images, no image hotlinking.
6. SPA and hotel amenities.
7. New Year's gala dinner (standalone €220 adult, child 2–11.99 €132; 0–1.99 free), and package dinner differences.
8. Terms, children/extra bed, prepayment and cancellation exactly as source; readable, not hidden. Do not make up availability.
9. Lead form with full name, contact (email or phone), preferred language, dates, number of guests, room type, product (accommodation only / gala package / gala dinner), privacy consent. Client-side validation; no pretend successful submissions. Implement a real integration only when endpoint is provided, otherwise clear nonfunctional demo state and setup instructions. No invented phone or emails.
10. Footer with configurable seller/legal data, links to privacy policy, and disclosure that this is a promotional offer, not the official hotel website.

## Technical
Use a modern stack that works in Claude Code (prefer Vite + React + TypeScript + CSS or Tailwind), responsive, SEO meta RU/BG, accessible semantic markup, keyboard lightbox, clear component structure, local image optimization, no backend secret in browser. Provide README with local run/deploy steps, configuration points for form and legal info, and license checklist. Test build and fix errors. Do not register/purchase domain or deploy without approval.

## Important offer caveat
The official PDF is a TOUR OPERATOR offer. 10% commission is already INCLUDED in package/accommodation prices. Don't add it again or mention commission in consumer-facing prices. Confirm any public retail prices and sales conditions with the seller before publication. No claims of guaranteed availability.
