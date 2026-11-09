# Contact Us and Join Us API

Last updated: 2026-11-02  
Base URL: `https://t-car.app/api/user`  
Status: contract probed (C0 done; updated 2026-11-02 after the backend made both
endpoints public). Contact Us works without a token and can be integrated.
Join Us is broken on the backend: every valid request is an HTTP 500 (§3.2).

Sources: Bruno `User Application/Setting/{ContactUs,JoinUs,setting}.yml`, the
existing `features/home` contact form and Join Us dialog, the shared
`serverHttp` conventions, and live requests on 2026-11-02.

> `docs/api/` is ignored by Git, like the other API docs. This file stays local.
> The supplied token is omitted. Two contact requests were created by the
> probes (§7); no join request could be created.

## 1. Rules the integration follows

| # | Rule |
| - | ---- |
| R1 | Reuse the envelope-aware client. Success: HTTP 200 / body `code: 200`, `data: null`. Validation: HTTP 200 / body `code: 422`, one `message`, no field map. Missing token: HTTP 401 / body `code: 401`. |
| R2 | Both endpoints and `GET /settings` are public (no token, confirmed 2026-11-02, Q1): the app calls them from the server with `publicServerHttp`. |
| R3 | Toast the backend's messages with `useNotify()` (AGENTS.md): the success message (`notify.success`, then clear the form) and a 422 message (`notify.error`, keeping the form and its input). `useNotify` replaces a key-like message such as `validation.email_required` with the generic validation text. Other failures (network, 401, 5xx) keep the translated inline error. |
| R4 | Parse the form again in the Server Action (Zod), with the backend's limits (§4), before the request. |

Headers: `Accept: application/json`, `Content-Type: application/json`,
`Accept-Language: en | ar`, `Authorization: Bearer <token>`.

## 2. Endpoints and request DTOs

