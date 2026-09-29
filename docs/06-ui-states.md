# 6. Loading, empty, and error states

> **Status (2026-09-28):** not started. As a stopgap, the wallet and bank-account
> tabs show an error with a retry button instead of the empty state when the load
> fails (doc 3, step 4).

## 6.1 Current state

**Loading**

- A single root [`loading.tsx`](../src/app/[locale]/loading.tsx) renders
  `<Loader fullScreen />`, which is `position: fixed; inset: 0`. Every
  navigation covers the **whole viewport**, header and footer included, with
  the logo animation.
- `WalletTab` and `BankAccountsTab` swap the whole panel for an inline `Loader`.
- Submitting states vary: the button text changes ("جاري الحذف..."), a spinner
  appears, the button is merely disabled, or nothing changes (most booking
  actions).
- There are no skeletons anywhere.

**Empty**

| Where | Implementation |
| ----- | -------------- |
| Bookings | `BookingsEmptyState` (Lottie, title, message, CTA to `/cities`) |
| Wallet history | inline `wallet_history_empty` (Lottie + text) |
| Bank accounts | inline `bank_accounts_empty` (Lottie + text) |
| Bank select sheet | plain `<p>` |
| Cities grid (unused component) | plain `<p>` |
| `/cars` with no office groups | **nothing renders** |
| `/cities/[slug]` with no cars | **empty grid, nothing else** |
| `CarsRail` / `CarOfficeRow` with no cars | `return null` (fine for a home rail, wrong for a search result) |
| Notifications | **no empty state** |
| Filters with no match | **no "no results" state, and no "clear filters" action** |

**Error**: none. A failed load shows the empty state (see
[doc 3](03-error-handling.md), E3).

## 6.2 The state model

Every data view is in exactly one of these states:

```
             ┌─────────┐
  request ──►│ loading │
             └────┬────┘
        ┌─────────┼──────────┐
        ▼         ▼          ▼
    ┌───────┐ ┌───────┐  ┌───────┐
    │ empty │ │content│  │ error │──retry──► loading
    └───────┘ └───────┘  └───────┘
```

- **Empty is a *successful* result with zero items.** It can never be inferred
  from a failure or from "not loaded yet".
- **Refetching keeps the content visible** (stale-while-revalidate). A filter
  change shows the previous results dimmed, with a small progress indicator,
  and does not swap to a skeleton.
- **Mutations are separate from view state.** A pending submit never replaces
  the view with a loader. It disables and marks the control that triggered it.

For client-side data the type is explicit:

```ts
// shared/lib/async.ts
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: AppError }
  | { status: 'success'; data: T };        // an empty array is still 'success'
```

For server-rendered data the states map onto App Router files:

| State | Server-rendered page | Section inside a page | Client-fetched data |
| ----- | -------------------- | --------------------- | ------------------- |
| loading | `loading.tsx` (a skeleton of *that* page) | `<Suspense fallback={<XSkeleton/>}>` | `status: 'loading'` → `<XSkeleton/>` |
| error | `error.tsx` | an error boundary around the section | `status: 'error'` → `<ErrorState onRetry/>` |
| not found | `notFound()` → `not-found.tsx` | — | — |
| empty | the page checks `items.length === 0` | same | same |

## 6.3 Shared components (`shared/ui`)

### `Skeleton`

```tsx
<Skeleton width="60%" height={20} />        // a text line
<Skeleton shape="circle" size={40} />
<Skeleton shape="rect" aspectRatio="16/10" /> // an image
```

- Shimmer animation, disabled under `prefers-reduced-motion`.
- `aria-hidden="true"` on the bones. The container has
  `aria-busy="true"` and a visually hidden "Loading…" label.
- Each feature builds **composite skeletons** that match its real layout
  exactly, so nothing jumps when content arrives (CLS): `CarCardSkeleton`,
  `OfficeRowSkeleton`, `CarDetailsSkeleton`, `BookingCardSkeleton`,
  `BookingDetailsSkeleton`, `WalletSkeleton`, `BankAccountListSkeleton`,
  `NotificationListSkeleton`, `ProfileFormSkeleton`.

### `Spinner` and `Button loading`

