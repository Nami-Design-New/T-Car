# Auth API feature

Last updated: 2026-10-27
Environment: TEST, `https://t-car.ahmedmostafa.online/api/user`
Source: Bruno collection `tcar/User Application/Auth` and `Home/countries.yml`,
plus live calls to TEST on 2026-10-27.

> `docs/api/` is ignored by Git, so this file stays local. Never paste bearer
> tokens here.

## 1. Rules the integration follows

| #  | Rule |
| -- | ---- |
| R1 | **Outcome.** HTTP 401 → `unauthorized`, HTTP 5xx → `server` (HTTP status wins, body ignored). Otherwise the body `code` is used as it is: 2xx → success, **422 → `validation`**, any other code → `kindFromStatus(code)`. A 2xx response that is not a valid envelope → `server`. |
| R2 | **Toasts.** Success and 422 messages are shown with a `sonner` toast using the backend `message`. 401, 5xx, network, and timeout keep `errors.*` via `useErrorMessage()`. A message that looks like a key (`validation.email_required`) falls back to `errors.validation`. Server Actions return the message; the client toasts it. Dialogs stay open with the input on 422. |
| R3 | **Each feature owns its services.** A feature's API calls, DTOs, and mock move from `services/` into the feature (`features/<x>/api.ts` + `api.mock.ts`), so each feature is accountable for its own data access. The move happens fraction by fraction, when each feature is integrated with the API. Only the transport (`services/http/`) stays shared. See section 4.0. |
| R4 | **Branch.** A new branch from `main`; `feature/auth-api-integration` is deleted (needs `git branch -D` and the user's confirmation). |
| R5 | **Token.** The backend token lives only in the NextAuth JWT cookie and is read only on the server (`serverHttp`). It never reaches session JSON, props, URLs, logs, or storage. |

Common request headers: `Accept: application/json`,
`Content-Type: application/json`, `Accept-Language: ar | en` (page locale;
messages and country titles follow it).

## 2. Endpoints

| Endpoint | Method | Auth | Body / query | Success `data` | App caller |
| -------- | ------ | ---- | ------------ | -------------- | ---------- |
| `/countries` | GET | none | `per_page` (default 10), `page`, `search` | `CountryDto[]` + `pagination` | `PhoneField` in `LoginForm`, `EditPhoneModal`, `JoinUsForm` |
| `/auth/request-otp` | POST | none | `RequestOtpBody` | `null` | `requestOtpAction` (send and resend) |
| `/auth/verify-otp` | POST | none | `VerifyOtpBody` | `VerifyOtpData` | `verifyOtpAction` (then the `grant` provider, or the pending-registration cookie) |
| `/complete-profile` | POST | Bearer (pending registration) | `CompleteProfileBody` | `ProfileStepData` | `completeProfileAction` |
| `/assign-location` | POST | Bearer | `AssignLocationBody` | `ProfileStepData` | `assignLocationAction` (if the step is required) |
| `/logout` | POST | Bearer | none | `null` | `signOutAction` |

TEST accepts OTP `1234` for any number. Verifying a new number **creates the
account**.

## 3. Response shapes

Every response uses one envelope: `{ data, message, code }`. `data` is `null`
on every error. The HTTP status column shows why rule R1 is needed.

### 3.1 `GET /countries`

| Case | HTTP | Body |
| ---- | ---- | ---- |
| OK | 200 | `{ data: CountryDto[], pagination, message: "Fetched successfully.", code: 200 }` |
| Search with no match | 200 | `data: []` (assumed, not observed) |

```json
{
  "data": [{ "id": 1, "title": "Saudi Arabia", "phone_code": "+966", "image": "https://…/storage/lookups/countries/….jpg" }],
  "pagination": { "current_page": 1, "last_page": 1, "per_page": 10, "total": 9, "from": 1, "to": 9 },
  "message": "Fetched successfully.",
  "code": 200
}
```

TEST has 9 countries: +962, +971, +973, +965, +966, +968, +974, +961, +20.
`image` is the flag. There is no ISO code. CORS allows browser `GET`.

### 3.2 `POST /auth/request-otp`

| Case | HTTP | `code` | `message` |
| ---- | ---- | ------ | --------- |
| OK (known or new number) | 200 | 200 | `OTP has been sent successfully.` |
| Missing phone | 200 | 422 | `The phone number is required.` (ar: `رقم الجوال مطلوب.`) |
| Bad `otp_type` | 200 | 422 | `The OTP type must be either login or change phone.` |
| Too many requests | ? | ? | not tested |

### 3.3 `POST /auth/verify-otp`

| Case | HTTP | `code` | `data` |
| ---- | ---- | ------ | ------ |
| New number | 200 | 200 | `{ user, token, new_user: true, current_step: "register" }` |
| Profile saved, no location | 200 | 200 | `{ …, new_user: false, current_step: "location" }` |
| Fully onboarded | 200 | 200 | `{ …, new_user: false, current_step: "completed" }` |
| Existing, no name (Bruno sample) | 200 | 200 | `{ …, new_user: false, current_step: null }` (backend question Q3) |
| Wrong or expired code | 200 | 422 | `null`, `The verification code is invalid or expired.` |
| Missing fields | 200 | 422 | `null`, first missing field, e.g. `The phone number is required.` |

```json
{
  "data": {
    "user": {
      "id": 34, "name": null, "phone": "5xxxxxxxx", "email": null, "phone_code": "+966",
      "birth_date": null, "latitude": null, "longitude": null, "region": null, "address_name": null,
      "lang": "en", "balance": 0, "withdrawable_balance": 0, "non_withdrawable_balance": 0,
      "created_at": "2026-10-27 05:50:36"
    },
    "token": "<bearer>",
    "new_user": true,
    "current_step": "register"
  },
  "message": "OTP verified successfully.",
  "code": 200
}
```

### 3.4 `POST /complete-profile`

| Case | HTTP | `code` | `data` / `message` |
| ---- | ---- | ------ | ------------------ |
| OK | 200 | 200 | `{ user, current_step: "location" }`, `Profile updated successfully.` (no new token) |
| No or revoked token | 401 | 401 | `null`, `Unauthorized. Please log in.` |
| No name | 200 | 422 | `The name field is required.` |
| Invalid email | 200 | 422 | `The email address must be a valid email address.` |
| No email | 200 | 422 | `validation.email_required` (untranslated key) |
| Under 18 | 200 | 422 | `You must be at least 18 years old.` |

`birth_date` is sent as `YYYY-MM-DD` (the backend also accepted
`12/12/2000`; do not rely on it). There is no terms-acceptance field.

### 3.5 `POST /assign-location`

| Case | HTTP | `code` | `data` / `message` |
| ---- | ---- | ------ | ------------------ |
| OK | 200 | 200 | `{ user, current_step: "completed" }`, `Location saved successfully.` (observed 2026-10-22) |
| No or revoked token | 401 | 401 | `null`, `Unauthorized. Please log in.` |
| No latitude | 200 | 422 | `The latitude is required.` |
| Latitude out of range | 200 | 422 | `The latitude must be between -90 and 90.` |
| No address name | 200 | 422 | `The address name field is required.` |

### 3.6 `POST /logout`

| Case | HTTP | `code` | `message` |
| ---- | ---- | ------ | --------- |
| Valid token | 200 | 200 | `Logged out successfully.` (token revoked) |
| No token | 401 | 401 | `Unauthorized. Please log in.` |
| Already revoked token | 401 | 401 | `Unauthorized. Please log in.` (treated as success by the app) |

After logout, every protected endpoint rejects the token. No refresh endpoint
and no expiry were found.

## 4. DTOs and types in the code

### 4.0 Where services live (rule R3)

Today every feature's data access sits in a shared `services/` folder
(`services/<x>.api.ts`, `services/mocks/<x>.ts`). It moves into the feature
that owns it, so the feature is accountable for its endpoints, DTOs, mapping,
and mock, and a change to one backend contract touches one feature folder.

```
src/
  services/
    http/                  shared only: client.ts, server.ts, envelope.ts
  features/<x>/
    api.ts                 server-only: AuthApi-style interface, http implementation,
                           wire DTOs, response guards, DTO → model mapping
    api.mock.ts            the mock (stateless, one documented failure rule)
    model.ts               domain types and pure rules (no I/O)
    queries.ts             server reads, call api.ts
    actions.ts             Server Actions, call api.ts
    index.ts               client-safe exports only; never re-exports api.ts
```

| Rule | Detail |
| ---- | ------ |
| When | Per feature, in its integration fractions: first a move with no behavior change (still on the mock), then the switch to the API. No repo-wide move. |
| Order for auth | A2 countries, A3 auth, before any endpoint is wired (section 5) |
| Other features | Same two steps when their turn comes: wallet, bank-accounts, bookings, cars, car-details, cities, account, notifications, points, rental-search, contact, faqs |
| Shared data | Data used by several features (countries: auth, account, home) does not go into one feature; its home is decided in A2 (e.g. `shared/lib/phone-countries/`) |
| Imports | Features may import `@/services/http/*` only; the `no-restricted-imports` rule in `docs/01` is changed to allow it. Feature `api.ts` is never imported by another feature or by client components |
| Safety | `api.ts` imports `server-only` when it uses `serverHttp`, so a client import fails the build |
| Docs | A2 updates `docs/01-architecture-layers.md` §1.5 and the "Data access" rule in `AGENTS.md` to this layout |
| End state | `services/` holds only `http/`; `services/mocks/` is empty and removed |

### 4.1 Shared transport: `src/services/http/envelope.ts` (new)

```ts
export interface ApiEnvelope<T> {
  data: T;
  message: string;
  code: number;
}

export interface ApiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ApiPage<T> extends ApiEnvelope<T[]> {
  pagination: ApiPagination;
}

/** Applies rule R1 to a parsed body; returns `{ data, message }` or throws AppError. */
export function unwrapEnvelope<T>(body: unknown, guard: (data: unknown) => data is T): { data: T; message: string };
```

Changes next to it:

| File | Change |
| ---- | ------ |
| `src/shared/lib/errors.ts` | `AppError` gets `serverMessage?: string` (backend text for the toast) |
| `src/shared/lib/result.ts` | `ActionResult` success gets `message?: string`; the error keeps `serverMessage` |
| `src/shared/lib/phone.ts` | `PhoneCountry.iso2` becomes optional |

### 4.2 Wire DTOs: `src/features/auth/api.ts` (server-only)

```ts
export type OtpType = 'login' | 'change_phone';

export interface RequestOtpBody {
  phone: string;      // national digits: "544444442"
  phone_code: string; // "+966", one of /countries
  otp_type: OtpType;
}

export interface VerifyOtpBody extends RequestOtpBody {
  otp: string;
}

export type OnboardingStepDto = 'register' | 'location' | 'completed' | null;

export interface UserDto {
  id: number;
  name: string | null;
  phone: string;
  phone_code: string;
  email: string | null;
  birth_date: string | null;   // YYYY-MM-DD
  latitude: string | null;
  longitude: string | null;
  region: string | null;
  address_name: string | null;
  lang: string;
  balance: number;
  withdrawable_balance: number;
  non_withdrawable_balance: number;
  created_at: string;          // "YYYY-MM-DD HH:mm:ss"
}

export interface VerifyOtpData {
  user: UserDto;
  token: string;
  new_user: boolean;
  current_step: OnboardingStepDto;
}

export interface CompleteProfileBody {
  name: string;
  email: string;
  birth_date: string; // YYYY-MM-DD
}

export interface AssignLocationBody {
  latitude: number;
  longitude: number;
  address_name: string;
  region: string;
}

export interface ProfileStepData {
  user: UserDto;
  current_step: OnboardingStepDto;
}

export interface AuthApi {
  requestOtp(body: RequestOtpBody): Promise<string>;                    // message
  verifyOtp(body: VerifyOtpBody): Promise<AuthGrant>;
  completeProfile(input: CompleteProfileInput): Promise<ProfileStepResult>; // bearer from session
  assignLocation(body: AssignLocationBody): Promise<ProfileStepResult>;
  logout(): Promise<string>;                                            // message; 401 resolves
}
```

Guards check only the fields the app reads: `token` (non-empty string),
`user.id`, `user.phone`, `user.phone_code`, `user.name` / `user.email`
(string or null), `new_user` (boolean), `current_step` (one of the four
values, **including `null`**).

### 4.3 Countries DTO (location decided in fraction A2)

```ts
export interface CountryDto {
  id: number;
  title: string;
  phone_code: string;
  image: string | null;
}
```

| `PhoneCountry` | from `CountryDto` |
| -------------- | ----------------- |
| `id` | `String(id)` |
| `name` | `title` |
| `countryCode` | `phone_code` |
| `flagUrl` | `image` (fallback placeholder) |
| `iso2` | not provided (optional) |
| cursor ↔ page | `nextCursor = current_page < last_page ? String(current_page + 1) : null`; `limit` → `per_page` |

### 4.4 Domain model: `src/features/auth/model.ts`

```ts
export type OnboardingStep = 'register' | 'location' | 'completed';

/** The signed-in customer as the session exposes it. Never includes the token. */
export interface AuthUser {
  id: string;        // String(UserDto.id)
  name: string;      // '' until the profile is completed
  phone: string;
  phoneCode: string;
  email?: string;
}

/** Result of OTP verification or registration; used only on the server. */
export interface AuthGrant {
  accessToken: string;
  user: AuthUser;
  onboardingStep: OnboardingStep;
}

export interface CompleteProfileInput {
  fullName: string;
  email: string;
  birthDate: string; // YYYY-MM-DD
}

export interface ProfileStepResult {
  user: AuthUser;
  onboardingStep: OnboardingStep;
  message: string;
}

/** `null` from the backend: no name → 'register', otherwise 'completed'. */
export function toOnboardingStep(step: OnboardingStepDto, hasName: boolean): OnboardingStep;
```

Removed: `RegistrationInput` (phone + code + profile) and
`AUTH_ERROR_CODES.registrationRequired`. Verification signs in unless the
step is `register`: that session starts when the profile is saved (A11).

### 4.5 Session: `src/types/next-auth.d.ts`

| Where | Fields |
| ----- | ------ |
| JWT (encrypted cookie, server only) | `accessToken`, `user: AuthUser`, `onboardingStep` |
| `session.user` (browser) | `id`, `name`, `phone`, `phoneCode`, `email`, `onboardingStep` |

### 4.6 Validation alignment: `src/features/auth/validation.ts`

| Field | UI rule today | Backend rule | Change |
| ----- | ------------- | ------------ | ------ |
| `email` | optional | required, valid email | make required |
| `birthDate` | past date | age ≥ 18 | add age check |
| `fullName` | required | required | none (maps to `name`) |
| `code` | 4 digits | not stated | confirm (Q9) |
| `phone` | 8–15 digits | not stated | keep; sent as national digits |

### 4.7 Flows

- **Sign-in:** request OTP → `verifyOtpAction` calls `/auth/verify-otp` →
  `completed` or `location`: the session starts (`signInWithGrant`, the
  `grant` provider, which only takes a grant sealed with `AUTH_SECRET`) and
  `location` opens the location step (Q2); `register`: no session, the token
  waits in the encrypted, httpOnly `tcar.pending-registration` cookie (30
  minutes) and `RegisterForm` opens.
- **Registration (A11):** `completeProfileAction` calls `/complete-profile`
  with the pending token, then clears the cookie and starts the session.
  Closing the form or going back discards the registration
  (`discardRegistrationAction`, product decision 2026-10-27); a missing or
  expired one is `unauthorized` and the dialog returns to the phone. A session
  still on `register` from before A11 is ended by the `jwt` callback.
- **Logout:** `POST /logout` with the session token, then `signOut()`. 200 and
  401 are both success; network/5xx is reported and the user is still signed
  out. Revoke first, then clear the cookie (the token is read from it).
- **Dead token:** a 401 on a protected read redirects to
  `/?auth=login&next=<path>`; a 401 in an action returns `unauthorized` and the
  client signs out locally without calling `/logout`.

## 5. Fractions and progress

One commit per fraction on the new branch. Each is verified with
`npx tsc --noEmit -p .`, `npx next lint`, `npm run test`, `npx next build`,
and a `next start` smoke test, and committed only after approval.

Status: ⬜ not started · 🟡 in progress · ✅ done (committed)

| #   | Fraction | Main files | Done when | Status | Commit |
| --- | -------- | ---------- | --------- | ------ | ------ |
| A0  | Toaster | `package.json` (`sonner`), `app/[locale]/layout.tsx`, toast wrapper + test, `docs/03-error-handling.md`, `AGENTS.md` | One `<Toaster />` in both locales with the right direction; wrapper applies the key fallback; docs describe R2 | ✅ | `cdb94c9` |
| A1  | Envelope-aware HTTP client | `services/http/envelope.ts`, `client.ts`, `shared/lib/errors.ts`, `result.ts` | R1 implemented; `serverMessage` and success `message` cross the action boundary; `Accept-Language` from the locale; tests for 200, 422-in-200, 401, 500 HTML, 429-in-body, bad JSON | ✅ | `5da2a09` |
| A2  | Countries from the API (+ move) | countries service and mock to their new home, `shared/lib/phone.ts`, `next.config.mjs`, `docs/01` §1.5, `AGENTS.md` | The three phone fields list the TEST countries with flags; search and paging work; no toast; `parsePhoneFieldValue` covers all 9 API codes (the loaded list arrives with A4's separated value); docs describe R3. Countries live in `features/phone-countries` | ✅ | `b7210f3` |
| A3  | Move auth data access into the feature | `services/auth.api.ts` → `features/auth/api.ts`, `services/mocks/auth.ts` → `features/auth/api.mock.ts` | No behavior change; mock still used; lint allows `@/services/http/*` from features | ✅ | `db4d6f6` |
| A4  | Request OTP | `features/auth/api.ts`, `actions.ts`, `validation.ts`, `LoginForm.tsx`, `OtpForm.tsx` | Action takes `{ countryCode, phone }`, sends `otp_type: 'login'`; success and 422 toasted; form keeps input; resend works | ✅ | `324f876` |
| A5  | Verify OTP + session | `src/auth.ts`, `model.ts`, `types/next-auth.d.ts`, `AuthModal.tsx` | JWT holds token and step; session JSON has no token; `completed` signs in; wrong code toasted, OTP form stays open. Flow moved to `useAuthFlow` | ✅ | `ff0e450` |
| A6  | Complete profile | `actions.ts`, `validation.ts`, `RegisterForm.tsx`, `middleware.ts` | Profile saved with the session token; step updated; result toasted; email required, age ≥ 18; `register` sessions blocked from `/account/*`; reload resumes | ✅ | `61c8809` |
| A7  | Logout | `actions.ts` (`signOutAction`), `api.ts`, `AuthControl.tsx` | `/logout` then `signOut`; success toasted; 401 = success; failures still sign out and are reported; old token rejected (curl) | ✅ committed; live token probe blocked by TEST TLS handshake failure | `602b717` |
| A8  | Dead-token handling | `services/http/server.ts`, redirect helper, protected `queries.ts` | Revoked token on `/account/*` redirects to login with `next`; stale cookie cleared on the next action | ✅ unit-tested and smoke-tested with a forced 401 (account reads are still mocks) | `9a2bf23` |
| A9  | Location step (only if Q2 requires it) | `AuthModal.tsx`, `shared/ui/MapLocationModal`, `assignLocationAction` | `location` step saves a location and sets `completed`; skip behavior per product | ↪ folded into A6 | |
| A10 | Status docs | `docs/README.md` | Auth row says "live API" with remaining gaps | ✅ | `b8d7095` |
| A11 | Session after registration | `src/auth.ts`, `actions.ts`, `registration.ts`, `sealed-grant.ts`, `useAuthFlow.ts`, `middleware.ts`, layout | No session until the profile is saved; token kept in a sealed pending-registration cookie; closing the form discards it; no `register` sessions | ✅ (live registration with a real code still to try in a browser) | |

Smoke checks on TEST (reuse a few fixed test numbers; each new number creates
an account):

- New number → register → profile saved → `location` → signed in.
- Completed number → signed in directly.
- Wrong OTP → error toast, dialog stays open.
- Logout → `curl` with the old token on `/complete-profile` returns 401.
- `/api/auth/session` never contains `accessToken`.

## 6. Open questions

| #   | Question | Owner | Answer |
| --- | -------- | ----- | ------ |
| Q1  | Can errors return their real HTTP status (422 instead of 200)? R1 works either way. | Backend | |
| Q2  | Is the `location` step mandatory, and can the user skip it? | Product | Product (2026-10-27): after the profile success dialog, the auth dialog closes and the map opens to complete the step; closing the map skips it for now (done in A6) |
| Q3  | `current_step: null` for an existing user with no name: bug or a separate state? | Backend | |
| Q4  | Do tokens expire? Is there a refresh endpoint? | Backend | Backend (2026-10-27): no expiry and no refresh endpoint; a 401 means a revoked token (A8 signs the session out) |
| Q5  | Are tokens revoked when the account is deleted? | Backend | Backend (2026-10-27): yes |
| Q6  | Can 422 include `errors: { field: string[] }`? | Backend | |
| Q7  | `validation.email_required` is an untranslated key. | Backend | |
| Q8  | Terms acceptance: the form requires it, the API has no field. | Product / Backend | Product (2026-10-27): implied consent; the register form states "By continuing, you agree to…" with links, no checkbox. Backend recording of consent still open |
| Q9  | OTP length, expiry, attempt limit, resend throttle (429 shape), `change_phone` requirements. | Backend | |
| Q11 | Phone format: `request-otp` accepts and stores any 8–15 digits as sent (`0544…`, `544…`, even `+966544…` all succeed), so one number can become several accounts. Which form is canonical, and can the backend normalize? The app sends digits without the trunk `0` until then. | Backend | |
| Q10 | Should countries include an ISO code? Maximum `per_page`? `search` matches titles only (in the request language): can it also match `phone_code`? The app filters calling-code searches locally until then. | Backend | |

## 7. TEST data written while probing

- Account id 34 (synthetic `+966 5930…` number): profile `Test`,
  `api.test@example.com`, `2000-12-12`.
- Two probe tokens were revoked with `/logout`. The Bruno `user_token` was not
  used.
- The Bruno `user_token` values in `TEST.yml` / `LOCAL.yml` are plain-text
  tokens in the collection's Git repo; rotate them if the collection is
  shared.
