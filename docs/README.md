# T-Car architecture plan

Status: **in progress** on branch `refactor/architecture-layers` (not merged). See
[Migration status](#migration-status) for what is done and where the code
deliberately differs from these documents.
Last reviewed against the code: 2026-10-21. Status updated: 2026-10-21.

This folder reviews the current front end and sets out the target design and the
migration path for the architecture areas. Each document stands on its own: it covers the
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
| 9 | [Form control and validation](09-form-validation.md) | Which inputs use React Hook Form + Zod, which do not, and where the server remains authoritative |
| - | [Tailwind CSS 4.3 migration](09-tailwind-migration.md) | Proposed replacement for the current SCSS styling layer |
| - | [Account routes flow](account-routes-flow.md) | How account layouts, pages, `children`, and route boundaries compose |

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
6. `auth`, and removal of `react-bootstrap` (removed 2026-10-05).

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
| 0. Bug fixes and dead code | Done (one item waiting on product) | All 10 bugs above fixed. Dead code deleted: `bookings/BookingsTab`, `BookingCarSummary`, `BookingPriceDetails`, `RateBookingButton`, `CityCarCard`, `CitiesGrid`, `lib/i18n.ts`, `layout/I18nProvider.tsx`, and 8 unused path aliases. `npm run typecheck` and `npm run check` (typecheck + lint) added; there is no CI config yet to run them in. React 19.3 (verified with the build and server rendering of every route; not yet checked in a browser). Also fixed on the way: a duplicated mock car id. **Kept by product decision (2026-10-13):** `BookingModal`, `BookingMonthlyModal`, `InsufficientBalanceModal` (unused for now). Optional: a designed Open Graph image (`src/app/opengraph-image.jpg`) |
| 1. Foundations | Done | `features/`, `shared/{ui,lib,hooks,config}`, `services/http`, and import boundaries: `eslint-plugin-boundaries` resolves aliases and relative paths through a default-deny layer allow-list. The existing targeted `no-restricted-imports` checks remain warnings until legacy aliases and reported feature-to-feature deep imports are migrated. `AppError` / `Result` / `reportError`, the `errors` and `states` messages, root `error.tsx` and `global-error.tsx`, a non-blocking root `loading.tsx` with `Skeleton`, and the first Radix `shared/ui` set, each tested and with at least one production caller: `Dialog` (`CountryModal`, `WalletAmountModal`, `BankSelectModal`), `ConfirmDialog`, `ResultDialog`, `Tabs` (insurance terms), `Accordion` (warranties), `RadioCards` (payment method), `Menu` (user menu), `Button` with `loading` / `asChild` / start-or-end icons, `Price` (wallet), `EmptyState` + lazy `Illustration` and `ErrorState` (bookings, wallet, bank accounts). The FAQ became native `<details>` rather than `Accordion` (answers stay in the server HTML). Vitest + Testing Library (`npm run test`, 64 tests). Moved to phase 2: per-segment `loading.tsx`, which real 404 status codes need. Replacing the remaining dialogs and menus is doc 4 / phase 4 work |
| 2. Routing | Done (5 of 5 fractions) | **Done:** (1) the account sections are routes: `/account/{profile,bookings,wallet,bank-accounts,notifications}` in a `(sections)` route group with one layout (title + link sidebar with `aria-current`); each loads only its own data and JS (e.g. notifications 101 kB vs the single 334 kB page before); `/account` and old `/account?tab=<section>` links are real HTTP redirects (`next.config.mjs`). (2) Booking details moved to `/account/bookings/[id]` (outside the group, so the page keeps its full-width layout), with its own title and a permanent redirect from `/my-bookings/[id]`; all of `/account/**` is `noindex`. (3) The bookings list reads `?status=active|past` (links with `aria-current`, rendered on the server, no client state); the details back link returns to the booking's own list. (4) Route-level loading and error boundaries now cover home, account sections, car details, city details, and booking details; car, city, and booking resources have segment-specific not-found screens. **Complete:** filters, sorting, and hero search context are now read from URL parameters by `/cars` and `/cities/[slug]`. |
| 3. Server-first data and auth | Done (4 of 4 fractions) | Reads go through `features/*/queries.ts` for cars, cities, car details, bookings, home, rental search, account profile, and notifications (car and city pages also set their own `<title>`). Auth is NextAuth v5 with the backend token in its `httpOnly` session cookie and a middleware guard ([doc 2](02-server-client-boundary.md#23-auth-across-the-boundary)). Wallet, bank-account, booking, checkout, and contact writes now cross Server Actions and use `fromActionResult`; wallet and bank-account reads remain on browser-only stateful mocks until a user-scoped persistence contract exists. |
| 4. Feature migration | Done (8 of 8 fractions) | All retained modal surfaces now use `shared/ui/Dialog`, including account phone/license/verification, car-detail reviews and branch information, booking forms and payment, booking actions, wallet and bank-account forms, selection flows, auth, and common result dialogs. The shared `OtpInput` now owns digit entry, focus, keyboard, and paste behavior for auth and phone verification. The filter drawers remain intentionally outside the dialog interface. Remaining performance, i18n, image, and SCSS work is tracked in phases 5–8 |
| 5. Performance | Started (fraction 5 of 8) | Done: the Maps script loads only when a map dialog opens; the auth dialog loads on first open; booking-flow, rental-search, wallet, profile, booking-details, and booking-review dialogs load on demand and mount only for their active step; Lottie animations load on first use through `Illustration`; result dialogs use lightweight GIF assets; the header and footer render on the server; the FAQ ships no client JavaScript; hero slides use `next/image` with `fill`, `sizes="100vw"`, and first-slide priority; WOFF2 font files are used for all four active Expo Arabic weights. Decision: retain Swiper for the car rails, hero, and partners; the planned carousel replacement is not being pursued because the measured bundle trade-off does not justify the design and behavior changes. Remaining: the Bootstrap and SCSS items are phase 8 |
| 6. i18n extraction | Complete (10 fractions) | Extracted home, rental-search, layout, account, wallet, bank accounts, my-bookings, car-details, booking flow, cars/cities, legal pages, common controls, date picker, city index, and auth success copy into both locale files. The global error remains intentionally fixed and bilingual because it renders outside the locale layout. |
| 7. Images and assets | Complete (4 fractions + 2 audit follow-ups) | [Doc 7](07-images-and-assets.md): UI icons, static images, API-bound mock URLs, animations, cleanup, and image-weight reductions are complete (fractions 1–4). `cta.png` and `notlogin.png` are retained under `public/images/unused/`, excluded from the registry, pending design confirmation before deletion. **Audit follow-ups (2026-10-04):** (5) ✅ brand filter options come from `carsApi.listBrands()` via `getCarBrands()` instead of `/mock/` paths in `CarFilters` / `CityFilters`, and a lint rule keeps `/mock/…` literals inside `services/mocks`. (6) ✅ removed the duplicate `src/assets/images/logo.png` and unused `brand/logo.svg` (`src/assets/` is now `fonts/` + `animations/`); the image import ban moved to `no-restricted-syntax` so the per-folder lint overrides no longer drop it, and it now covers every image extension. (7) Not pursued (user decision): `payment/wallet.svg` (62 KB) and `payment/tamara.svg` (259 KB) wrap raster images but stay SVG, not WebP. Step 6 (narrow `remotePatterns`, delete `public/mock/`) waits for the API phase |
| 8. Styles compiled from SCSS | Done (7 of 7; optional stage 2 not started) | [Doc 8](08-styles-and-scss.md): drift check done (0 rules differ in meaning between `main.scss` and the committed `main.css`). (1) ✅ Sass pinned to exactly `1.105.0` (the lockfile already resolved it; emitted CSS byte-identical). (2) ✅ the layout imports `main.scss`; Next now compiles all styles. Emitted CSS: 0 rules differ in meaning, 60 differ only in notation, 5 legacy prefixes dropped ([doc 8 step 2 results](08-styles-and-scss.md#step-2-results-2026-10-04)); dev style reload ~1.4 s → ~5 s until step 4. (3) ✅ deleted `main.css`, `main.css.map`, `scripts/sync-office-css.mjs`, and the `css:sync-office` script; `.gitignore` ignores `src/styles/**/*.css` and `*.css.map`; the root plans that pointed at the sync script now point at doc 8. Emitted CSS byte-identical to fraction 2. (4) ✅ Bootstrap is its own stylesheet (`styles/vendor/bootstrap.scss`), loaded before `main.scss`; dev reload after a style edit back to ~1.4 s. 114 app rules lost a `.hN` / `.small` copy that Bootstrap's `@extend` used to add; no visible effect found ([doc 8 step 4 results](08-styles-and-scss.md#step-4-results-2026-10-04)). (5) ✅ Bootstrap trimmed to the partials and 14 of 97 utility groups the markup uses: 228 KB → 62 KB (31 → 10 KB gzip), no remaining rule changed ([doc 8 step 5 results](08-styles-and-scss.md#step-5-results-2026-10-04)). Fix: `.visually-hidden` (loading-screen label) was missed by the inventory and is restored. (6.1) ✅ the global layer (reset, layout, buttons, loader, typography) moved from `main.scss` into `styles/base/`; emitted CSS byte-identical ([doc 8 step 6](08-styles-and-scss.md#step-6-progress)). Plan for the rest of step 6 agreed ([doc 8 step 6 plan](08-styles-and-scss.md#step-6-plan-agreed-2026-10-04)): (step 1) ✅ `shared/ui` normalized to `<Name>/<Name>.tsx` + `.scss` + `.test.tsx` + `index.ts` with named exports and props types (doc 4 §4.4); (step 2) ✅ every `shared/ui` component has tests (43 new, 107 in total); (step 3) ✅ `Form`, `DateTimePicker`, `PhoneField`, `Loader`, `SectionTitle` styles live next to the component (computed styles unchanged in headless Chrome); (step 4) ✅ shared legacy dialog styles in `styles/legacy/_dialogs.scss`, styles of the old `src/components/*` in `styles/legacy/_components.scss`; (5) one `features/<x>/<x>.scss` per feature: ✅ `cities`, ✅ `home`, ✅ `layout`, ✅ `rental-search`, ✅ `cars`, ✅ `car-details`, ✅ `booking`, ✅ `auth`, ✅ `account`, ✅ `bank-accounts`, ✅ `wallet`, ✅ `my-bookings`; (6) ✅ `main.scss` is the `@use` lines plus the not-found and legal page styles (kept there by decision), tokens via `@use`, not-found keyframes moved out of `base/_reset`; (7) ✅ `npm run check:css` (first in `npm run check`) fails when git tracks a `.css` under `src/` or any `.css.map`. Optional stage 2 (each feature's components import their own stylesheet) is not started. Component styles from phase 1 already compile from SCSS |

**Tailwind replacement status (2026-10-24):** The SCSS architecture above is
the historical baseline. The Tailwind 4.3 replacement has migrated the `cars`
surface and removed `features/cars/cars.scss`; the remaining feature surfaces
continue in [09-tailwind-migration.md](09-tailwind-migration.md).

**Styling follow-up (2026-10-23):** The current phase 8 SCSS architecture is
complete and remains active while the replacement migration to Tailwind CSS 4.3
proceeds in [09-tailwind-migration.md](09-tailwind-migration.md). Fractions 1–2
are complete; Fraction 3 is migrating the shared UI primitives, with `Button`,
`Dialog`, `ConfirmDialog`, `ResultDialog`, `Menu`, `Accordion`, `RadioCards`,
`Tabs`, `EmptyState`, `ErrorState`, `Loader`, and `Price` complete.
The current grouped shared-UI fraction covers `Form`, `PhoneField`, `OtpInput`,
`DateTimePicker`, `BackButton`, `MapLocationModal`, `Skeleton`, `PageSkeleton`,
and `SectionTitle`.

The first feature-surface group, `layout` and `home`, is now migrated to
Tailwind utilities; their feature SCSS files and the home FAQ stylesheet are
removed. Focused layout/home tests pass.

The next feature fraction, `rental-search`, is now migrated to Tailwind
utilities for the hero, rental tabs, search bar, and filter drawer. Its feature
SCSS file is removed; focused rental-search tests are the verification step.

The `cars` fraction is now migrated: `CarCard`, `CarOfficeRow`, and `CarsRail`
use Tailwind utilities, and `CarsRail` uses Swiper with RTL direction and
pause-on-hover autoplay. The listing shell, sort bar, filter controls, mobile
filter sheet, and office-row responsive details are also migrated; `cars.scss`
and its import are removed.

The cars listing shell and `SortBar` are now also using Tailwind utilities on
the `/cars` and `/cities/[slug]` routes. The filter panel remains to be migrated.

`FilterPanel`, `CheckboxGroup`, `BrandGrid`, `PriceRangeSlider`, and the
`CarFilters` brand/type chips now use Tailwind utilities for the cars filter
shell and controls. Mobile filter-sheet behavior and responsive details are
also utility-owned; the `cars.scss` feature stylesheet and its import are
removed.

The `car-details` fraction has started with the page grid, sticky booking
column, gallery frame, and quick-information facts migrated to Tailwind. The
remaining pickup information, warranties, addons, insurance, reviews, and
branches sections are planned for the next subfraction.

The booking fraction has started with `CarBookingCard`, `BookingDailyModal`, and
`BookingConfirmModal` migrated to Tailwind. `BookingDailyModal` uses the shared
form controls and button, keeps pickup/drop-off fields in a responsive row, and
owns its calendar, address cards, time selector, and sticky total footer.
`BookingConfirmModal` uses utility-owned summary, booking details, price
breakdown, terms, scroll area, and payment footer styles. `PaymentMethodModal`
also uses utility-owned payment options, points switch, and confirmation action
styles; its legacy booking SCSS block is removed.

### Features

**Phase 1 import-boundary remediation (2026-10-20):** The account shell now receives points data from its App Router section layout and imports the summary card through `features/points/index.ts`. The root layout now supplies the authenticated notifications count to the layout feature. `MapLocationModal` and `LocationData` now live in `shared/ui` and `shared/lib`, respectively, with every caller using that shared API. Rental search now consumes the cars feature only through its public index; that index no longer exposes the server-only `getOffices` read, which the home route imports directly. The initial lint audit is reduced from nine to two boundary errors; both remaining violations are in wallet's bank-account action dependency.


| Feature | Moved to `features/` | Data behind queries / api | Actions return `Result` | Remaining |
| ------- | :---: | :---: | :---: | --------- |
| `wallet`, `bank-accounts` | Yes | Client reads over `*.api.ts`; writes through Server Actions | Yes | Fractions 1–3 complete: wallet and bank-account form, confirmation, and result states use shared dialogs. Left: user-scoped reads/API and forms (doc 3 step 7). Form validation fractions 4–5 add RHF + Zod amount and bank-account rules, re-parsed by the actions |
| `my-bookings` | Yes | Yes | Yes (Server Actions) | Fraction 4 complete: extend, cancel, review, and result dialogs use shared Dialog primitives. Form-validation fraction 8 adds RHF + Zod to review, extend, and edit. Left: `router.refresh()` after an action once the API keeps state |
| `car-details`, `booking` | Yes | Yes | Yes (checkout) | Fraction 5 complete: daily booking, confirmation, payment, and booking result dialogs use shared primitives. Left: keep a failed edit request open inside `BookingDailyModal` and migrate remaining booking-flow details |
| `cars`, `cities` | Yes | Yes | n/a | Fraction 6 complete: the same `CarFilters` surface serves the hero drawer, `/cars`, and city listings. It preserves the hero's selected URL filters when navigating to `/cars`; `/cars` and each city listing keep independent, URL-backed state on their own routes. City listings use the same office-grouped `CarOfficeRow` swipers as `/cars`. Brand options come from `getCarBrands()` (mocked `carsApi.listBrands()`). Left: consolidate the remaining option data (companies, types, services; doc 4) |
| `home`, `rental-search` | Yes | Yes (FAQs, search options) | Yes (Server Action: contact form) | Fraction 7 complete: pickup type, branch, airport, station, map, and country dialogs use shared `Dialog`. The FAQ is native `<details>`; static home content remains component-local |
| `auth` | Yes | NextAuth + mocked `authApi` | Yes (Server Actions) | Auth dialog uses shared `Dialog` and `ResultDialog`; login, OTP, and registration use RHF + Zod (`validation.ts`) with the schemas re-parsed in the actions (doc 9 fraction 1). Real backend endpoints remain a later integration concern |
| `account` (profile, notifications) | Yes | Yes (scoped to the session user) | Yes (Server Actions: save, phone change send and verify, license upload, delete) | Routes per section with a shared layout and `AccountNav`; the loyalty points summary is shown in the account layout and `/account/points` owns the points history view. Common success/failure results now use `shared/ui/Dialog`. Profile save and change/verify phone use RHF + Zod (`validation.ts`) with the schemas re-parsed in the actions (doc 9 fraction 2). License upload uses RHF + Zod (doc 9 fraction 3); left: notification mark-all-read is still static, opening the license details is still a TODO, and remaining dialogs |
| `layout` | Yes | n/a | n/a | The header shell and footer render on the server; mobile navigation, language, and auth are client islands; the user menu uses `Menu`. Left: trimming the client messages (doc 2 step 7), the language switcher on `Menu` |

The `*.api.ts` files are backed by mocks only; no backend endpoint is wired in.
Mock rules that make failures reproducible (OTP `1234`, top-ups over 10,000,
extensions over 30 days, and so on) are documented in each `services/mocks/*.ts`.

### What remains

- Form validation ([doc 9](09-form-validation.md)), 8 of 8 fractions done, one
  commit each: (1) ✅ auth sign-in and registration; (2) ✅ profile save and
  change/verify phone; (3) license upload, complete (JPG/PNG, 5 MB); (4) wallet top-up / withdrawal, complete; (5) bank-account add / edit, complete; (6) contact message, complete (RHF + Zod with server re-parse); (7) daily booking and checkout terms / payment, complete; (8) booking
  review, extend, and edit, complete. Join-us stays blocked until it has a write contract.
- Form validation fraction 1 (auth):
  `zod` 4 and `@hookform/resolvers` 5 added; `features/auth/validation.ts` holds
  the phone, OTP, and registration schemas (messages are `errors.auth.*` keys,
  five new in both locales); the login, OTP, and registration forms use React
  Hook Form + `zodResolver` (`mode: 'onBlur'`, `reValidateMode: 'onChange'`,
  `noValidate`, Enter submits); `requestOtpAction`, `verifyOtpAction`, and
  `registerAction` parse the same schemas before calling the service and return
  `ActionResult` field errors (`shared/lib/validation.ts`: `toValidationError`,
  and `applyFieldErrors` for RHF `setError`); provider codes `auth.invalidCode` /
  `auth.invalidPhone` / `auth.nameRequired` now carry their field. A failed
  submit keeps the dialog step and its values. **Shared form controls are the
  standard for every migrated form:** `FormInput`, `FormSelect`, `FormTextarea`,
  the new `FormCheckbox`, `PhoneField`, and `OtpInput` take an already
  translated `error`, render it, and link it with `aria-invalid` /
  `aria-describedby`; the Form components forward `ref` (for `register`) and
  announce `required` as `aria-required` with an `aria-hidden` asterisk (native
  `required` is not passed, so the contact and join-us forms keep their current
  submit behavior until their own fractions). The three submit buttons use the
  shared `Button` (`size="lg"`, `loading` gives the spinner, `disabled`, and
  `aria-busy`); the auth-only `.auth_btn--whatsapp` and register `.auth_btn`
  rules are gone, and the WhatsApp icon chip keeps its own rule. The step-back
  arrows stay native: `BackButton` calls `router.back()`, not a dialog step.
  The registration terms checkbox is
  checked by the action only; the auth contract has no field for it.
  Assumptions to confirm (doc 9 §9.4): phone is 8–15 digits, any country, sent
  as entered (no canonical format); birth date is a real date not in the
  future (no minimum age); no name/email length limits.
- Form validation fraction 2 (profile and phone, branch
  `refactor/form-validation-profile`): `isPhoneNumber` and `isPastIsoDate` moved
  to `shared/lib/validation.ts` (a second feature needed them, doc 9 §9.1) and
  auth imports them; `features/account/validation.ts` holds the profile, phone,
  and code schemas with `errors.account.*` keys (six new in both locales).
  `saveProfileAction`, `sendPhoneCodeAction`, and `verifyPhoneAction` check the
  session, then parse their input; profile save takes only `fullName`, `email`,
  and `birthDate` and merges them into the stored profile, so the phone and
  license status stay server-managed. `ProfileTab` uses RHF with `FormInput`
  (new optional decorative `icon`, used for the calendar) and a submit `Button`;
  its form closes before the dialogs, because React submit events bubble
  through portals, and uses `display: contents` so the panel layout is
  unchanged. A failed save maps field errors (e.g. `account.profileRejected` on
  the email) and keeps the input; a successful save resets the form to the
  saved values. `EditPhoneModal` and `VerifyPhoneModal` use RHF with
  `PhoneField` / `OtpInput` `error` props and `Button`; their handlers resolve
  with the error, so the three error states in `ProfileTab` are gone. The phone
  input now has a localized accessible name. Removed as dead: the account
  `.form_field`, `.input_wrapper`, `.save_btn` rules and the `.auth_btn` rules
  in `auth.scss`. `%auth_btn` stays only for `.license_modal .primary_btn` until
  fraction 3. Design follow-up (same fraction, checked in headless Chrome, en
  and ar, desktop and 390 px): the change-phone and verify dialogs use the
  auth dialog layout (`auth_modal_wrapper` / `auth_modal`, `login_form` and
  `otp_form` with the back arrow, the number inside the sentence in `<bdi>`,
  centered digits, the resend row), so the buttons get the auth spacing; the
  old `phone_modal` / `verify_modal` styles were removed as dead.
  `account.editPhone` gained `description` and `countrySearchPlaceholder` in
  both locales. The profile rows have 12 px between them, their chevrons point
  forward (`FiChevronRight` + `mirror-in-rtl`), the phone value is isolated LTR,
  and the license warning icon is red again (the success color won on equal
  specificity). `FormInput`'s icon follows the input's `dir`, and a date input's
  native picker button becomes an invisible hit area over it (one icon).
  `.login_form p` now styles only direct children, so `PhoneField`'s error
  keeps its style in both phone forms. Left: an unused `.auth_btn` rule remains
  in `styles/legacy/_components.scss` for the legacy cleanup.
- Form validation fraction 3 (license upload): the dialog now uses RHF +
  Zod with a single selected-file schema. It accepts declared JPG/PNG files
  up to 5 MB and keeps a failed submission open with the file and a localized
  inline error. The Server Action parses the same schema from FormData before
  calling the mock service, which rechecks declared type and size; actual image
  inspection, scanning, and retention remain backend contract follow-ups.
- Form validation fraction 4 (wallet top-up and withdrawal): the wallet validation module defines the shared finite amount schemas. The amount sheet uses RHF + Zod and keeps returned errors inline with its value. Both Server Actions re-parse the schema; top-up uses the current mock maximum (10,000 SAR), and withdrawal uses the current withdrawable balance. Bank-account ownership remains an action check. The mock/API contract still owns daily limits and a future persisted balance check.
- Form validation fraction 5 (bank-account add / edit): `features/bank-accounts/validation.ts` normalizes Saudi IBAN input (spaces removed, upper-cased) and checks the `SA` prefix, two check digits, and 24-character length. The form uses RHF + Zod with the shared `FormInput` and `Button`; its custom bank picker maps local and returned field errors accessibly. Add and edit actions re-parse the payload before applying the stateless mock transition. Unknown bank availability remains an action check, while ownership, duplicates, and checksum verification remain backend contract follow-ups. A rejected submit remains open with its selected bank and IBAN.
- Form validation fraction 6 (contact message): `features/home/validation.ts` trims name, email, reason, booking number, and message; accepts the supplied reason enum and treats a blank booking number as absent. The contact form uses RHF + Zod with shared controls, keyboard submission, pending state, localized field errors, and preserved values after a failed send. `sendContactMessageAction` re-parses the normalized payload before calling the mock. Booking numbers currently have a client-side 50-character bound pending the product length, moderation, and abuse/rate-limit contract.
- Form validation fraction 7 (daily booking and checkout): `features/booking/validation.ts` validates future ordered dates, known time slots, normalized bounded notes and addresses, finite price fields, accepted payment methods, and explicit terms acceptance. `BookingDailyModal` uses RHF + Zod for calendar, time, location, and notes input; `BookingConfirmModal` blocks payment until the eligibility terms are accepted; and the booking action re-parses the request before the mock service. The 500-character notes and 200-character address bounds are provisional until the product contract sets final limits; availability, price, wallet/provider eligibility, and payment results remain server rules.

- Form validation fraction 8 (booking review, extend, and edit): my-bookings/validation.ts defines the 1–5 integer rating, normalized optional review (provisional 1000-character bound), positive integer extension days, and the shared booking-details edit schema. Review and extension dialogs use RHF + Zod with shared controls and pending states; edit reuses the daily booking form and keeps its values open with inline field errors when the request fails. The three Server Actions re-parse their payloads before calling the mock service. Completion, authorization, availability, extension limits, and review eligibility remain server rules.
- Shared `Button` adoption (decision 2026-10-18): every text action button uses
  `shared/ui/Button` (with `loading` for pending submits) for a consistent look
  and pending state. Icon-only, tab, chip, toggle, and filter-option buttons are
  out of scope (they stay native or use their own shared component). At the
  decision, 103 native `<button>`s remained in 49 files outside `shared/ui`.
  Fractions, one commit each: (1) ✅ auth forms (with doc 9 fraction 1);
  (2) submit buttons move with each later doc 9 form fraction: ✅ profile save,
  change phone, and verify phone; then license, wallet, bank accounts, contact,
  booking, reviews; (3) remaining action buttons per feature: `account` (only
  `LicenseModal` is left, with fraction 3), `my-bookings` (details header, cancel, extend,
  review), `booking` (daily, confirm, payment, booking card), `bank-accounts`,
  `wallet`, `rental-search` dialogs and hero, `cars` / `cities`, `layout`,
  `points` / `notifications`; (4) `global-error.tsx` only if the shared button
  styles load outside the locale layout. The three product-held modals
  (`BookingModal`, `BookingMonthlyModal`, `InsufficientBalanceModal`) are left
  until product decides.
- Phase 2 routing and Phase 3 Server Action fractions are complete. Wallet and
  bank-account reads still use browser-only stateful mocks until user-scoped
  persistence/API contracts are available.
- Phase 4 feature and dialog migration is complete. Wallet and bank-account reads
  still await a user-scoped persistence/API contract.
- Phase 5 is complete apart from the Bootstrap/SCSS work tracked in phase 8.
  Swiper is intentionally retained for the existing car rails, hero, and
  partners carousels.
- Phase 6 is complete with ten fractions covering feature copy, static/legal pages, common controls, date picking, city index copy, and auth success copy. The global error remains intentionally fixed and bilingual because it renders outside the locale layout.
- Follow-up decision (2026-10-13): audit and fix remaining user-facing messages across the application as ongoing i18n cleanup; this is separate from the completed Phase 6 fractions. Fraction 1 (`contact` and `join-us`) is complete: contact-us uses localized full name, email, contact reason, optional booking number, and message fields; join-us is a localized shared dialog opened by the home CTA, with first name, phone, company name, company size, and email. There is no standalone `/join-us` page.
- Rental-search follow-up (2026-10-13): the home hero now has a localized car search field and a filter action that opens the shared details-page car filters in a responsive drawer; submitting the search or filters navigates to `/cars` with URL-backed criteria.
- Rental-search visual follow-up (2026-10-13): the hero now has localized title and subtitle content, a dedicated cinematic overlay, responsive glass search controls, and reduced-motion-aware entrance animations.
- Layout follow-up (2026-10-13): the signed-in header now exposes a notifications icon with an unread counter, an ISO-code language control backed by the shared Radix menu, a location picker beside the logo, and a fluid logo width for narrower desktop viewports.
- Phase 8 decision (2026-10-13): the optional stage 2 component-level SCSS import split will not be pursued.
- Phase 7 is complete: the four planned fractions plus two follow-ups from an
  audit on 2026-10-04. Done: (5) brand filter logos behind the cars API, with
  a lint guard for `/mock/` literals; (6) duplicate logo files deleted and the
  image import ban enforced in every folder. Not pursued (user decision):
  converting the `wallet` and `tamara` payment SVGs to WebP. Mock image fixtures are temporary and
  will be deleted after backend image URL integration. `cta.png` and
  `notlogin.png` remain pending design confirmation. Integration follow-up:
  the brand filter's label comes from `cars.brands.<slug>`; the API will
  probably send a localized name instead.
- Phase 8 is complete (the global layer is in
  `styles/base/`, every feature has its own stylesheet, `main.scss` holds `@use` lines and the not-found / legal page styles): Sass is pinned, the layout loads
  a trimmed `vendor/bootstrap.scss` then `main.scss`, and the generated CSS and
  sync script are gone. A new Bootstrap class needs its partial or utility
  group added to `vendor/bootstrap.scss`. `react-bootstrap` was removed
  from `package.json` (nothing imported it; 2026-10-05). Turn off any
  editor Sass watcher (Live Sass Compiler): its output is git-ignored and
  unused. `npm run check:css` fails if compiled CSS is committed again. The optional stage 2 component-level SCSS import split is intentionally not pursued. Known build warnings,
  present before phase 8: autoprefixer flags `end` (use `flex-end`) in
  `main.scss`, and `jose` (NextAuth) uses Node streams in the Edge middleware.
- Bug found during phase 8 (not fixed): `app/[locale]/not-found.tsx` (`.not-found-page`) is
  practically unreachable. The cars, cities and booking segments have their own not-found
  screens, and an unknown URL such as `/en/no-such-page` gets Next's default 404 without the
  app layout (there is no root `app/not-found.tsx` and no catch-all route).
 - Fixed (2026-10-13): `features/home/components/ContactInfo.tsx` now uses the
   `contact` namespace for its labels and values; the home contact block no longer
   throws `MISSING_MESSAGE` for `phoneValue`, `emailValue`, or `addressValue`.
 - Result dialog follow-up (2026-10-14): `shared/ui/ResultDialog` now uses the
   success/error GIF animations, has an optional action, closes on backdrop or
   after a default two-second delay, and has no close button. The GIFs are served
   from `public/animations/`; `BookingDetailsHeader` and the remaining result
   callers use it directly without local success/failure wrappers, and it has
   no visible title. Account deletion keeps the old failure/confirmation surface
   under the clearer `shared/ui/AlertDialog` name; bank-account deletion uses
   `ConfirmDialog`. `JoinUsForm` now lives in `features/home/components` beside
   its only caller.
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
  the wrong behavior): ~~`FormInput` / `FormSelect` / `FormTextarea` show `*` for
  `required` but never pass `required` to the control, and do not link the error
  to it~~ (fixed in doc 9 fraction 1: `aria-required`, `aria-invalid`,
  `aria-describedby`); `ResourceNotFound` labels its link
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
- `BookingModal`, `BookingMonthlyModal` and `InsufficientBalanceModal` are kept
  (product decision, 2026-10-13), though nothing imports them yet. They render in
  the shared `Dialog` (role, accessible name, focus trap, scroll lock, Escape and
  backdrop dismissal; the monthly map dialog mounts only while open), and their
  copy is in both locale files: `booking.daily` (shared with `BookingDailyModal`,
  plus `pickupTime`), `booking.monthly`, `wallet.insufficient`. The booking
  dialogs are as wide as their form with a sticky footer, the calendar month
  arrows follow the reading direction, and the monthly picker's styles live in
  `styles/legacy/_components.scss` (all 2026-10-13). Left: at 12 months the
  picker's slider thumb is partly clipped at the end of the track.

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