```tsx
<Button loading={pending} type="submit">{t('wallet.topUp.submit')}</Button>
```

- It keeps its width, shows a spinner in place of the label, and sets
  `aria-busy` and `disabled`.
- The label text does not change to "جاري…". Screen readers get the busy state,
  and the layout does not shift.
- Use the spinner only for short, inline waits (buttons, a small map "locating"
  indicator). Use a skeleton for content.

### `EmptyState`

```tsx
<EmptyState
  illustration="empty"              // lazy Lottie or SVG (Illustration component)
  title={t('bookings.empty.active.title')}
  description={t('bookings.empty.active.description')}
  action={<Button asChild><Link href="/cars">{t('bookings.empty.cta')}</Link></Button>}
  size="page | section | inline"
/>
```

There are two kinds, and they must use different copy:

| Kind | Meaning | Action |
| ---- | ------- | ------ |
| **First use** | The user has never had any (no bookings, no bank accounts) | Guide to the next step ("Book a car", "Add bank account") |
| **No results** | A filter or search matched nothing | "Clear filters" or "Change dates", and keep the filters visible |

### `ErrorState`

```tsx
<ErrorState
  error={error}                     // AppError: picks the message from errors.<code|kind>
  onRetry={retry}                   // shows a "Try again" button when given
  size="page | section | inline"
/>
```

- `role="alert"` for section and inline errors.
- For `unauthorized` it shows a "Log in" action instead of retry.
- For `network` it adds an "offline" hint.

### Timing rules

| Rule | Value |
| ---- | ----- |
| Show a loading indicator only after | 150–200 ms (avoids a flash on fast responses) |
| Once shown, keep it at least | 300–400 ms (avoids flicker) |
| Content refetch (filters, pagination) | keep old content, dim it to about 60% opacity, show a top progress bar |
| Mutation success feedback | `ResultDialog`, auto-closing after 2 s (the current behavior), announced with `aria-live="polite"` |

The delay applies to client-side indicators only. `loading.tsx` and `Suspense`
fallbacks already avoid flashes when the response is fast.

## 6.4 Per-screen specification

| Screen / view | Loading | Empty | Error |
| ------------- | ------- | ----- | ----- |
| **Home**: offers rail, "selected for you" rail | `CarCardSkeleton` × 3 inside the rail | Hide the section (a marketing rail with nothing to show) | Hide the section and report the error (the home page must not break for one rail) |
| **Home**: cities | 4 city-card skeletons | Hide the section | Hide the section and report |
| **`/cars`** (office rows) | `loading.tsx`: filters panel plus 2 × `OfficeRowSkeleton`. On filter change: dim the old rows | **No results**: "لا توجد سيارات مطابقة", with a clear-filters action | `error.tsx` or section `ErrorState` with retry. The filters panel stays usable |
| **`/cities/[slug]`** | Hero image placeholder plus a grid of `CarCardSkeleton` | No results, as on `/cars`. City not found → `notFound()` | Same as `/cars` |
| **`/cars/[carId]`** | `CarDetailsSkeleton` (gallery, title, sidebar card). Reviews in their own `Suspense` | Reviews: "لا توجد تقييمات بعد" | Car not found → a `not-found.tsx` that links back to `/cars`. Other errors → `error.tsx`. Reviews failure → inline `ErrorState` in the reviews card only |
| **Checkout flow** (dates, confirm, payment) | Buttons `loading` while pricing and paying | — | Inline error in the dialog, which stays open. `conflict` ("car no longer available") → an error with "Choose other dates" |
| **Rental search**: branch, airport, station, country lists | List skeleton in the sheet | Search has no match: "لا توجد نتائج" | Inline `ErrorState` in the sheet with retry |
| **Map picker** | Map placeholder until the script loads. Spinner on "locate me" | — | Script load failure → inline error with retry. Geolocation denied → the existing `location_error` message, kept |
| **Account layout** | The sidebar renders at once. `account/loading.tsx` fills only the content area | — | `account/error.tsx`, content area only |
| **Profile** | `ProfileFormSkeleton` | — | Page `ErrorState`. Save failure → inline form error, fields kept |
| **Bookings list** | 4 × `BookingCardSkeleton`; the tabs render at once | **First use**: active has "لا توجد حجوزات حالية" with "ابدأ حجزًا جديدًا" → `/cars`; past has "لا توجد حجوزات سابقة" with no CTA | Section `ErrorState` with retry; the tabs stay |
| **Booking details** | `BookingDetailsSkeleton` | — | Not found → `not-found.tsx` with a link to the list. Action failure (edit, extend, cancel) → `ResultDialog` with an error and the reason |
| **Wallet** | `WalletSkeleton` (balance card plus 4 rows) | History: "لا توجد عمليات على المحفظة بعد", with no CTA (the top-up button is right above) | Balance failure → page `ErrorState`. History failure alone → section error under a working balance card |
| **Bank accounts** | `BankAccountListSkeleton` × 3; the add button renders at once | **First use**: an illustration with "لا توجد حسابات بنكية مضافة" and an "إضافة حساب بنكي" CTA | Section `ErrorState` with retry |
| **Withdraw: bank select sheet** | List skeleton | "لا توجد حسابات بنكية" with a link to `/account/bank-accounts` | Inline error with retry |
| **Notifications** | `NotificationListSkeleton` | "لا توجد إشعارات" (new; missing today) | Section `ErrorState` with retry. "Mark all read" failure → inline error, and the optimistic change is rolled back |
| **Auth** (login, OTP, register) | Button `loading` | — | Field errors (invalid phone, wrong code). `rate_limited` → "Try again in N s" |
| **Contact / Join us forms** | Button `loading` | — | Inline form error. Success → `ResultDialog` |

