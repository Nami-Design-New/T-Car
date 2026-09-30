# 1. Architecture layers

> **Status (2026-09-28):** steps 1–5 largely done on `refactor/architecture-layers`;
> step 6 not started. See [§1.5](#15-as-built-notes) for where the code differs.

## 1.1 Current state

```
src/
  app/[locale]/     pages. Several hold large inline mock data sets
  components/       grouped partly by page (home, car-details) and partly by kind (modals, common, filters)
  data/             mock data, imported directly by pages and components
  services/         api.ts (axios), cars.service.ts (unused), wallet and bankAccounts mock services
  hooks/            generic hooks next to feature hooks (useWallet, useBankAccounts)
  types/            car.ts: 335 lines of domain types and component prop types together
  utils/ constants/ lib/ (dead) i18n/ styles/
```

### Problems

| # | Problem | Evidence |
| - | ------- | -------- |
| L1 | **Pages own data.** Mock data sits inside route files, so swapping in the real API means editing pages. | `account/page.tsx` (profile, notifications, bookings), `cars/[carId]/page.tsx` (120 lines of details), `my-bookings/[id]/page.tsx`, `cities/[slug]/page.tsx` |
| L2 | **Components own data.** Components hardcode their own lists. | `home/Cities` (`MOCK_CITIES`), `FAQ` (`FAQS`), `CarFilters`/`CityFilters` (`COMPANIES`, `BRANDS`), `StationAndAirportInfo` (`branches`), `BookingDetailsHeader` (a fake `bookingDetails`) |
| L3 | **Two ways to reach data.** `wallet` and `bankAccounts` go through a service, but `cars`, `offices`, and `cities` are imported straight from `@/data`. The real `carsService` is never called. | `cars/page.tsx` imports `MOCK_CARS` and `groupCarsByOffice` |
| L4 | **Components folder mixes axes.** `modals/` groups by *kind*, while `car-details/` groups by *page*. A booking dialog lives in `modals/` but is used only by `car-details/`. You cannot tell what belongs to a feature. | 23 files in `modals/`, each used by exactly one feature |
| L5 | **Types folder mixes concerns.** Component props (`RentalTabsProps`, `MapLocationModalProps`, …) sit next to domain models. Everything is named `car.ts`. | `types/car.ts` |
| L6 | **Business rules in UI.** Status grouping, price maths, and IBAN normalization are spread across components and services. | `ACTIVE_STATUSES` in `BookingsTab`; `discountPercent` in `CarCard`; `normalizeIban` in the service, then re-applied in `BankAccountFormModal` |
| L7 | **No import rules.** Anything can import anything, and there are four alias styles for the same folder (`@/components`, `@components`, `../`, `../../../`). | Throughout |
| L8 | **Dead layers.** `lib/i18n.ts`, `layout/I18nProvider.tsx`, and the `@locales/*` alias (the folder does not exist). | — |

## 1.2 Target layers

```
┌────────────────────────────────────────────────────────────┐
│ app/[locale]/**           ROUTING LAYER                    │
│   page / layout / loading / error / not-found              │
│   reads params, calls feature queries, composes features   │
├────────────────────────────────────────────────────────────┤
│ features/<domain>/        FEATURE LAYER                    │
│   components/  hooks/  queries.ts  actions.ts              │
│   model.ts (types + pure rules)  index.ts (public API)      │
├────────────────────────────────────────────────────────────┤
│ shared/                   SHARED LAYER (no domain words)   │
│   ui/  lib/  hooks/  config/                               │
├────────────────────────────────────────────────────────────┤
│ services/                 DATA-ACCESS LAYER                │
│   http/ (client, errors, auth)   <domain>.api.ts   mocks/  │
└────────────────────────────────────────────────────────────┘
        i18n/  styles/  assets/   (cross-cutting, no logic)
```

### Dependency rule

Imports may only point **down** or **sideways within the same feature**:

| From ↓ may import → | `app` | `features/x` | `features/y` | `shared` | `services` |
| ------------------- | :---: | :----------: | :----------: | :------: | :--------: |
| `app`               | –     | ✅ (index only) | ✅ (index only) | ✅ | ❌ (go through a feature) |
| `features/x`        | ❌    | ✅           | ✅ (index only) | ✅ | ✅ |
| `shared`            | ❌    | ❌           | ❌           | ✅ | ❌ |
| `services`          | ❌    | ❌           | ❌           | `shared/lib` only | ✅ |

- `shared` never knows a domain word such as car, booking, or wallet. If a
  component needs one, it belongs to a feature.
- Feature-to-feature imports go through `index.ts`. If two features import each
  other a lot, the shared part is a new, smaller feature or belongs in `shared`.
- Pages never call `services` directly. They call a feature query, which gives
  one place to add caching, mapping, and error translation.

### What each layer contains

**`app/[locale]/**` (routing).** It handles URL-to-screen composition only: it
reads `params` and `searchParams`, calls `features/*/queries`, calls
`notFound()` or `redirect()`, exports `metadata` or `generateMetadata`, and
renders feature components. It holds no JSX-heavy markup, no mock data, and no
business rules. Target size: under about 60 lines per page.

**`features/<domain>/` (feature).**

```
features/wallet/
  components/        WalletPanel.tsx, BalanceCard.tsx, TransactionList.tsx, TopUpDialog.tsx, WithdrawFlow.tsx
  hooks/             useWalletFlow.ts        (client-only UI state machine)
  queries.ts         getWallet()             ('server-only'; reads)
  actions.ts         topUpAction(), withdrawAction()   ('use server'; writes → Result)
  model.ts           WalletSummary, WalletTransaction, MIN_TOP_UP, canWithdraw()
  index.ts           public exports
```

`model.ts` holds types and **pure** domain rules, with no React and no I/O. This
is where `ACTIVE_STATUSES`, the discount percentage, and IBAN normalization
belong, so they can be unit-tested without rendering.

**`shared/`.**

- `shared/ui/`: the design system (see [doc 4](04-component-design.md)).
- `shared/lib/`: `cn` (the current `classNames`), formatters (`formatAmount`,
  `formatDate`), `Result`, `AppError`, `reportError`.
- `shared/hooks/`: `useMediaQuery`, `useClickOutside`, `useCarouselRail`,
  `useToggleList`.
- `shared/config/`: `SUPPORTED_LANGUAGES`, `NAV_LINKS`, env access (`env.ts`,
  which validates variables once).

**`services/` (data access).**

```
services/
  http/
    client.ts        fetch wrapper: base URL, timeout, JSON, auth header, → throws AppError
    server.ts        'server-only' variant that reads the auth cookie
    errors.ts        AppError, toAppError()
  wallet.api.ts      raw endpoint calls + DTO → model mapping
  cars.api.ts
  mocks/             in-memory mock implementations with the same signatures
```

A `USE_MOCKS` flag in `shared/config/env.ts` picks the mock or the real
implementation behind the same function, so features never know which one runs.
This generalizes what `wallet.service.ts` already does. Its comment says to
"swap each method body … callers stay unchanged".

> **Server caveat.** The current mock services keep state in module-level `let`
> variables. That is fine in the browser, but once they run on the server
> (phase 3) that state is **shared between all users** of the process. Mocks
> that run on the server must be read-only, or keyed by a session id.

### Feature map

| Feature | Owns (moved from) |
| ------- | ----------------- |
| `auth` | `components/auth/*`, `AuthModal`, session helpers |
| `home` | `components/home/{CTA,Download,FAQ,Partners,Why,contact}` |
| `rental-search` | `home/Hero/*`, `PickupTypeModal`, `MapLocationModal`, `BranchModal`, `AirportModal`, `StationModal`, `CountryModal` |
| `cars` | `cars/*`, `filters/*` (the car-specific parts), `cities/SortBar`, `data/cars.ts`, `data/offices.ts` |
| `cities` | `home/Cities`, `cities/CityHero`, city queries |
| `car-details` | `car-details/*` (without the booking card), `ReviewsModal` |
| `booking` | `CarBookingCard`, `BookingDailyModal`, `BookingConfirmModal`, `PaymentMethodModal` |
| `my-bookings` | `bookings/*`, `account/BookingsTab`, `ExtendDurationModal`, `EditDailyBookingModal`, `CancelBookingModal`, `Bookingreviewmodal` |
| `account` | `AccountSidebar` (becomes the layout nav), `ProfileTab`, `EditPhone`, `VerifyPhone`, `LicenseModal` |
| `wallet` | `WalletSection`, `WalletTab`, `WalletAmountModal`, `BankSelectModal`, `useWallet`, `wallet.service` |
| `bank-accounts` | `BankAccountsSection`, `BankAccountsTab`, `BankAccountFormModal`, `useBankAccounts` |
| `notifications` | `NotificationsTab` |
| `layout` (app shell) | `Header`, `Footer`, `UserMenu`, `LanguageSwitcher` |

`wallet` imports bank accounts through `bank-accounts/index.ts`, which it
already does conceptually through `walletService.getBankAccounts()`.

### Types

- Domain types move into each feature's `model.ts`. `types/car.ts` is split, not
  renamed.
- Component props live **next to the component** (`interface Props` in the same
  file). Delete `RentalTabsProps`, `MapLocationModalProps`, and the other prop
  interfaces from the global types.
- API DTOs (the backend's shape) stay in `services/*.api.ts` and are mapped to
  models there. UI code never sees raw DTOs.
- Keep `types/` only for truly global types (for example `Locale`), or remove
  it.

## 1.3 Enforcing the rules

1. **One alias style.** Keep `@/*` only, and remove `@components/*`,
   `@services/*`, `@app-types/*`, `@locales/*`, and the others from
   `tsconfig.json` once they are no longer used. That leaves one way to write
   every import and makes the lint rule below simple.
2. **Lint rule.** Add
   [`eslint-plugin-boundaries`](https://github.com/javierbrea/eslint-plugin-boundaries)
   or, with no new dependency, `no-restricted-imports` patterns:

   ```jsonc
   // .eslintrc.json (sketch)
   "overrides": [
     { "files": ["src/shared/**"],
       "rules": { "no-restricted-imports": ["error", { "patterns": ["@/features/*", "@/app/*", "@/services/*"] }] } },
     { "files": ["src/app/**"],
       "rules": { "no-restricted-imports": ["error", { "patterns": ["@/services/*", "@/features/*/*"] }] } },
     { "files": ["src/features/**"],
       "rules": { "no-restricted-imports": ["error", { "patterns": ["@/app/*"] }] } }
   ]
   ```

   The `@/features/*/*` pattern blocks deep imports, so pages must use a
   feature's `index.ts`.
3. **`server-only` and `client-only`.** Add the `server-only` package and
   `import 'server-only'` at the top of every `queries.ts` and
   `services/http/server.ts`, so any accidental client import fails at build
   time.

## 1.4 Migration steps

The folders can coexist. Move one feature at a time, and leave a re-export at
the old path only if another unmigrated file still imports it.

1. ✅ **Create the skeleton:** `src/features/`, `src/shared/{ui,lib,hooks,config}`,
   and `src/services/http/`. Add the lint rule as a warning, not yet an error.
2. ✅ **Move the generic code first** (no behavior change):
   - `utils/index.ts` → `shared/lib/format.ts` and `shared/lib/cn.ts`.
   - `constants/index.ts` → `shared/config/`.
   - Generic hooks → `shared/hooks/`.
   - `common/{Button,Loader,SectionTitle,Form*,PhoneField,DateTimePicker}` →
     `shared/ui/`.
3. ✅ **Build `services/http`** (see [doc 3](03-error-handling.md)) and move the
   mock data from `data/` to `services/mocks/`.
4. ✅ **Migrate `wallet` and `bank-accounts` as the reference.** (Without
   `queries.ts` / `actions.ts`; see §1.5, item 5.) They already have
   the service, hook, and component split, so this mostly means moving and
   renaming files, adding `queries.ts` and `actions.ts`, and moving the types
   into `model.ts`. Review this PR as a team and treat it as the template.
5. ◐ **Migrate the other features** in the roadmap order. Done: `my-bookings`,
   `car-details`, `booking`, `cars`, `cities`, `home`, `rental-search`, `auth`.
   Left: `account` (profile, notifications) and `layout`. Per feature:
   1. Move the components into `features/<x>/components`.
   2. Move the inline mock data out of the page into `services/mocks/<x>.ts`,
      and expose it through `features/<x>/queries.ts`.
   3. Move the pure rules into `model.ts`, and add unit tests for them.
   4. Reduce the page to params, then query, then composition.
   5. Delete the old paths.
6. ☐ **Delete** `types/car.ts`, `data/`, `components/modals/`, and the extra
   aliases once they are empty. Switch the lint rule from warning to error.
   (`data/` and `types/car.ts` are gone; `types/` holds only
   `next-auth.d.ts`. `components/modals/` holds only the three unused dialogs
   waiting on product. Aliases left: `@/*`, plus `@components/*` (4 files) and
   `@assets/*` (until phase 7). The lint rule is still a warning.)

## 1.5 As-built notes

What the implementation settled on where this document was silent or had to
change. Each item says why.

1. **`index.ts` is client-safe; queries have their own entry.** A client
   component that imports `@/features/x` (for example `booking` importing
   `MapLocationModal` from `rental-search`) would pull that feature's
   `'server-only'` `queries.ts` into the client bundle, and the build fails. So
   `index.ts` exports components, types, and pure rules only, and pages import
   reads from `@/features/<x>/queries`:

   ```tsx
   import { CarDetailsView } from '@/features/car-details';
   import { getCarDetails } from '@/features/car-details/queries';
   ```

2. **Adjusted dependency rule.** `services` may import `shared/config` (for
   `env.ts`) and `features/*/model` (the types it maps responses to, and pure
   rules such as `normalizeIban`). `model.ts` has no React and no I/O, so this
   does not create a cycle through the UI.

3. **What the lint rule actually enforces** (`.eslintrc.json`, warnings):
   pages may import a feature's `index.ts` or its `queries`, nothing deeper;
   `services` may not import feature components or hooks. ESLint 8's patterns
   use gitignore syntax, so a bare `@/features/x` import from `services` is not
   caught. `eslint-plugin-boundaries` or `import/no-restricted-paths` would close
   that gap.

4. **`AppError` is in `shared/lib/errors.ts`**, not `services/http/errors.ts`
   (as [doc 3](03-error-handling.md) already had it).

5. **`queries.ts` / `actions.ts` exist where the data allows it.** Read-only
   mocks are safe on the server, so `my-bookings`, `car-details`, `cars`,
   `cities`, `home`, and `rental-search` read through `queries.ts`. The wallet
   and bank-account mocks keep state, which the server would share between
   users, so they stay behind client hooks until the account routes and a
   real API exist. `auth/actions.ts` is the first set of Server Actions.

6. **No `USE_MOCKS` flag yet.** Each `services/<domain>.api.ts` exports an
   interface (`WalletApi`, `CarsApi`, ...) and currently only the mock
   implementation. The flag is worth adding with the first real endpoint.

7. **Server data into client screens.** Each account section is its own route
   now (doc 5): its server page reads its data through `queries` and passes it
   to the client component as props. (Before the routes, one client screen held
   every tab and the bookings list came in as a pre-rendered slot.)

8. **Types.** `types/car.ts` is split into each feature's `model.ts`; the
   global `*Props` interfaces are gone. What remains is `UserProfile` and
   `AppNotification` (account) plus `types/next-auth.d.ts`.

### Example: the car details page after migration

```tsx
// app/[locale]/cars/[carId]/page.tsx
import { notFound } from 'next/navigation';
import { CarDetailsView } from '@/features/car-details';
import { getCarDetails } from '@/features/car-details/queries';

export default async function CarDetailsPage({ params }: { params: Promise<{ carId: string }> }) {
  const { carId } = await params;
  const car = await getCarDetails(carId); // returns null on a 404, throws AppError otherwise
  if (!car) notFound();

  return <CarDetailsView car={car} />;
}
```
