# 5. Performance and routing

> **Status (2026-09-30):** routing step 1 done (account routes). Performance:
> the Maps script, the auth dialog, and Lottie load on first use. The hero sends
> `airportId`, `stationId`, and `countryId` to `/cars`, which still reads none of
> its search parameters.

## Part A: Routes, URL state, or tabs

### A.1 The rule

| Make it a... | When | Examples |
| ------------ | ---- | -------- |
| **Route** (its own `page.tsx`) | People need to link to it, bookmark it, or share it. The back button should return to it. It loads its **own** data. It needs its own `<title>` or SEO. It is a big, distinct screen. | account sections, booking details, car details |
| **URL search parameter** (same page, `?key=value`) | It is a *view* of the same data (filter, sort, sub-list, page number) that should survive a refresh or a shared link, and it does not need its own layout. | bookings active/past, car filters, sort, search dates |
| **Local state tab** (`useState` / Radix `Tabs`) | It is a small switch between pieces of content that are **already loaded**, and nobody would share or bookmark it. | insurance terms/cancellation |
| **Local state machine** (a dialog flow) | It is a transient multi-step task that should be finished or abandoned as a whole. A refresh in the middle may reset it. | top-up, withdraw, add bank account, checkout steps, phone change |

A quick test: *"If a user refreshes the page, or pastes the URL to a friend,
should they see this same view?"* If yes, it is a route or a search parameter.
If no, it is local state.

### A.2 Current route map

```
/[locale]                    home
/[locale]/cars               office rows (ignores every search param the hero sends)
/[locale]/cars/[carId]       car details
/[locale]/cities             cities grid
/[locale]/cities/[slug]      city listing (grid + filters + sort, all local state)
/[locale]/account            ONE page, 5 useState tabs
/[locale]/my-bookings/[id]   booking details (back link to /account?tab=bookings does nothing)
/[locale]/contact  /join-us  /why  /privacy  /terms
```

### A.3 Target route map

```
/[locale]
/[locale]/cars                        ?type&city&branch&lat&lng&from&to&brand&carType&priceMin&priceMax&company&service&sort&page
/[locale]/cars/[carId]                ?from&to (carried over from the search so the booking card pre-fills)
/[locale]/cities
/[locale]/cities/[slug]               same search params as /cars; renders the same CarListing with city fixed
/[locale]/account                     → redirect to /account/profile
/[locale]/account/layout.tsx          sidebar nav (links) + <main> content slot
/[locale]/account/profile
/[locale]/account/bookings            ?status=active|past   (default active)
/[locale]/account/bookings/[id]
/[locale]/account/wallet
/[locale]/account/bank-accounts
/[locale]/account/notifications
/[locale]/my-bookings/[id]            → permanent redirect to /account/bookings/[id]
/[locale]/booking/result              ?id&status  (payment gateway return URL, when real payments arrive)
/[locale]/contact  /join-us  /why  /privacy  /terms
```

```
app/[locale]/account/
  layout.tsx            server: <AccountNav/> (links with aria-current) + {children}
  page.tsx              redirect('/account/profile')
  loading.tsx           content-area skeleton (the sidebar stays)
  error.tsx             content-area error (the sidebar stays)
  profile/page.tsx
  bookings/page.tsx
  bookings/[id]/page.tsx   bookings/[id]/not-found.tsx
  wallet/page.tsx       wallet/loading.tsx
  bank-accounts/page.tsx
  notifications/page.tsx
```

Add the redirects in `next.config.mjs`:

```js
async redirects() {
  return [{ source: '/:locale/my-bookings/:id', destination: '/:locale/account/bookings/:id', permanent: true }];
}
```

### A.4 Every tab-like UI, classified

