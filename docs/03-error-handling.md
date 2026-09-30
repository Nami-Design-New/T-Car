# 3. Error handling

> **Status (2026-09-28):** steps 1, 2, 3, 4, and 8 done; 5 partly done (real 404
> status codes wait for phase 2); 6, 7, and 9 not started. See the markers in [§3.4](#34-migration-steps).

## 3.1 Current state

| # | Finding | Where |
| - | ------- | ----- |
| E1 | **No error boundaries.** There is no `error.tsx` or `global-error.tsx` anywhere, so any render error shows the default Next.js error screen. | `src/app` |
| E2 | **Failures become `false`.** `run()` catches everything and returns `false`, so the caller cannot tell a validation error from a network error or a 401. | [`useWallet.ts:48-58`](../src/hooks/useWallet.ts), [`useBankAccounts.ts:41-55`](../src/hooks/useBankAccounts.ts) |
| E3 | **Initial load failure shows the empty state.** `Promise.all(...).finally(...)` has no `.catch`. On failure the promise rejection is unhandled, `loading` turns `false`, and the UI renders "no transactions" or "no bank accounts". | Same hooks, the `useEffect` block |
| E4 | **404 shows the wrong data.** An unknown car id renders `MOCK_CARS[0]`. The booking and city pages never check whether the item exists. | `cars/[carId]/page.tsx`, `my-bookings/[id]/page.tsx`, `cities/[slug]/page.tsx` |
| E5 | **Plain `Error` with English text.** Services throw `new Error('Top-up rejected')`. The message cannot be translated and has no code. | `wallet.service.ts`, `bankAccounts.service.ts` |
| E6 | **401 not handled.** The interceptor has an empty `if (status === 401)` block. | [`services/api.ts:24-31`](../src/services/api.ts) |
| E7 | **Unfinished actions look finished.** Handlers `console.log` and then show success. Cancel, extend, edit booking, pay, delete account, and license upload all do this. | `BookingDetailsHeader`, `CarBookingCard`, `ProfileTab`, `Hero` |
| E8 | **Generic failure dialog has a wallet default.** `FailedModal`'s default title is "فشل في عملية الشحن" (top-up failed). The same component is also used as a delete confirmation. | [`FailedModal.tsx`](../src/components/common/FailedModal.tsx) |
| E9 | **Validation is duplicated and inconsistent.** Some forms use `react-hook-form`, and others use hand-written checks in `useState`. Field errors are not linked to inputs (no `aria-invalid` or `aria-describedby`). | `ProfileTab`, `WalletAmountModal`, `BankAccountFormModal`, `JoinUsForm` |
| E10 | **No reporting.** Errors go nowhere, so failures in production are invisible. | — |

## 3.2 Target design

### Error taxonomy

One error type crosses every layer. The HTTP client is the **only** place that
turns raw failures into it.

```ts
// shared/lib/errors.ts
export type AppErrorKind =
  | 'network'        // offline, DNS, CORS
  | 'timeout'
  | 'unauthorized'   // 401: session missing or expired
  | 'forbidden'      // 403
  | 'not_found'      // 404
  | 'validation'     // 400/422 with field errors
  | 'conflict'       // 409: e.g. car no longer available, insufficient balance
  | 'rate_limited'   // 429: e.g. OTP resend
  | 'server'         // 5xx
  | 'unknown';

export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    /** i18n key under `errors.*`, e.g. 'wallet.topUpRejected'. Falls back to `errors.<kind>`. */
    readonly code?: string,
    readonly status?: number,
    readonly fieldErrors?: Record<string, string>,  // field → i18n key
    options?: { cause?: unknown },
  ) {
    super(code ?? kind, options);
  }
}

export function toAppError(error: unknown): AppError { /* maps fetch/Response/AbortError/unknown */ }
```

Mutations return a `Result` instead of throwing, so the UI is forced to handle
both branches:

```ts
// shared/lib/result.ts
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (error: unknown): Result<never> => ({ ok: false, error: toAppError(error) });
```

The two error channels:

| Channel | Used for | Mechanism |
| ------- | -------- | --------- |
| **Throw** | Reads (queries), unexpected bugs | Caught by the nearest `error.tsx` or error boundary |
| **Return `Result`** | Writes (actions, mutations), expected failures | Handled inline by the calling component |

Server Actions must **return** a `Result` rather than throw. Errors thrown from
Server Actions reach the client with their message stripped in production, so
the UI cannot tell what happened.

> **As built:** an `AppError` instance does not survive the trip from a Server
> Action to the client either, so actions return an `ActionResult<T>` (the same
> shape, with the error as plain `{ kind, code, status, fieldErrors }`). The
> action calls `toActionResult(result)`, the client `fromActionResult(result)`,
> which rebuilds the `AppError`. Both live in `shared/lib/result.ts`.

### Where each error is handled

```
services/http   → converts anything into AppError (throws)
features/*/queries.ts
                → 'not_found' → returns null (the page calls notFound())
                → everything else rethrows → error.tsx
features/*/actions.ts
                → wraps the call in try/catch → returns Result
                → 'unauthorized' → clears the session cookie, returns fail()
components      → Result.ok=false → field errors into the form, or a ResultDialog / inline error
error.tsx       → segment-level fallback with retry
global-error.tsx→ last resort (errors inside the root layout)
```

### 1. Route-level boundaries

```
app/
  global-error.tsx                       errors in the root layout itself (has its own <html>)
  [locale]/
    error.tsx                            default fallback for every page
    not-found.tsx                        exists already, keep it
    cars/[carId]/not-found.tsx           "this car is no longer available", with a link to /cars
    account/error.tsx                    keeps the account sidebar; only the content area fails
    account/bookings/[id]/not-found.tsx
```

```tsx
// app/[locale]/error.tsx
'use client';
import { useEffect } from 'react';
import { ErrorState } from '@/shared/ui';
import { reportError } from '@/shared/lib/report';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return <ErrorState variant="page" onRetry={reset} />;
}
```

Because `error.tsx` sits **below** the segment's `layout.tsx`, the account
sidebar, header, and footer stay usable when the content fails.

### 2. Queries: `not_found` becomes `notFound()`

```ts
// features/car-details/queries.ts
import 'server-only';
export async function getCarDetails(id: string): Promise<CarDetails | null> {
  try {
    return await carsApi.getDetails(id);
  } catch (e) {
    const err = toAppError(e);
    if (err.kind === 'not_found') return null;
    throw err;
  }
}
```

### 3. Mutations: Result into the UI

The existing flow state machines (`WalletFlow`, `BankAccountsFlow`) keep their
shape. `ok: boolean` becomes the `AppError`, so the result dialog can say
*why* the action failed:

```ts
type WalletFlow =
  | { step: 'idle' }
  | { step: 'topup-amount' }
  | { step: 'withdraw-bank' }
  | { step: 'withdraw-amount'; account: BankAccount }
  | { step: 'result'; kind: ResultKind; error?: AppError };  // no error means success
```

```tsx
<ResultDialog
  open={flow.step === 'result'}
  status={flow.error ? 'error' : 'success'}
  title={t(flow.error ? `wallet.${kind}.failed` : `wallet.${kind}.done`)}
  description={flow.error ? tErrors(flow.error.code ?? flow.error.kind) : undefined}
  onClose={close}
/>
```

### 4. Forms

- Use `react-hook-form` everywhere (it is already installed), with one schema
  per form. Add `zod` and `@hookform/resolvers` so the same schema can also
  validate in the Server Action.
- Map server field errors back into the form:
  `Object.entries(result.error.fieldErrors ?? {}).forEach(([f, key]) => setError(f, { message: t(key) }))`.
- The shared `Field` component wires `aria-invalid`, `aria-describedby`, and the
  error text (see [doc 4](04-component-design.md)).
- A form-level error that is not tied to a field shows as an inline alert above
  the submit button, and the dialog stays open.

### 5. Unauthorized (401)

| Where it happens | Behavior |
| ---------------- | -------- |
| Server query | `getSession()` or the query sees `unauthorized`, then `redirect('/?auth=login&next=…')` |
| Server Action | Clears the cookie and returns `fail(unauthorized)`. The client shows the auth dialog and retries the action after login where that is safe |
| Middleware | No cookie on a protected route redirects before rendering |

### 6. Error messages (i18n)

Add an `errors` namespace to both message files:

```json
"errors": {
  "network": "تعذر الاتصال. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
  "timeout": "استغرق الطلب وقتًا أطول من المتوقع. حاول مرة أخرى.",
  "server": "حدث خطأ من جهتنا. حاول مرة أخرى بعد قليل.",
  "unauthorized": "انتهت جلستك. سجّل الدخول للمتابعة.",
  "not_found": "العنصر المطلوب غير موجود.",
  "unknown": "حدث خطأ غير متوقع.",
  "wallet": { "topUpRejected": "…", "insufficientBalance": "…" },
  "booking": { "carUnavailable": "…" }
}
```

Lookup order: `errors.<code>`, then `errors.<kind>`, then `errors.unknown`.
Never show `error.message` from the backend or from JavaScript directly.

### 7. Reporting

```ts
// shared/lib/report.ts
export function reportError(error: unknown, context?: Record<string, unknown>) {
  const err = toAppError(error);
  if (err.kind === 'validation' || err.kind === 'unauthorized') return; // expected, not bugs
  // later: Sentry.captureException(err, { extra: context })
  if (process.env.NODE_ENV !== 'production') console.error(err, context);
}
```

Call it from `error.tsx`, `global-error.tsx`, and the `fail()` branch of actions.
Add the ESLint rule `no-console: ["error", { allow: ["error"] }]` so stray
`console.log` calls cannot come back.

### 8. Unfinished actions (E7)

Until the backend exists, every action that is not built must go through a mock
in `services/mocks` that **can fail**, the way the wallet mock rejects top-ups
above 10,000 SAR. It must not `console.log` and then show success. That way the
failure path gets built and tested now, not after launch.

## 3.3 Rules

1. Only `services/http` creates an `AppError` from raw errors. Everything else
   passes it along.
2. Reads throw, and writes return `Result`.
3. `not_found` never reaches `error.tsx`. It becomes `notFound()`.
4. A failed read never renders an empty state (see [doc 6](06-ui-states.md)).
5. A dialog with a failed submit stays open, keeps what the user typed, and
   shows the error.
6. User-facing error text always comes from `messages/*.json`.
7. Every `catch` either handles the error (UI and recovery), or reports it and
   rethrows. A bare `catch {}` is not allowed.

## 3.4 Migration steps

1. ✅ **Foundations:** `shared/lib/{errors,result,report}.ts`, the `errors`
   namespace in both message files, and the `no-console` lint rule (as a
   warning at first).
2. ✅ **Boundaries:** `app/global-error.tsx`, `app/[locale]/error.tsx`, and the
   shared `ErrorState` component.
3. ✅ **HTTP client:** (The 401 handling only classifies the error; signing out
   on a backend 401 comes with the real auth endpoints.) build `services/http/client.ts` with the `toAppError`
   mapping and the 401 handling. Point the mock services at `AppError` as well
   (`throw new AppError('conflict', 'wallet.topUpRejected')`).
4. ✅ **Hooks:** change `run()` in `useWallet` and `useBankAccounts` to return
   `Result`, and add the missing `.catch` that sets an `error` state (this
   fixes E3 right away). Update `WalletSection` and `BankAccountsSection` to
   carry `error` in their flow. These hooks are replaced by Server Actions
   later, but the fix is small and prevents the empty-state lie now.
5. ◐ **Resource pages:** `notFound()` is in place for cars, bookings, and cities;
   they fall back to the root `not-found.tsx`. Two notes: the segment-specific
   `not-found.tsx` files are not written yet, and under the root streaming
   `loading.tsx` the 404 page renders in the browser but the HTTP status stays
   200 (the page is marked `noindex`). The loading work in doc 5 fixes that. add `notFound()` to the car, booking, and city pages,
   plus the segment `not-found.tsx` files.
6. ☐ **Split `FailedModal`** into `ConfirmDialog` (destructive confirmation) and
   `ResultDialog` (success or failure outcome), as part of the dialog migration.
7. ☐ **Forms:** move `ProfileTab`, `WalletAmountModal`, `BankAccountFormModal`, and
   the auth forms to `react-hook-form` with `zod` and the shared `Field`.
8. ✅ **Replace the `console.log` handlers** (no `console.log` is left in `src/`) with mock actions that return
   `Result`, one feature at a time during phase 4.
9. ☐ **Switch `no-console` to error.** Add Sentry (or a similar service) to
   `reportError` when the team is ready.
