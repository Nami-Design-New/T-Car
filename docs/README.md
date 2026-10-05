# T-Car architecture plan

Status: **in progress** on branch `refactor/architecture-layers` (not merged). See
[Migration status](#migration-status) for what is done and where the code
deliberately differs from these documents.
Last reviewed against the code: 2026-10-04. Status updated: 2026-10-04.

This folder reviews the current front end and sets out the target design and the
migration path for six areas. Each document stands on its own: it covers the
current state (with file references), the target, the rules, and the migration
steps.

| # | Document | Question it answers |
| - | -------- | ------------------- |
| 1 | [Architecture layers](01-architecture-layers.md) | Where does each kind of code live, and what may import what? |
| 2 | [Server / client boundary](02-server-client-boundary.md) | What renders on the server, what ships to the browser, and where is the line? |
| 3 | [Error handling](03-error-handling.md) | How are errors created, carried, shown, and logged? |
| 4 | [Component design](04-component-design.md) | Which components are reusable, how are they built (Radix primitives), and how are they styled? |
| 5 | [Performance and routing](05-performance-and-routing.md) | What should be a route, a URL parameter, or a local tab, and what is slowing the app down? |
| 6 | [Loading, empty, and error states](06-ui-states.md) | What every screen shows while waiting, when there is nothing, and when something fails |
| 7 | [Images and assets](07-images-and-assets.md) | Where each image lives (`public/icons`, `public/images`, backend URLs), and how it is referenced |
| 8 | [Styles: compile from SCSS](08-styles-and-scss.md) | How stylesheets are built: SCSS sources compiled by Next, no committed CSS |

The existing root-level plans stay valid and are referenced where they overlap:

- [`DESIGN_SYSTEM_MIGRATION.md`](../DESIGN_SYSTEM_MIGRATION.md): color, spacing, and radius tokens (done).
- [`DIALOG_MIGRATION_PLAN.md`](../DIALOG_MIGRATION_PLAN.md): the shared dialog module (proposed). Document 4 builds on it and does not replace it.
- [`WALLET_IMPLEMENTATION_PLAN.md`](../WALLET_IMPLEMENTATION_PLAN.md): the wallet feature (phases 1–4 done).

Consider moving these three into `docs/` once this plan is accepted, so all
architecture material is in one place.

---

## Summary of findings

The app is a Next.js 15 App Router project with `next-intl` (`/en`, `/ar`). Its
visual layer is in good shape: design tokens are migrated, and the wallet and
bank-account flows use typed state machines. The structure around it has not
kept up:

1. **No layering.** Pages hold mock data inline (see
   [`account/page.tsx`](../src/app/[locale]/account/page.tsx) and
   [`cars/[carId]/page.tsx`](../src/app/[locale]/cars/[carId]/page.tsx)).
   Components import `@/data/*` directly. `types/car.ts` mixes domain types with
   component props. The only real API service, `cars.service.ts`, is never
   called.
2. **Almost everything is a client component.** 92 files start with
   `'use client'`, including pages and components that have no state or event
   handlers (`Footer`, `WhyChooseUs`, `privacy`, `terms`, `not-found`). The
   header, and with it the whole auth modal stack, hydrates on every page.
3. **Errors are swallowed.** There is no `error.tsx` anywhere. Hooks turn every
   failure into `false`. A failed initial load shows the **empty** state. An
   unknown car id silently renders the first mock car instead of a 404.
4. **Components are not tiered.** Twenty-three dialogs each re-implement portal,
   scroll lock, and overlay, and none sets `role="dialog"`. There are four
   empty-state implementations, two near-identical filter panels, a duplicated
   `BookingsTab`, and nine unused components.
5. **Tabs that should be routes.** The five account sections are `useState`
   tabs, so they cannot be linked to, and the booking details back link
   (`/account?tab=bookings`) does not work. Filters and sort live only in local
   state, and the search parameters the hero sends to `/cars` are never read.
6. **Loading is all-or-nothing.** One full-screen fixed loader covers the whole
   viewport on every navigation. There are no skeletons and no error states.

### Bugs found during the review (fix first, independent of the plan)

| Bug | Where | Effect | Status |
| --- | ----- | ------ | ------ |
| Font path uses `Expo-Arabic-light.ttf`, but the file is `Expo-Arabic-Light.ttf` | [`layout.tsx:12`](../src/app/[locale]/layout.tsx) | Works on Windows, but **the build fails on case-sensitive file systems** (Linux CI, Vercel) | Fixed (font source now uses the exact filename casing) |
| Messages use i18next `{{name}}` syntax, but `next-intl` expects `{name}` | [`messages/en.json:30-31`](../messages/en.json), same in `ar.json` | OTP digit label and resend timer do not interpolate | Fixed (OTP placeholders use next-intl syntax) |
| `Link` from `@/i18n/navigation` is given `/${locale}/cities/…` | [`home/Cities/index.tsx`](../src/components/home/Cities/index.tsx) | The locale prefix is added twice (`/ar/ar/cities/…`) | Fixed (now `features/cities/components/PopularCities.tsx`) |
| `useRouter` from `next/navigation` instead of `@/i18n/navigation` | `Hero`, `CityHero`, `SuccessModal` | Pushes URLs without the locale, which costs a middleware redirect and can switch the language | Fixed in `Hero` and `SuccessModal`. `CityHero` was not affected: it builds the URL from `next/navigation`'s own `usePathname`, which already has the locale |
| Back link to `/account?tab=bookings` | [`BookingDetailsHeader.tsx`](../src/components/bookings/details/BookingDetailsHeader.tsx) | Account page ignores the query and opens the profile tab | Fixed (the account page reads `?tab=`) |
| Unknown car id falls back to `MOCK_CARS[0]` | [`cars/[carId]/page.tsx`](../src/app/[locale]/cars/[carId]/page.tsx) | Wrong car shown instead of a 404 | Fixed (`notFound()`); same for unknown bookings and city slugs |
| Header renders both `UserMenu` and the login button | [`Header.tsx`](../src/features/layout/components/Header.tsx) | Logged-in state is ignored | Fixed (the header gets the NextAuth session from the layout) |
| Sitemap lists `/services` and `/about`, which do not exist, and has no locale prefixes | [`sitemap.ts`](../src/app/sitemap.ts) | SEO errors | Fixed (only real routes are emitted, once per locale) |
| Metadata icon path `../assets/images/fav.svg` and missing `og-image.jpg` | [`layout.tsx`](../src/app/[locale]/layout.tsx) | Broken favicon and social previews | Fixed (`app/icon.svg` supplies the favicon; nonexistent social-image references were removed). A designed Open Graph image remains an enhancement |
| `MapLocationModal` is always mounted in `Hero`, and `useJsApiLoader` runs before the `if (!open)` return | [`MapLocationModal.tsx:48`](../src/components/modals/MapLocationModal.tsx) | The Google Maps script loads on every home page visit, even if the map is never opened | Fixed: mounted only while open (not yet confirmed in a browser's network tab) |

---

## Target at a glance

```
src/
  app/[locale]/            routing only: page, layout, loading, error, not-found
  features/<domain>/       components, hooks, server queries and actions, types
  shared/ui/               design-system components built on Radix primitives
  shared/lib/              formatters, class names, result and error types
  shared/hooks/            generic hooks (media query, click outside, carousel)
  services/http/           one HTTP client, error normalization, auth header
  i18n/  styles/  assets/
```

- Server components by default. `'use client'` only on interactive leaves.
- Reads happen on the server through per-feature `queries.ts`. Writes go through
  Server Actions that return a `Result`.
- Every route segment has a `loading.tsx` skeleton and an `error.tsx`.
- Every data view uses the same `loading → (empty | content) | error` contract.

---

## Migration roadmap

Each phase leaves the app working and deployable. Phases 2–5 can overlap once
phase 1 is done. Each feature is migrated end to end (layers, boundary, errors,
states) rather than one concern at a time across the whole app.

### Phase 0: Safety net and bug fixes (about 1–2 days)

- ✅ Fix every bug in the table above.
- ✅ Delete dead code (the three dialogs below still wait on product): `lib/i18n.ts`, `layout/I18nProvider.tsx`,
  `bookings/BookingsTab.tsx` (duplicate of `account/BookingsTab.tsx`),
  `cities/CityCarCard.tsx`, `home/Cities/CitiesGrid.tsx`,
  `bookings/details/{BookingCarSummary,BookingPriceDetails,RateBookingButton}.tsx`,
  `modals/{BookingModal,BookingMonthlyModal,InsufficientBalanceModal}.tsx`.
  Confirm with product first that the monthly booking and insufficient-balance
  dialogs are not needed soon. If they are, move them into their feature folder
  instead of deleting them.
- ✅ Add `npm run typecheck` (`tsc --noEmit`) and run it with `lint` in CI. (`npm run check` runs both; wiring it into CI waits for a CI config.)
- ✅ Upgrade to React 19 and `@types/react@19`. The Next 15 App Router is built for
  React 19, and the plan uses `useActionState` and `useOptimistic`.

### Phase 1: Foundations (about 1 week)

- ✅ Create the `features/`, `shared/`, and `services/http/` folders and the import
  rules ([doc 1](01-architecture-layers.md)).
- ✅ Build `services/http` with `AppError`, `toAppError`, and `Result`
  ([doc 3](03-error-handling.md)).
- ✅ Build the first `shared/ui` set on Radix: `Dialog`, `ConfirmDialog`,
  `ResultDialog`, `Tabs`, `RadioCards`, `Accordion`, `DropdownMenu`, `Button`
  with `loading`, `Price`, `EmptyState`, `ErrorState`, `Skeleton`
  ([doc 4](04-component-design.md), [doc 6](06-ui-states.md)).
- ✅ Add root `error.tsx`, `global-error.tsx`, and a non-blocking root `loading.tsx`.

### Phase 2: Routing (about 3–4 days)

- Split `/account` into nested routes with a shared layout, and move
  `/my-bookings/[id]` to `/account/bookings/[id]` with a redirect
  ([doc 5](05-performance-and-routing.md)).
- Move filters, sort, and the bookings status toggle into URL search parameters.
- Add `loading.tsx`, `error.tsx`, and `not-found.tsx` per segment.

### Phase 3: Server-first data and auth (about 1–2 weeks, depends on the backend)

- Move the auth token from `localStorage` to an `httpOnly` cookie, and add an
  auth guard to `middleware.ts` ([doc 2](02-server-client-boundary.md)).
- Replace inline mocks with `features/*/queries.ts`. Mocks move behind the same
  function signatures so pages do not change when the API arrives.

### Phase 4: Feature-by-feature migration

Recommended order, from most to least mature:

1. `wallet` and `bank-accounts`: already have a service, hook, and state machine, so this is the reference implementation.
2. `my-bookings`: list and details, plus actions (edit, extend, cancel, review).
3. `car-details` and `booking` (the checkout flow).
4. `cars` and `cities`: listing, filters, and sort through the URL.
5. `home` and `rental-search` (the hero flow).
6. `auth`, and removal of `react-bootstrap`.

Each feature is done when it passes the checklist below.

### Phase 5: Performance clean-up (continuous, about 1 week total)

Lazy dialogs and Lottie, one carousel approach (drop Swiper), a trimmed
Bootstrap import, split SCSS, `next/image` for hero slides, and `woff2` fonts
([doc 5](05-performance-and-routing.md)). The Bootstrap and SCSS items are
planned in detail in phase 8 ([doc 8](08-styles-and-scss.md)).

### Phase 6: Internationalization extraction (continuous)

The code holds about 840 hardcoded Arabic string runs across 80 `.tsx` files, so
the English locale still shows Arabic. Move each feature's strings into
`messages/*.json` as part of its phase 4 migration, not as a separate
big-bang pass.

### Phase 7: Images and assets (about 2–3 days)

Serve every image from `public/`, split into UI icons (`public/icons/`),
static app images (`public/images/`), and data images that will come from
the backend as URLs (mocked from `public/mock/`). Icons and static images go
through one typed registry; data images become plain URL strings in the
model types. Also re-export the three 1–2 MB PNG-in-SVG icons
([doc 7](07-images-and-assets.md)). Independent of phases 2–6; best done
before the API phase, so the model types already match the API.

### Phase 8: Styles compiled from SCSS (about 2–3 days, plus the split alongside features)

Load the SCSS sources instead of the committed `main.css`, pin Sass, delete the
generated `main.css` / `main.css.map` and the sync script, give Bootstrap its
own trimmed entry, then split `main.scss` into per-feature partials as each
feature is touched ([doc 8](08-styles-and-scss.md)). A drift check found that
`main.scss` and `main.css` match rule for rule, so the switch is not expected
to change what users see. Covers phase 5's "trimmed Bootstrap import" and
"split SCSS" items.

---

## Migration status

Branch `refactor/architecture-layers`, one commit per step, each checked with
`tsc`, lint, `next build`, and a smoke test against `next start`. Nothing is
merged or pushed yet.

### Phases

| Phase | Status | Notes |
| ----- | ------ | ----- |
| 0. Bug fixes and dead code | Done (one item waiting on product) | All 10 bugs above fixed. Dead code deleted: `bookings/BookingsTab`, `BookingCarSummary`, `BookingPriceDetails`, `RateBookingButton`, `CityCarCard`, `CitiesGrid`, `lib/i18n.ts`, `layout/I18nProvider.tsx`, and 8 unused path aliases. `npm run typecheck` and `npm run check` (typecheck + lint) added; there is no CI config yet to run them in. React 19.3 (verified with the build and server rendering of every route; not yet checked in a browser). Also fixed on the way: a duplicated mock car id. **Waiting on product:** `BookingModal`, `BookingMonthlyModal`, `InsufficientBalanceModal` (unused, kept). Optional: a designed Open Graph image (`src/app/opengraph-image.jpg`) |
| 1. Foundations | Done | `features/`, `shared/{ui,lib,hooks,config}`, `services/http`, the import rules (as warnings), `AppError` / `Result` / `reportError`, the `errors` and `states` messages, root `error.tsx` and `global-error.tsx`, a non-blocking root `loading.tsx` with `Skeleton`, and the first Radix `shared/ui` set, each tested and with at least one production caller: `Dialog` (`CountryModal`, `WalletAmountModal`, `BankSelectModal`), `ConfirmDialog`, `ResultDialog`, `Tabs` (insurance terms), `Accordion` (warranties), `RadioCards` (payment method), `Menu` (user menu), `Button` with `loading` / `asChild`, `Price` (wallet), `EmptyState` + lazy `Illustration` and `ErrorState` (bookings, wallet, bank accounts). The FAQ became native `<details>` rather than `Accordion` (answers stay in the server HTML). Vitest + Testing Library (`npm run test`, 64 tests). Moved to phase 2: per-segment `loading.tsx`, which real 404 status codes need. Replacing the remaining dialogs and menus is doc 4 / phase 4 work |
| 2. Routing | Done (5 of 5 fractions) | **Done:** (1) the account sections are routes: `/account/{profile,bookings,wallet,bank-accounts,notifications}` in a `(sections)` route group with one layout (title + link sidebar with `aria-current`); each loads only its own data and JS (e.g. notifications 101 kB vs the single 334 kB page before); `/account` and old `/account?tab=<section>` links are real HTTP redirects (`next.config.mjs`). (2) Booking details moved to `/account/bookings/[id]` (outside the group, so the page keeps its full-width layout), with its own title and a permanent redirect from `/my-bookings/[id]`; all of `/account/**` is `noindex`. (3) The bookings list reads `?status=active|past` (links with `aria-current`, rendered on the server, no client state); the details back link returns to the booking's own list. (4) Route-level loading and error boundaries now cover home, account sections, car details, city details, and booking details; car, city, and booking resources have segment-specific not-found screens. **Complete:** filters, sorting, and hero search context are now read from URL parameters by `/cars` and `/cities/[slug]`. |
| 3. Server-first data and auth | Done (4 of 4 fractions) | Reads go through `features/*/queries.ts` for cars, cities, car details, bookings, home, rental search, account profile, and notifications (car and city pages also set their own `<title>`). Auth is NextAuth v5 with the backend token in its `httpOnly` session cookie and a middleware guard ([doc 2](02-server-client-boundary.md#23-auth-across-the-boundary)). Wallet, bank-account, booking, checkout, and contact writes now cross Server Actions and use `fromActionResult`; wallet and bank-account reads remain on browser-only stateful mocks until a user-scoped persistence contract exists. |
| 4. Feature migration | Done (8 of 8 fractions) | Wallet, bank-account, my-bookings, booking-flow, rental-search, cars/cities filters, and auth dialog migration are complete. Remaining performance, i18n, image, and SCSS work is tracked in phases 5–8 |
| 5. Performance | Started (fraction 5 of 8) | Done: the Maps script loads only when a map dialog opens; the auth dialog loads on first open; booking-flow, rental-search, wallet, profile, booking-details, and booking-review dialogs load on demand and mount only for their active step; Lottie animations load on first use through `Illustration` (`SuccessModal` still imports Lottie directly); the header and footer render on the server; the FAQ ships no client JavaScript; hero slides use `next/image` with `fill`, `sizes="100vw"`, and first-slide priority; WOFF2 font files are used for all four active Expo Arabic weights. Decision: retain Swiper for the car rails, hero, and partners; the planned carousel replacement is not being pursued because the measured bundle trade-off does not justify the design and behavior changes. Remaining: the Bootstrap and SCSS items are phase 8 |
| 6. i18n extraction | Complete (10 fractions) | Extracted home, rental-search, layout, account, wallet, bank accounts, my-bookings, car-details, booking flow, cars/cities, legal pages, common controls, date picker, city index, and auth success copy into both locale files. The global error remains intentionally fixed and bilingual because it renders outside the locale layout. |
| 7. Images and assets | Complete (4 fractions + 2 audit follow-ups) | [Doc 7](07-images-and-assets.md): UI icons, static images, API-bound mock URLs, animations, cleanup, and image-weight reductions are complete (fractions 1–4). `cta.png` and `notlogin.png` are retained under `public/images/unused/`, excluded from the registry, pending design confirmation before deletion. **Audit follow-ups (2026-10-04):** (5) ✅ brand filter options come from `carsApi.listBrands()` via `getCarBrands()` instead of `/mock/` paths in `CarFilters` / `CityFilters`, and a lint rule keeps `/mock/…` literals inside `services/mocks`. (6) ✅ removed the duplicate `src/assets/images/logo.png` and unused `brand/logo.svg` (`src/assets/` is now `fonts/` + `animations/`); the image import ban moved to `no-restricted-syntax` so the per-folder lint overrides no longer drop it, and it now covers every image extension. (7) Not pursued (user decision): `payment/wallet.svg` (62 KB) and `payment/tamara.svg` (259 KB) wrap raster images but stay SVG, not WebP. Step 6 (narrow `remotePatterns`, delete `public/mock/`) waits for the API phase |
| 8. Styles compiled from SCSS | In progress (fraction 6 of 7: 6.1, plan steps 1–4 and dead-CSS removal done; step 5 started) | [Doc 8](08-styles-and-scss.md): drift check done (0 rules differ in meaning between `main.scss` and the committed `main.css`). (1) ✅ Sass pinned to exactly `1.105.0` (the lockfile already resolved it; emitted CSS byte-identical). (2) ✅ the layout imports `main.scss`; Next now compiles all styles. Emitted CSS: 0 rules differ in meaning, 60 differ only in notation, 5 legacy prefixes dropped ([doc 8 step 2 results](08-styles-and-scss.md#step-2-results-2026-10-04)); dev style reload ~1.4 s → ~5 s until step 4. (3) ✅ deleted `main.css`, `main.css.map`, `scripts/sync-office-css.mjs`, and the `css:sync-office` script; `.gitignore` ignores `src/styles/**/*.css` and `*.css.map`; the root plans that pointed at the sync script now point at doc 8. Emitted CSS byte-identical to fraction 2. (4) ✅ Bootstrap is its own stylesheet (`styles/vendor/bootstrap.scss`), loaded before `main.scss`; dev reload after a style edit back to ~1.4 s. 114 app rules lost a `.hN` / `.small` copy that Bootstrap's `@extend` used to add; no visible effect found ([doc 8 step 4 results](08-styles-and-scss.md#step-4-results-2026-10-04)). (5) ✅ Bootstrap trimmed to the partials and 14 of 97 utility groups the markup uses: 228 KB → 62 KB (31 → 10 KB gzip), no remaining rule changed ([doc 8 step 5 results](08-styles-and-scss.md#step-5-results-2026-10-04)). Fix: `.visually-hidden` (loading-screen label) was missed by the inventory and is restored. (6.1) ✅ the global layer (reset, layout, buttons, loader, typography) moved from `main.scss` into `styles/base/`; emitted CSS byte-identical ([doc 8 step 6](08-styles-and-scss.md#step-6-progress)). Plan for the rest of step 6 agreed ([doc 8 step 6 plan](08-styles-and-scss.md#step-6-plan-agreed-2026-10-04)): (step 1) ✅ `shared/ui` normalized to `<Name>/<Name>.tsx` + `.scss` + `.test.tsx` + `index.ts` with named exports and props types (doc 4 §4.4); (step 2) ✅ every `shared/ui` component has tests (43 new, 107 in total); (step 3) ✅ `Form`, `DateTimePicker`, `PhoneField`, `Loader`, `SectionTitle` styles live next to the component (computed styles unchanged in headless Chrome); (step 4) ✅ shared legacy dialog styles in `styles/legacy/_dialogs.scss`, styles of the old `src/components/*` in `styles/legacy/_components.scss`; (5) one `features/<x>/<x>.scss` per feature: ✅ `cities`, ✅ `home`, ✅ `layout`, ✅ `rental-search`, ✅ `cars`, ✅ `car-details`, ✅ `booking`, ✅ `auth`, ✅ `account`, ✅ `bank-accounts`, ✅ `wallet`; next `my-bookings`, then (7) the committed-CSS guard. Component styles from phase 1 already compile from SCSS |

### Features

| Feature | Moved to `features/` | Data behind queries / api | Actions return `Result` | Remaining |
| ------- | :---: | :---: | :---: | --------- |
| `wallet`, `bank-accounts` | Yes | Client reads over `*.api.ts`; writes through Server Actions | Yes | Fractions 1–3 complete: wallet and bank-account form, confirmation, and result states use shared dialogs. Left: user-scoped reads/API and forms (doc 3 step 7) |
| `my-bookings` | Yes | Yes | Yes (Server Actions) | Fraction 4 complete: extend, cancel, review, and result dialogs use shared Dialog primitives. Left: `router.refresh()` after an action once the API keeps state |
| `car-details`, `booking` | Yes | Yes | Yes (checkout) | Fraction 5 complete: daily booking, confirmation, payment, and booking result dialogs use shared primitives. Left: keep a failed edit request open inside `BookingDailyModal` and migrate remaining booking-flow details |
| `cars`, `cities` | Yes | Yes | n/a | Fraction 6 complete: search and price URL state is shared by `CarFilters` and `CityFilters`; sort and hero search context remain URL-backed. Brand options come from `getCarBrands()` (mocked `carsApi.listBrands()`). Left: consolidate the remaining option data (companies, types, services; doc 4) |
| `home`, `rental-search` | Yes | Yes (FAQs, search options) | Yes (Server Action: contact form) | Fraction 7 complete: pickup type, branch, airport, station, map, and country dialogs use shared `Dialog`. The FAQ is native `<details>`; static home content remains component-local |
| `auth` | Yes | NextAuth + mocked `authApi` | Yes (Server Actions) | Auth dialog uses shared `Dialog` and `ResultDialog`; real backend endpoints remain a later integration concern |
| `account` (profile, notifications) | Yes | Yes (scoped to the session user) | Yes (Server Actions: save, phone change send and verify, license upload, delete) | Routes per section with a shared layout and `AccountNav`. Left: notification mark-all-read is still static; opening the license details is still a TODO; forms (doc 3 step 7) and dialogs |
| `layout` | Yes | n/a | n/a | The header shell and footer render on the server; mobile navigation, language, and auth are client islands; the user menu uses `Menu`. Left: trimming the client messages (doc 2 step 7), the language switcher on `Menu` |

The `*.api.ts` files are backed by mocks only; no backend endpoint is wired in.
Mock rules that make failures reproducible (OTP `1234`, top-ups over 10,000,
extensions over 30 days, and so on) are documented in each `services/mocks/*.ts`.

### What remains

- Phase 2 routing and Phase 3 Server Action fractions are complete. Wallet and
  bank-account reads still use browser-only stateful mocks until user-scoped
  persistence/API contracts are available.
- Phase 4 feature and dialog migration is complete. Wallet and bank-account reads
  still await a user-scoped persistence/API contract.
- Phase 5 is complete apart from the Bootstrap/SCSS work tracked in phase 8.
  Swiper is intentionally retained for the existing car rails, hero, and
  partners carousels.
- Phase 6 is complete with ten fractions covering feature copy, static/legal pages, common controls, date picking, city index copy, and auth success copy. The global error remains intentionally fixed and bilingual because it renders outside the locale layout.
- Phase 7 is complete: the four planned fractions plus two follow-ups from an
  audit on 2026-10-04. Done: (5) brand filter logos behind the cars API, with
  a lint guard for `/mock/` literals; (6) duplicate logo files deleted and the
  image import ban enforced in every folder. Not pursued (user decision):
  converting the `wallet` and `tamara` payment SVGs to WebP. Mock image fixtures are temporary and
  will be deleted after backend image URL integration. `cta.png` and
  `notlogin.png` remain pending design confirmation. Integration follow-up:
  the brand filter's label comes from `cars.brands.<slug>`; the API will
  probably send a localized name instead.
- Phase 8 is in progress (fraction 6 of 7; the global layer is in
  `styles/base/`, features are next): Sass is pinned, the layout loads
  a trimmed `vendor/bootstrap.scss` then `main.scss`, and the generated CSS and
  sync script are gone. A new Bootstrap class needs its partial or utility
  group added to `vendor/bootstrap.scss`. `react-bootstrap` is still in
  `package.json` but nothing imports it. Turn off any
  editor Sass watcher (Live Sass Compiler): its output is git-ignored and
  unused. Next: split `main.scss` per feature, then the committed-CSS guard. Known build warnings,
  present before phase 8: autoprefixer flags `end` (use `flex-end`) in
  `main.scss`, and `jose` (NextAuth) uses Node streams in the Edge middleware.
- Bug found during phase 8 (not fixed): `features/home/components/ContactInfo.tsx`
  reads `addressValue` / `emailValue` from the root namespace, but the keys are
  `contact.addressValue` / `contact.emailValue`, so the home contact block throws
  `MISSING_MESSAGE` and shows the raw key in both locales.
- Formatting (2026-10-04): the existing, consistent formatting is kept (no
  repo-wide Prettier pass). Prettier formatted only the 8 genuinely unformatted
  files: `CityHero`, `FormSelect`, the `cities` / `privacy` / `terms` pages
  (components on one line), `CheckboxGroup` and `FilterPanel` (packed JSX), and
  `ConfirmDialog.scss` (one-line rule blocks). Left as is: long translation
  strings, SVG path data, a data URI, and `BookingMonthlyModal` (waiting on
  product). `.prettierrc` gained `endOfLine: auto`; `.prettierignore` skips
  markdown, Lottie JSON, `public/`, the lockfile, `next-env.d.ts`;
  `npm run format -- <files>` formats only the files named.
- `shared/ui` bugs found while writing tests (not fixed; the tests do not assert
  the wrong behavior): `FormInput` / `FormSelect` / `FormTextarea` show `*` for
  `required` but never pass `required` to the control, and do not link the error
  to it (`aria-describedby`, `aria-invalid`); `ResourceNotFound` labels its link
  "Browse Cities" for cars and bookings too; `DateTimePicker` parses
  `YYYY-MM-DD` as UTC, so west of UTC `minDate` allows one day early, and it
  formats the chosen date with a fixed `ar-SA` locale; `ResourceNotFound`'s
  `.not-found-eyebrow` is only styled inside `.not-found-page`, so its eyebrow
  is unstyled.
- Bug found (not fixed): an unknown URL such as `/en/this-page-does-not-exist`
  returns 404 but renders Next's built-in "This page could not be found" page,
  without the site header, footer or the designed `app/[locale]/not-found.tsx`.
  That file only runs when a page calls `notFound()`; unmatched URLs need a
  catch-all `app/[locale]/[...rest]/page.tsx` that calls `notFound()` (the
  next-intl pattern).
- Possibly dead (to check): `legacy/_dialogs.scss` styles `.modal_overlay
  .pickup_modal`, but the pickup dialog now renders through `shared/ui/Dialog`.
- Download-app section fix (2026-10-05): the text column sat on top of the phone
  image in both locales. Commit `d97439e` switched the section to logical
  properties but dropped `margin-left: auto` on the text column, and a
  `body:dir(ltr)` override in `base/_reset` could not help. The text now has
  `margin-inline-end: auto` and `text-align: start`, the phones
  `inset-inline-end: 70px`: Arabic matches the original design (phones left, text
  right), English is its mirror; the stacked layout at ≤ 992 px is unchanged.
- FAQ design fix (2026-10-05): the chevron of every FAQ item was stretched into
  a wide blue bar. Since the move to native `<details>` (commit `4a8d196`) the
  icon is a `<span>`, and the old `.faqs .faq-question span { flex: 1 }` rule
  for the question text hit it too. The text span now has `.faq-question-text`
  and the rule targets it; the icon is its designed 34 px (30 px on mobile).
  Follow-up: the FAQ answers and questions come from the mock in Arabic on
  `/en` too (`services/mocks/faqs.ts`), a content/API concern.
- Dead CSS (2026-10-05): removed 795 lines (57 blocks) whose classes no code
  uses, after proving none can match (doc 8, ownership map). App stylesheet
  −11.7 KB minified.
- Product decisions are still needed before deleting `BookingModal`,
  `BookingMonthlyModal`, or `InsufficientBalanceModal`.

### Where the code differs from these documents

Decisions taken during the migration, for review:

1. **`AppError` lives in `shared/lib/errors.ts`** ([doc 3](03-error-handling.md)), not
   `services/http/errors.ts` ([doc 1](01-architecture-layers.md)), because the UI needs the type too.
2. **Pages import reads from `@/features/<x>/queries`, not from `index.ts`.** A client
   component importing a feature's `index.ts` pulled its `'server-only'` queries into
   the client bundle and failed the build. `index.ts` is the client-safe API
   (components, types, pure rules). See [doc 1 §1.5](01-architecture-layers.md#15-as-built-notes).
3. **Server Actions return `ActionResult`, not `Result`.** An `AppError` instance does not
   survive the trip to the client, so the error travels as plain data and
   `fromActionResult()` rebuilds it. See [doc 3](03-error-handling.md#34-migration-steps).
4. **Auth uses NextAuth v5** (`5.0.0-beta.32`, pinned) instead of a hand-built cookie
   session, because the backend does not set an `httpOnly` cookie. See [doc 2](02-server-client-boundary.md#23-auth-across-the-boundary).
5. **No `USE_MOCKS` flag yet.** Each `services/<domain>.api.ts` exports an interface and,
   for now, only the mock implementation. The flag comes with the first real endpoint.
6. **Wallet, bank-account, booking, checkout, and contact writes use Server Actions**
   that return `ActionResult`; `fromActionResult()` rebuilds the client-side
   `Result`. Wallet and bank-account reads still use browser-only stateful mocks
   until a user-scoped persistence/API contract exists.
7. **Import-rule adjustments:** `services` may import `shared/config` (for `env.ts`) and
   `features/*/model` (types and pure rules). See [doc 1 §1.5](01-architecture-layers.md#15-as-built-notes).

---

## Feature "definition of done" checklist

- [ ] Lives in `features/<name>/` with a public `index.ts`, and no deep imports from other features.
- [ ] The page is a server component. `'use client'` appears only on interactive leaves.
- [ ] Reads go through `queries.ts` and writes through `actions.ts` (or a service), both returning typed data or a `Result`.
- [ ] No mock data in pages or components. Mocks sit behind the query or service functions.
- [ ] `loading.tsx` skeleton, `error.tsx`, and (for resources) `notFound()` handling.
- [ ] Every list or data view has explicit loading, empty, and error states, built from shared components.
- [ ] Dialogs use `shared/ui/Dialog`, and choices use `RadioCards` or `Tabs`, not custom markup.
- [ ] No hardcoded user-facing strings. All text comes from `messages/*.json`.
- [ ] No `console.log`. Errors go through `reportError`.
- [ ] Links and router calls use `@/i18n/navigation`.