| UI | Today | Target | Why |
| -- | ----- | ------ | --- |
| Account sidebar (profile, bookings, wallet, bank accounts, notifications) | `useState` in `account/page.tsx` | **Routes** under `/account/*` | Each loads its own data. Links such as "go to my bookings" after checkout need a URL. The browser back button should work. Only the open section's JS and data load |
| Bookings active / past | `useState` in `BookingsTab` | **Search param** `?status=` with `Tabs.LinkList` | Same data source, just a filter. Survives refresh. The booking details back link can return to the right list |
| Car filters and sort (`CarFilters`, `CityFilters`, `SortBar`) | Local state that **filters nothing** | **Search params**, read on the server | Filtering and sorting happen on the server or backend. The result is shareable, and the hero search lands on a pre-filtered page |
| City search dates (`CityHero`) | Already writes to the URL (good) | Keep, with the shared param names `from` and `to` | Consistent with `/cars` |
| Hero rental type (daily, monthly, airport, station, international) | Buttons that open dialogs | **Local state machine** (`RentalSearch`) that ends with a `router.push('/cars?…')` | A transient task. The **result** is a URL |
| Hero steps (pickup type → map / branch / airport / station / country) | 6 booleans | One reducer, with each step a dialog | Transient |
| Insurance "terms / cancellation" | `useState` | **Local tabs** (Radix `Tabs`) | Small, already loaded, never shared |
| FAQ, warranties | `useState` | **Accordion** | Not tabs at all |
| Car booking: dates → confirm → payment → success | `step` state (good) | Keep as a **state machine**. After success, `router.push('/account/bookings/[id]')`, a real route | The flow is transient. The booking it creates is a resource |
| Wallet and bank flows | Typed state machines (good) | Keep | Transient |
| Auth (login → OTP → register) | react-bootstrap modal, `step` state | Keep as a dialog flow. Also open it from `?auth=login&next=…` so the middleware guard and 401 handling can trigger it | A deep-linkable *entry*, but a transient flow |
| Reviews list | Dialog | Keep as a dialog. Optionally, an intercepting route later if reviews need SEO | — |

### A.5 URL state implementation

- **Read on the server.** `page.tsx` receives `searchParams`, parses them with a
  single schema (`features/cars/searchParams.ts`, using `zod` with defaults),
  and passes typed filters to the query. There is no client-side filtering of
  a full list.
- **Write from the client.** A small `useUpdateSearchParams()` hook in
  `shared/hooks` calls `router.replace` for filters (no history entry per chip
  click) and `router.push` for a new search. Use `useTransition` so the current
  results stay visible while the new ones load. For the price slider and the
  search box, debounce by about 300 ms.
