# 2. Server / client boundary

> **Status (2026-09-28):** step 5 (auth) done with NextAuth v5, see
> [§2.3](#23-auth-across-the-boundary). Steps 1–4, 6, and 7 not started.

## 2.1 Current state

- **92 files** carry `'use client'`, including 4 of the 14 route files
  (`account`, `privacy`, `terms`, `not-found`).
- Only 14 components are server-compatible, and most of them are rendered
  inside client parents anyway, so they ship as client code.
- The root layout renders `Header` and `Footer`, both client components. Every
  page therefore hydrates the header, its `AuthModal` (react-bootstrap `Modal`,
  `LoginForm`, `OtpForm`, `RegisterForm`, phone-input library), `UserMenu`, and
  `LanguageSwitcher`.
- The auth token is read from `localStorage` in the axios interceptor
  ([`services/api.ts`](../src/services/api.ts)). The server cannot see it, so
  any authenticated data must be fetched in the browser. That rules out server
  rendering for account, wallet, and bookings.
- `NextIntlClientProvider` has no `messages` prop, so it forwards **all**
  messages in `messages/*.json` to the client on every page.
- Only `NEXT_PUBLIC_API_URL` exists, so the API base URL is exposed to the
  browser even for calls that could stay server-side.

### Why `'use client'` spread

Most of these components have no state or handlers of their own. They were
marked client because they use `useTranslations`, or because they sit inside a
client parent. `useTranslations` works in server components with `next-intl`
(for non-async components). A component with no directive is *shared*: it runs
on the server when rendered from a server component, and on the client when
rendered from a client one.

| Component | Needs client? | Why it was marked | Target |
| --------- | :-----------: | ----------------- | ------ |
| `layout/Footer` | No | `useTranslations` | Server |
| `home/Why`, `home/Download`, `home/contact/ContactInfo`, `home/contact/index` | No | none (no hooks or handlers) | Server |
| `home/FAQ` | Accordion state only | `useState` | Server, with native `<details name="faq">` or a Radix `Accordion` leaf |
| `car-details/WarrantiesList` | Accordion state only | `useState` | Same as FAQ |
| `car-details/CarQuickInfo` | No | `scrollToReviews` (unused, the button is commented out) | Server |
| `cars/CarCard` | No | `useTranslations` | **Shared** (remove the directive): used by both server pages and client rails |
| `privacy/page`, `terms/page`, `not-found` | No | `useTranslations` | Server |
| `bookings/BookingsEmptyState` | Lottie only | Lottie | Shared `EmptyState` with a lazy illustration leaf |
| `layout/Header` | Partly | menu toggle, auth modal | Server shell with 3 client islands |
| `cities/CityHero` | Partly | search form | Server hero with a client `CitySearchForm` |
| `bookings/details/BookingDetailsHeader` | Partly | actions menu and dialogs | Server header with a client `BookingActions` |
| `bookings/details/BookingSidebar` | Partly | review dialog | Server price table with a client `ReviewButton` |
| `car-details/ReviewsSummaryCard` | Partly | opens a dialog | Server summary with a client trigger and lazy dialog |
| `app/[locale]/account/page` | Partly | tab state | Server layout and routes (see [doc 5](05-performance-and-routing.md)) |

## 2.2 Target model

### Rules

1. **Server by default.** Pages, layouts, and any component that only renders
   data are server components.
2. **Client leaves, not client trees.** Put `'use client'` on the smallest
   component that needs state, effects, event handlers, or browser APIs. Pass
   server-rendered content into it as `children` when the island wraps content.
3. **Data flows down as serializable props.** Server components fetch the data
   and pass plain objects, strings, numbers, `Date`s, and `StaticImageData` to
   client leaves. Functions can only cross the boundary as Server Actions.
4. **Reads on the server, writes through Server Actions.** A client component
   never fetches its own initial data when the page could have passed it down.
5. **Guard the boundary at build time.** Add `import 'server-only'` in
   `queries.ts` and `services/http/server.ts`, and `import 'client-only'` in
   modules that touch `window`, `localStorage`, or Google Maps.
6. **Browser-only libraries load lazily.** Google Maps, Lottie, and Swiper sit
   behind `next/dynamic` with `ssr: false`, inside client leaves only.

### Decision flow

```
Does it use state, effects, refs, event handlers, or browser APIs?
├─ No  → no directive (server, or shared when a client parent renders it)
└─ Yes → can the interactive part be split out?
         ├─ Yes → server wrapper + small 'use client' leaf
         └─ No  → 'use client' on this component, and keep it as low in the tree as possible
```

### Pattern 1: server shell with client islands (Header)

```tsx
// features/layout/components/Header.tsx: server
export default async function Header() {
  const t = await getTranslations('nav');
  const session = await getSession();          // reads the httpOnly cookie on the server

  return (
    <header className="header">
      <div className="container-tcar header-inner">
        <Logo />
        <MobileNav>                             {/* client: open/close state only */}
          <NavLinks links={NAV_LINKS} t={t} />   {/* server markup passed as children */}
          <LanguageSwitcher />                   {/* client */}
          {session ? <UserMenu user={session.user} /> : <LoginButton />}
        </MobileNav>
      </div>
    </header>
  );
}
```

`LoginButton` is a client leaf that lazily imports `AuthDialog` when clicked,
so the auth forms and phone library never load for visitors who do not log in.

### Pattern 2: server data, client interaction (booking details)

```tsx
// app/[locale]/account/bookings/[id]/page.tsx: server
const booking = await getBooking(id);
if (!booking) notFound();

return (
  <>
    <BookingDetailsHeader booking={booking}>      {/* server */}
      {booking.isActive && <BookingActions booking={booking} />}  {/* client: menu + dialogs */}
    </BookingDetailsHeader>
    <BookingPriceTable booking={booking} />        {/* server */}
  </>
);
```

`BookingActions` receives the real booking. That removes the fake
`bookingDetails` object that `BookingDetailsHeader` builds today.

### Pattern 3: mutation through a Server Action

```ts
// features/wallet/actions.ts
'use server';
export async function topUpAction(amount: number): Promise<Result<void>> {
  const result = await walletApi.topUp(amount);   // server http client, carries the cookie
  if (result.ok) revalidatePath('/[locale]/account/wallet', 'page');
  return result;
}
```

```tsx
// features/wallet/components/TopUpDialog.tsx
'use client';
const [pending, startTransition] = useTransition();
const submit = (amount: number) =>
  startTransition(async () => {
    const result = await topUpAction(amount);
    onResult(result);                            // opens the success or failure ResultDialog
  });
```

After the action succeeds, `revalidatePath` re-renders the server page with
fresh data, so the client `refresh()` calls in `useWallet` and
`useBankAccounts` are no longer needed.

## 2.3 Auth across the boundary

| Concern | Today | Target |
| ------- | ----- | ------ |
| Token storage | `localStorage['tcar_token']`, readable by any script (XSS risk) | `httpOnly`, `Secure`, `SameSite=Lax` cookie set by a Server Action or route handler after the OTP is verified |
| Who reads it | Browser axios interceptor only | `services/http/server.ts` (server). The browser never sees the token |
| Route protection | None: `/account` renders for everyone | `middleware.ts` chains the `next-intl` middleware with a cookie check for `/account/**` and redirects to `/?auth=login&next=…` |
| Logged-in UI | `isLoggedIn` `useState(false)` in `Header` | `getSession()` in the server `Header`, passed to `UserMenu` |
| 401 from the API | Empty `if` in the interceptor | `AppError { kind: 'unauthorized' }`. The server clears the cookie and redirects, and the client opens the auth dialog (see [doc 3](03-error-handling.md)) |

Middleware sketch:

```ts
// src/middleware.ts
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intl = createIntlMiddleware(routing);
const PROTECTED = /^\/(en|ar)\/account(\/|$)/;

export default function middleware(req: NextRequest) {
  if (PROTECTED.test(req.nextUrl.pathname) && !req.cookies.has('tcar_session')) {
    const url = req.nextUrl.clone();
    url.pathname = `/${req.nextUrl.pathname.split('/')[1]}`;
    url.search = `?auth=login&next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return intl(req);
}
```

> The cookie check in middleware is only a fast redirect. The real
> authorization check happens in `getSession()` and on the backend.

If the backend team cannot support cookie-based sessions yet, keep the phase 3
target anyway and use a small Next route handler as a proxy: it stores the
backend token in the `httpOnly` cookie and forwards requests. Do not build more
features on `localStorage` tokens in the meantime.

### As built: NextAuth v5

The backend does not set an `httpOnly` cookie, so the session is NextAuth's
(`next-auth@5.0.0-beta.32`, pinned). It meets the target in the table above:

| Concern | Implementation |
| ------- | -------------- |
| Sign-in | [`src/auth.ts`](../src/auth.ts): a Credentials provider `otp` calls `authApi.verifyOtp(phone, code)`, or `authApi.register(...)` when `intent=register`. Failures reach the client as a stable code (`auth.invalidCode`, `auth.registrationRequired`, ...) |
| Token storage | JWT session in an `httpOnly`, `SameSite=Lax` cookie named `tcar.session-token` (`__Secure-` prefixed and `Secure` in production), see [`shared/config/session.ts`](../src/shared/config/session.ts). The backend token is inside the encrypted JWT |
| Who reads the token | [`services/http/server.ts`](../src/services/http/server.ts) with `getToken()`. The session the browser can read (`/api/auth/session`) has the user only. The browser client sends no token |
| Route protection | [`src/middleware.ts`](../src/middleware.ts): NextAuth's `auth()` wraps the `next-intl` middleware; `/account` and `/my-bookings` (with or without a locale) redirect to `/<locale>?auth=login&next=…` |
| Logged-in UI | The `[locale]` layout calls `auth()` and passes the user to `Header`, which shows the user menu or the login button. `?auth=login` opens the dialog; `next` must be a same-site path |
| Dialog flow | [`features/auth/actions.ts`](../src/features/auth/actions.ts): `requestOtpAction`, `verifyOtpAction` (signs in or asks for registration), `registerAction`, `signOutAction`, all returning `ActionResult` |
| Configuration | `AUTH_SECRET` is required (see `.env.example`); set `AUTH_URL` behind a proxy |

Still open: the backend auth endpoints (mocked in
[`services/mocks/auth.ts`](../src/services/mocks/auth.ts): code `1234`,
`+966500000000` has an account), confirming whether registration re-sends
the verified phone and code or uses a registration token, and handling a
backend 401 by signing the session out. The middleware check only looks at
the cookie; the backend must still validate the token on every request.

## 2.4 Other boundary items

- **Messages.** Once most text renders on the server, pass only the namespaces
  the client islands need:
  `<NextIntlClientProvider messages={pick(messages, ['nav', 'auth', 'states', 'errors'])}>`.
  Better still, have client leaves receive already-translated strings as props
  where that is practical.
- **Environment variables.** Add a server-only `API_URL`. Keep
  `NEXT_PUBLIC_API_URL` only if some calls must still go from the browser to
  the API directly. Validate both once in `shared/config/env.ts`.
- **Dates and time.** `formatTransactionDate` and the booking countdown use the
  current time and timezone. On the server that is the server's timezone.
  Either format with an explicit `timeZone: 'Asia/Riyadh'`, or render the
  relative part ("remaining time") in a client leaf, to avoid hydration
  mismatches.
- **Google Maps.** `MapLocationModal` must become a lazily imported client
  module that is mounted only while the dialog is open, so the Maps script
  loads on first open (see [doc 5](05-performance-and-routing.md)).

## 2.5 Migration steps

1. **Remove the unnecessary directives (quick wins, no refactor).** `Footer`,
   `Why`, `Download`, `ContactInfo`, `contact/index`, `CarQuickInfo`, `CarCard`,
   and the `privacy`, `terms`, and `not-found` pages. Check each one with
   `next build`: an error means something still needs the client, so split it
   instead of adding the directive back.
2. **Replace state-only accordions** (`FAQ`, `WarrantiesList`) with native
   `<details>`, or a shared `Accordion` leaf.
3. **Split the mixed components** in this order: `Header` (the biggest payoff,
   because it is on every page), `CityHero`, `ReviewsSummaryCard`,
   `BookingDetailsHeader`, and `BookingSidebar`.
4. **Account section.** Convert it to server layouts and routes as part of the
   routing phase ([doc 5](05-performance-and-routing.md)).
5. ✅ **Auth.** (Done with NextAuth; axios removed earlier, in the HTTP client step.) Build the cookie session, `getSession()`, and the middleware guard,
   then remove the `localStorage` interceptor from `services/api.ts`, and
   finally remove `axios`, since the plain-`fetch` client covers it and fits
   Next caching.
6. **Server Actions for writes.** Wallet and bank accounts first, then booking
   actions, then profile.
7. **Trim the client messages** once steps 1–6 are done.

Verification after each step: `next build` shows the route's First Load JS in
its output table. Record it before and after, per route, in the PR description.
