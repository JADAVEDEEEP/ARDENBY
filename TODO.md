# KOVENIK: open items to confirm

## 1. Run order (nothing below has been applied to the live database yet)

1. Add `OPENAI_API_KEY=...` to `ArdenBy_Backend/.env` (gitignored). It is not set today.
2. `cd ArdenBy_Backend && node scripts/seed-catalogue.js` (dry run, prints the plan), then
   `node scripts/seed-catalogue.js --apply` (backs up the catalogue tables into `db-backups/`, then applies in one transaction; safe to run twice).
3. `node scripts/generate-product-images.js --apply --hero` (4 images per new product + the homepage hero; logged in `scripts/image-log.json`).
4. Review images at `/admin/images`; use Regenerate (with an optional custom direction) on any that look wrong.
5. Deploy backend first (the category/tag filter change is in `services/product.service.js`), then the frontend.

Why the seed is held: the 16 new products have no photos until step 3, and the live site would show them with a placeholder logo.

## 2. Photos to replace the AI images with (when you can shoot them)

All 16 new products will carry AI images (`is_ai_generated` is tracked in `scripts/image-log.json`, because no DB column exists):
Off-White Puff Print Tee, Washed Charcoal Heavyweight Tee, Sand Drop-Shoulder Tee, Koi Wave Back-Print Tee, Heavyweight Grey Hoodie,
Black Zip-Up Hoodie, Olive Overshirt, Chambray Polka Shirt, Black Relaxed Cargo Pants, Charcoal Wide-Leg Trousers, Washed Blue Baggy Jeans,
Heavyweight Black Joggers, Off-White Parachute Pants, Plus Size Black Essential Tee, Plus Size Graphic Oversized Tee, Plus Size Relaxed Joggers.
Also: homepage hero (currently `public/images/hero-dtf-back-print.jpg`, your own photo, until step 3 runs with `--hero`).
Collection tiles use the first real photo of a product in that collection; Supreme Edition shows a branded tile until its products have photos.

## 3. Copy and policy assumptions to confirm

- **Shipping:** the real checkout rule is a flat Rs 49 per order, free for KOVENIK members. Your brief said "free shipping above Rs 999"; the code does not do that, so the site does NOT say it. Tell me if you want the threshold built.
- **Returns:** 7-day window (matches the live `returns` store setting). **COD** is offered at checkout today (with the existing COD fee).
- **Pincode check:** UI only (validates 6 digits). There is no courier serviceability API, so delivery time is "confirmed at checkout".
- **Fit note** "Model is 6'0", wears L" is shown on every product page; confirm it is true for your model photos.
- **Size guide** (`/size-guide`) measurements are draft figures. Please check them against real garment specs.
- **Support contact, WhatsApp, social links:** set `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits with country code), `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_X_URL`, `NEXT_PUBLIC_YOUTUBE_URL`. Anything unset is hidden (no dead "#" links).
- **Careers / Press / Sustainability** removed from the footer and sitemap (their pages are one-line placeholders). The URLs still resolve.
- Old homepage "10% off your first order" strip in the mobile menu was removed: no such offer exists in the code.

## 4. Things I could not do under your database rules

- **Newsletter:** phase 1 (double opt-in sign-up + confirm page) is coded; run `node scripts/apply-newsletter-migration.js` (dry run) then `--apply` after a backup. Unsubscribe, admin, campaigns are later phases.
- **Per-product fields without a column** (is_ai_generated, care instructions as a separate field, GSM): GSM is written into `fabric_details`; care goes into the existing `wash_care`; AI flag lives in `image-log.json`.
- **"Each product in exactly one collection and several categories":** `products` has one `category_slug`. The collection is stored there; Top Wear / Bottom Wear / Plus Size are stored as slug tokens in the existing `tags` column (the shop and backend filters read them).
- **Rating stars** are hidden below 3 reviews everywhere (cards and product page).

## 5. Naming risk: "Supreme Edition" (DONE 2026-11-19: renamed to "Apex Edition")

"Supreme" is a registered trademark of the streetwear brand Supreme; using it as a collection name may invite a legal complaint. Renamed on 2026-11-19 to Apex Edition (slug apex-edition; old /shop?category=supreme-edition links redirect). Three alternatives: **Apex Edition**, **Heavyweight Series**, **Monolith Edition**. (The URL slug `supreme-edition` is used in links/orders, so a rename needs a redirect.)

## 6. Not built / only partly done

- Lighthouse >= 95 has not been measured (no browser tooling in this environment). Hero image uses `priority`, images are lazy below the fold, widths are reserved.
- Screenshots at 360 / 768 / 1280 / 1920 were not taken for the same reason; please eyeball in dev.
- The old admin banner slider (`BannerSlider`) is no longer on the homepage (the brief asks for one hero). The admin Banners page and data are untouched.
- The `ExploreCategory`, `Newsletter`, `MembershipStrip`, `ProcessSection` and `ProductRail` components remain in the repo but some are no longer used on the homepage.