- Use the **locale-aware** router from `@/i18n/navigation`.
- If this grows, [`nuqs`](https://nuqs.47ng.com/) is a well-tested library for
  typed search-param state in the App Router. It is optional; the hand-written
  hook is enough for now.

## Part B: Performance

### B.1 Findings, by impact

| # | Finding | Impact | Fix |
| - | ------- | ------ | --- |
| P1 | **Google Maps loads on every home page visit.** `Hero` always mounts `MapLocationModal`, and `useJsApiLoader` runs before `if (!open) return null`. | High: roughly several hundred KB of third-party JS plus network requests on the most visited page | Mount the map dialog only while it is open, and load it with `next/dynamic({ ssr: false })` |
| P2 | **The header is client code on every page**, and so is everything it imports: `AuthModal` (react-bootstrap), three auth forms, and the phone input library. | High: on every route | Server header with islands. Lazy-load `AuthDialog` on click ([doc 2](02-server-client-boundary.md)) |
| P3 | **The home page is almost entirely client code.** Hero with Swiper and 6 dialogs, Cities, Partners (Swiper), FAQ, Why, Contact. | High | Server sections, client leaves only, lazy dialogs |
| P4 | **All dialogs are imported eagerly** by their parents (`Hero` 6, `BookingDetailsHeader` 4, `CarBookingCard` 4, `ProfileTab` 4, `WalletSection` 4). | Medium–high | `const X = dynamic(() => import('./XDialog'))` and render `{open && <X/>}` |
| P5 | **Three carousel approaches.** Swiper in `Hero`, `Partners`, and `CarOfficeRow`, plus the custom scroll-snap `useCarouselRail` in `CarsRail` and `Cities`. | Medium: Swiper JS and CSS on home and `/cars` | One `Carousel` on CSS scroll-snap. `Partners` becomes a CSS marquee, and `Hero` becomes a CSS cross-fade. Then remove `swiper` |
| P6 | **Lottie is imported directly** (`lottie-react` plus the JSON) in `WalletTab`, `BankAccountsTab`, `BookingsEmptyState`, and `SuccessModal`. | Medium | A lazy `Illustration` component. Consider static SVGs for empty states |
| P7 | **Hero slides use CSS `background-image`** with the raw `.src`, so there is no resizing, no modern format, and no priority hint. This is the LCP element. | High for LCP | `next/image` with `fill`, `priority` on the first slide, and `sizes="100vw"`. Lazy-load the others |
| P8 | **All of Bootstrap plus 12.7k lines of SCSS** compile into one 22k-line global CSS file on every route. | Medium | Bootstrap partials only, and split the SCSS ([doc 4](04-component-design.md)) |
| P9 | **Fonts:** 4 `.ttf` weights (plus an unused `Book` file), and a casing bug in the path. | Medium | Convert to `woff2`. Check whether all 4 weights are used. Fix `Light` |
| P10 | **Two phone input libraries** (`react-phone-input-2` and `react-phone-number-input`). | Low–medium | Keep one |
| P11 | **`images.remotePatterns` allows `hostname: '**'`**, so the image optimizer will fetch and resize any URL on the internet. | Security and cost | Restrict to the API/CDN host(s) |
| P12 | **All messages are sent to the client** (`NextIntlClientProvider` without `messages`). | Low now, grows with extraction | `pick()` the needed namespaces |
| P13 | **No data caching strategy.** The pages are mocks for now. | Future | See B.3 |
| P14 | **The root `loading.tsx` is a full-screen `position: fixed` loader**, so every navigation blanks the whole viewport, header included. | UX and perceived performance | Per-segment skeletons ([doc 6](06-ui-states.md)) |
| P15 | **`BookingCountdown` re-renders every second** but shows only days, hours, and minutes. | Low | Tick every 60 s, aligned to the minute |
| P16 | **Hero keeps 12 `useState`s.** Every selection re-renders the whole hero, including Swiper. | Low | One reducer in a leaf component. The Swiper removal (P5) helps too |

### B.2 Patterns to adopt

**Lazy dialog:**

```tsx
'use client';
import dynamic from 'next/dynamic';
const MapPickerDialog = dynamic(() => import('./MapPickerDialog'), { ssr: false });

{step === 'map' && <MapPickerDialog open onClose={back} onConfirm={onLocation} />}
```

To avoid a delay on first open, start the import on hover or focus of the
trigger: `onPointerEnter={() => import('./MapPickerDialog')}`.

**Streaming with Suspense.** On the car details page, render the main info at
once and stream the slower parts:

```tsx
<CarMain car={car} />
<Suspense fallback={<ReviewsSummarySkeleton />}>
  <ReviewsSummary carId={car.id} />   {/* async server component, own fetch */}
</Suspense>
```

**Image checklist:** every `next/image` has a `sizes` value that matches the
layout (already good in `CarCard`). Only the LCP image gets `priority`. Car
images from the API use a host listed in `remotePatterns`.

### B.3 Caching strategy (for when the API arrives)

| Data | Freshness | How |
| ---- | --------- | --- |
| Cities, offices, brands, filter options, FAQ | Hours | `fetch(url, { next: { revalidate: 3600, tags: ['cities'] } })` |
| Car listing for a search | Minutes, varies by params | `revalidate: 60`, or `no-store` if availability must be live |
| Car details | Minutes | `revalidate: 300`, tag `car:<id>`. `generateStaticParams` for top cars is optional |
| Account data (profile, wallet, bookings, bank accounts, notifications) | Per user, always fresh | `cache: 'no-store'`. Mutations call `revalidatePath` or `revalidateTag` |
| Marketing pages (why, privacy, terms, contact) | Static | Fully static. Remove `'use client'` so they can be prerendered |

Use `React.cache()` around a query that is called from both `generateMetadata`
and the page, so it runs once per request.

### B.4 Measuring

1. Add `@next/bundle-analyzer` (dev only) and a script:
   `"analyze": "ANALYZE=true next build"`.
2. Before starting, record for `/`, `/cars`, `/cars/[id]`, and `/account/wallet`:
   First Load JS from `next build`, plus Lighthouse mobile LCP, INP, CLS, and
   total blocking time.
3. Each performance PR states its before and after numbers.
4. Suggested budgets after the migration: home First Load JS under 150 KB gzip,
   LCP under 2.5 s on a mid-range phone over 4G, CLS under 0.1.

## Migration steps

**Routing**

1. ✅ Create `account/layout.tsx` with the nav as `Link`s, one `page.tsx` per
   section, and `account/page.tsx` redirecting to `/account/profile`. Move each
   tab's content into its page unchanged at first. (The redirects are in
   `next.config.mjs`, so they are real HTTP redirects; old `?tab=` links map to
   their section.)
2. Add the `/my-bookings/:id` redirect and move the details page. Fix the back
   link to `/account/bookings?status=…`.
3. Bookings status as a search parameter, using `Tabs.LinkList`.
4. Car search params: build the schema, have `/cars` and `/cities/[slug]` read
   it, have the filters panel write it, and make the hero submit into it.
   Replace `SortBar`'s local state with the same mechanism.
5. `?auth=login&next=` opens the auth dialog, which the middleware guard
   needs.

**Performance** (independent PRs, in order of payoff)

1. P1: lazy map dialog.
2. P7: hero `next/image`.
3. P4: lazy dialogs everywhere.
4. P2: header split and lazy auth dialog.
5. P6: lazy Lottie or static illustrations.
6. P5: one carousel, remove Swiper.
7. P8 and P9: CSS split, Bootstrap partials, `woff2` fonts.
8. P10–P12, P15: phone library, image hosts, messages, countdown.
