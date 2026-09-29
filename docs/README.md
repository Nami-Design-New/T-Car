# T-Car architecture plan

Status: **in progress** on branch `refactor/architecture-layers` (not merged). See
[Migration status](#migration-status) for what is done and where the code
deliberately differs from these documents.
Last reviewed against the code: 2026-09-28 (commit `b0529f3`). Status updated: 2026-09-29.

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

- Fix every bug in the table above.
- Delete dead code: `lib/i18n.ts`, `layout/I18nProvider.tsx`,
  `bookings/BookingsTab.tsx` (duplicate of `account/BookingsTab.tsx`),
  `cities/CityCarCard.tsx`, `home/Cities/CitiesGrid.tsx`,
  `bookings/details/{BookingCarSummary,BookingPriceDetails,RateBookingButton}.tsx`,
  `modals/{BookingModal,BookingMonthlyModal,InsufficientBalanceModal}.tsx`.
  Confirm with product first that the monthly booking and insufficient-balance
  dialogs are not needed soon. If they are, move them into their feature folder
  instead of deleting them.
- Add `npm run typecheck` (`tsc --noEmit`) and run it with `lint` in CI.
- Upgrade to React 19 and `@types/react@19`. The Next 15 App Router is built for
  React 19, and the plan uses `useActionState` and `useOptimistic`.

### Phase 1: Foundations (about 1 week)

- Create the `features/`, `shared/`, and `services/http/` folders and the import
  rules ([doc 1](01-architecture-layers.md)).
- Build `services/http` with `AppError`, `toAppError`, and `Result`
  ([doc 3](03-error-handling.md)).
- Build the first `shared/ui` set on Radix: `Dialog`, `ConfirmDialog`,
  `ResultDialog`, `Tabs`, `RadioCards`, `Accordion`, `DropdownMenu`, `Button`
  with `loading`, `Price`, `EmptyState`, `ErrorState`, `Skeleton`
  ([doc 4](04-component-design.md), [doc 6](06-ui-states.md)).
- Add root `error.tsx`, `global-error.tsx`, and a non-blocking root `loading.tsx`.

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
([doc 5](05-performance-and-routing.md)).

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

---

## Migration status

Branch `refactor/architecture-layers`, one commit per step, each checked with
`tsc`, lint, `next build`, and a smoke test against `next start`. Nothing is
merged or pushed yet.

### Phases

| Phase | Status | Notes |
| ----- | ------ | ----- |
| 0. Bug fixes and dead code | Partly done | All 10 bugs above fixed. Deleted: `bookings/BookingsTab`, `BookingCarSummary`, `BookingPriceDetails`, `RateBookingButton`, `CityCarCard`, `CitiesGrid`. Still open: `lib/i18n.ts` and `layout/I18nProvider.tsx`; a designed Open Graph image is an enhancement. **Waiting on product:** `BookingModal`, `BookingMonthlyModal`, `InsufficientBalanceModal` (unused, kept). Not started: `typecheck` script, React 19 |
| 1. Foundations | Partly done | Done: `features/`, `shared/{ui,lib,hooks,config}`, `services/http`, the import rules (as warnings), `AppError` / `Result` / `reportError`, the `errors` messages. Not started: Radix `shared/ui` set, `error.tsx`, `global-error.tsx`, non-blocking `loading.tsx` |
| 2. Routing | Not started | Account sections are still tabs (`?tab=` works as a stopgap); filters and sort are not in the URL; `/cars` still ignores the hero's search parameters |
| 3. Server-first data and auth | Mostly done | Pages read through `features/*/queries.ts` for cars, cities, car details, bookings, home, rental search, account profile, and notifications. Auth is NextAuth v5 with the token in its `httpOnly` session cookie and a middleware guard ([doc 2](02-server-client-boundary.md#23-auth-across-the-boundary)). Wallet, bank accounts, and bookings actions still run as client hooks (see below) |
| 4. Feature migration | Mostly done | See the table below |
| 5. Performance | Not started | Only the Maps script fix from phase 0 |
| 6. i18n extraction | Not started | New strings (errors, contact form) are in `messages/*.json`; the existing Arabic text is not |
| 7. Images and assets | Planned | [Doc 7](07-images-and-assets.md): inventory and classification of all 66 files done; migration not started |

### Features

| Feature | Moved to `features/` | Data behind queries / api | Actions return `Result` | Remaining |
| ------- | :---: | :---: | :---: | --------- |
| `wallet`, `bank-accounts` | Yes | Client hooks over `*.api.ts` (stateful mocks) | Yes | Server Actions, forms (doc 3 step 7), dialogs (doc 4) |
| `my-bookings` | Yes | Yes | Yes (client hook) | Route move to `/account/bookings/[id]`, `router.refresh()` after an action once the API keeps state |
| `car-details`, `booking` | Yes | Yes | Yes (checkout) | A failed edit request cannot stay open inside `BookingDailyModal` yet |
| `cars`, `cities` | Yes | Yes | n/a | Filters and sort in the URL; merging `CarFilters` / `CityFilters` (doc 4) and their option data |
| `home`, `rental-search` | Yes | Yes (FAQs, search options) | Yes (contact form) | `Partners` and `WhyChooseUs` still hold their static content |
| `auth` | Yes | NextAuth + mocked `authApi` | Yes (Server Actions) | Real endpoints; `react-bootstrap` (the dialog still uses its `Modal`) |
| `account` (profile, notifications) | Yes | Yes (scoped to the session user) | Yes (Server Actions: save, phone change send and verify, license upload, delete) | Notification mark-all-read is still static; opening the license details is still a TODO; account routes, forms (doc 3 step 7), and dialogs remain |
| `layout` | Yes | n/a | n/a | Header shell and footer render on the server; mobile navigation, language, and auth are client islands. Trimming client messages and dead `I18nProvider` cleanup remain |

The `*.api.ts` files are backed by mocks only; no backend endpoint is wired in.
Mock rules that make failures reproducible (OTP `1234`, top-ups over 10,000,
extensions over 30 days, and so on) are documented in each `services/mocks/*.ts`.

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
6. **Wallet, bank accounts, and booking actions run in the browser**, through client
   hooks that return `Result`. Their mocks keep state (wallet, bank accounts) or the
   account page was a client component, so Server Actions wait for the account
   routes (phase 2) and a real API.
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