| Method | Path | Body | Purpose | App caller today |
| ------ | ---- | ---- | ------- | ---------------- |
| `POST` | `/contact-us` | `ContactUsRequest` (JSON) | Send a contact message | `sendContactMessageAction` → `services/contact.api.ts` (mock) |
| `POST` | `/join-us` | `JoinUsRequest` (JSON; **`company_size_id`, not Bruno's `size`**) | Partner (company) application | none: `JoinUsForm` only prevents the submit |
| `GET` | `/settings` | none | Holds `company_sizes` (the allowed Join Us sizes) | not read by the web app |

```ts
interface ContactUsRequest {
  name: string;          // required, max 255
  email: string;         // required, valid email
  message: string;       // required, max 5000
  reason?: string;       // optional free text, max 255 (Bruno: "Order Issue")
  order_number?: string; // optional, must be a string, max 255 (Bruno: "ORD-2026-0015")
}

interface JoinUsRequest {
  name: string;          // required, 2–100 characters
  phone: string;         // required, Saudi mobile: 9 digits starting with 5
  company_name: string;  // required
  email: string;         // required, valid email
  company_size_id: number; // required, an `id` from GET /settings → data.company_sizes
}

// GET /settings → data.company_sizes (filled 2026-11-02):
interface CompanySizeDto {
  id: number;   // sent as company_size_id
  size: number; // shown to the user: 10, 20, 30, 40, 50
}
```

## 3. Observed responses

### 3.1 `POST /contact-us`

HTTP 200 / `code: 200`, `data: null`.

| Locale | Message |
| ------ | ------- |
| en | `Contact request created successfully.` |
| ar | `تم إرسال طلب التواصل بنجاح.` |

Accepted without `reason` and without `order_number` (both optional).

### 3.2 `POST /join-us`: broken on the backend

- The size field is **`company_size_id`** (an `id` from `GET /settings` →
  `company_sizes`, e.g. `1` for size 10). Bruno's `size` is out of date: `size`
  is rejected with every value (`10-50`, `1`, `10`, `"10"`, `50`), always
  `The company size is required.`.
- An unknown id (`99`) is a 422: `The selected company size is invalid.`.
- **Every valid request is an HTTP 500** (Laravel debug page): `Attempt to read
  property "id" on null` in `JoinUsController.php` line 18, with and without a
  bearer token. The controller most likely still reads the signed-in user,
  which the now-public route does not load (backend follow-up 1). No success
  has been observed; expected: the contact envelope, `data: null` with a
  message.

## 4. Validation (`422`)

HTTP 200, body `code: 422`, `data: null`, one message; fields are checked in
the order listed.

### 4.1 Contact Us (order: name → email → message)

| Probe | English message | Arabic message |
| ----- | --------------- | -------------- |
| Missing name | `The name field is required.` | not probed |
| Missing email | `validation.email_required` (untranslated key) | `حقل البريد الإلكتروني مطلوب.` |
| Invalid email | `The email address must be a valid email address.` | not probed |
| Missing message | `The message field is required.` | not probed |
| Name over 255 | `The name may not be greater than 255 characters.` | not probed |
| Reason over 255 | `The reason may not be greater than 255 characters.` | not probed |
| Order number over 255 | `The order number may not be greater than 255 characters.` | not probed |
| Order number as a number | `The order number must be a string.` | not probed |
| Message over 5000 | `The message may not be greater than 5000 characters.` | not probed |

A one-character name was accepted (no minimum).

### 4.2 Join Us (order: name → phone → company_name → email → company_size_id)

| Probe | English message | Arabic message |
| ----- | --------------- | -------------- |
| Missing name | `The name field is required.` | not probed |
| Name of 1 character | `The name field must be at least 2 characters.` | not probed |
| Name over 100 | `The name may not be greater than 100 characters.` | not probed |
| Missing phone | `The phone number is required.` | not probed |
| Phone `12` / `412345678` | `The phone must be 9 digits and start with 5.` | `رقم الجوال يجب أن يكون 9 أرقام ويبدأ بـ 5.` |
| Missing company name | `The company name field is required.` | not probed |
| Missing email | `validation.email_required` (untranslated key) | not probed |
| Invalid email | `The email address must be a valid email address.` | not probed |
| Missing `company_size_id` (or only `size`) | `The company size is required.` | `حجم الشركة مطلوب.` |
| Unknown `company_size_id` (`99`) | `The selected company size is invalid.` | not probed |

Phone forms that passed the phone check: `512345678`, `0512345678`,
`+966512345678`, and the number `512345678`. Send the 9-digit national number
(leading zero removed, as login does).

## 5. Feature boundary (as built)

- **Contact Us** and **Join Us** belong to `features/home`: `api.ts` (server-only
  `contactApi`, `joinUsApi`), `api.mock.ts` (tests), `actions.ts`
  (`sendContactMessageAction`, `sendJoinRequestAction`), `validation.ts`
  (`contactMessageSchema`, `joinUsSchema`).
- **`GET /settings`** is shared by the app, so it is its own feature,
  `features/settings` (like `features/phone-countries`):

  | File | Role |
  | ---- | ---- |
  | `model.ts` | `AppSettings`, `CompanySize` (client-safe types) |
  | `api.ts` | server-only `settingsApi.getSettings()` on `publicServerHttp`; maps only the fields in use (`companySizes` today) |
  | `queries.ts` | `getSettings()`, React `cache` (once per request), for server components |
  | `actions.ts` | `getSettingsAction()` for client components |
  | `index.ts` | the action and the types, for other features |

  `AppSettings.contact` (email, phone, Facebook / Instagram / X links) and
  `AppSettings.links` (about, terms, and privacy pages) feed the home Contact
  card, the footer, and the register form (C4) through
  `getSiteSettings()`, which never throws, and the Zustand store
  `useSiteLinksStore` (filled in the browser by `SiteLinksSync`, read with
  `useSiteLinks()`) for client components. A feature that needs another settings field (terms link,
  booking switches, price range, map position) adds it to `AppSettings` and
  `mapSettings`.

Mapping: `contactReason` → `reason`, `bookingNumber` → `order_number`,
`companyName` → `company_name`, `companySizeId` → `company_size_id` (number),
`phone.phone` → `phone` (national number, leading zero removed).

## 6. Product decisions (2026-11-02)

| Q | Question | Decision |
| - | -------- | -------- |
| Q1 | Both endpoints need a signed-in customer, but the forms are public. | **The backend makes them public.** The app sends both without a token (`publicServerHttp`). Until the backend changes, every send is a 401 (backend follow-up 3). |
| Q2 | What is sent as `reason`? | **Free text.** The contact form's reason becomes an optional text field (max 255) instead of the fixed select; its text is sent as is. |
| Q3 | Where do the Join Us company sizes come from? | **`GET /settings` → `company_sizes`**, shown in the size select (no fixed options). The list is empty on the server today. |
| Q4 | Join Us phone: Saudi only? | **Keep all countries.** The phone field keeps its country picker; the national number is sent as `phone`, and the API's rule (Saudi, 9 digits starting with 5) answers a non-Saudi number with its 422 message as a toast. |

## 7. Integration fractions (proposed)

| Fraction | Scope |
| -------- | ----- |
| C0 — Contract evidence **Done (2026-11-02)** | This document. |
| C1 — Feature-owned API | Move `services/contact.api.ts` and `services/mocks/contact.ts` into `features/home/` (`api.ts`, `api.mock.ts`), no behavior change. |
| C2 — Contact Us live **Done (2026-11-02)** | `POST /contact-us` through `publicServerHttp` (no token); `reason` / `order_number` left out when blank; free-text reason field; the API's limits in the schema; success and 422 messages toasted (R3), other failures inline; `api.mock.ts` is the test double. |
| C3 — Join Us form **Done (2026-11-02); send blocked by the backend 500** | RHF + Zod (`joinUsSchema`), every country kept (Q4), sizes from the shared `features/settings` (`GET /settings` → `companySizes`), `POST /join-us` with `company_size_id`; success and 422 toasted (R3), other failures inline. |
| C4 — Contact details from the settings **Done (2026-11-02)** | `/contact` page removed (nav uses `/#contact`); `AppSettings.contact` (email, phone, social links) from `GET /settings`, shown in the home Contact card and the footer through `getContactSettings()` (never throws); missing details hidden; address stays translated. `/terms`, `/privacy`, and `/why` pages removed: the footer and the register form link to the backend's `terms_url` / `privacy_policy_url`, and its new "About us" quick link to `about_us_url` (new tab); the nav's "Why choose us" still scrolls to the home section, through `getSiteSettings()` and the `useSiteLinksStore` Zustand store (`SiteLinksSync`). Mocks were already test doubles (C2, C3). |

### Backend follow-ups

1. **Join Us crashes**: every valid `POST /join-us` (with or without a token)
   is an HTTP 500, `Attempt to read property "id" on null` in
   `JoinUsController.php` line 18, probably the signed-in user that the public
   route no longer loads. The debug page also exposes server paths (debug mode
   on, as on bank accounts).
2. Update Bruno's JoinUs request: the field is `company_size_id`, not `size`.
3. Translate `validation.email_required` in English (it is returned as a key).
4. ~~Make both endpoints public~~: done 2026-11-02. ~~Fill `company_sizes`~~:
   done (ids 1–5, sizes 10–50).

## 8. Live probe history and side effects

On 2026-11-02, with the token the user supplied for testing:

1. Empty bodies with and without a token, in English and Arabic: 401 without a
   token, then the first missing field.
2. Field-by-field validation on both endpoints (§4); none of these created
   anything.
3. `GET /settings` in both languages: `company_sizes` is empty.
4. One Join Us with Bruno's `size: "10-50"`: rejected (nothing created).
5. Two Contact Us requests with test data (`API Test`, `probe@example.com`,
   "Contract probe from the web front end; please ignore."), one without
   `reason`, one with `reason: "Order Issue"` and `order_number: "ORD-PROBE-1"`
   in Arabic. Both were created; they can be deleted on the backend.
6. After the backend made both endpoints public (2026-11-02): empty bodies
   without a token are 422 on both. `company_sizes` filled. Join Us `size`
   rejected with `999`, `"abc"`, `50`, `1`, `"10"`, `10`, `"1"`, `"10-20"` and an
   object; `size_id` and `company_size` rejected; `company_size_id: 1` passed
   validation and crashed (HTTP 500), without and then with the token;
   `company_size_id: 99` is a 422. None of these created a join request.
7. One more Contact Us without a token (same test data): created.