## 6.5 Copy (i18n)

Add these namespaces to both message files:

```json
"states": {
  "loading": "جارٍ التحميل…",
  "retry": "حاول مرة أخرى",
  "noResults": { "title": "لا توجد نتائج", "description": "جرّب تعديل الفلاتر أو تغيير التواريخ.", "clearFilters": "مسح الفلاتر" }
},
"bookings": { "empty": { "active": { "title": "…", "description": "…" }, "past": { "…": "…" }, "cta": "ابدأ حجزًا جديدًا" } },
"wallet":   { "empty": { "history": "لا توجد عمليات على المحفظة بعد" } },
"bankAccounts": { "empty": { "title": "لا توجد حسابات بنكية مضافة", "cta": "إضافة حساب بنكي" } },
"notifications": { "empty": { "title": "لا توجد إشعارات" } }
```

Error texts live under `errors.*` (see [doc 3](03-error-handling.md)).

## 6.6 Migration steps

1. **Fix the lie first (small PR):** add a `.catch` and an `error` state to
   `useWallet` and `useBankAccounts`, and render an `ErrorState` (a basic
   version is enough) instead of the empty list when loading fails.
2. **Root loading:** change `app/[locale]/loading.tsx` from
   `<Loader fullScreen />` to a content-area skeleton, or remove it once
   segment-level files exist, so the header and footer stay visible during
   navigation. Keep the branded `Loader` for real full-page cases only (for
   example the first auth redirect).
3. **Build `Skeleton`, `EmptyState`, `ErrorState`, `Illustration`**, and add
   `loading` to `Button`.
4. **Replace the four empty-state implementations** with `EmptyState`, and add
   the missing ones (cars, city listing, notifications, no-results).
5. **Add `loading.tsx` and `error.tsx` per segment** as the routes are split
   ([doc 5](05-performance-and-routing.md)): `cars`, `cars/[carId]`,
   `cities/[slug]`, `account`, `account/wallet`, `account/bookings`,
   `account/bookings/[id]`. Build each skeleton against the real layout at
   360px and 1280px, and check CLS in Lighthouse.
6. **Suspense sections:** car reviews, the home rails, and the wallet history,
   once they have their own queries.
7. **Mutations:** move every submit button to `Button loading`, and make every
   failed submit keep its dialog open with an inline error.
8. **Review:** walk the matrix in 6.4 per screen. Test with network
   throttling (Slow 4G), offline mode, and a mock that fails, which
   `services/mocks` should support through a flag such as `?mockFail=wallet`
   in development.
