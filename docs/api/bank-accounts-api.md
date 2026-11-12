# Bank Accounts API

Last updated: 2026-11-01  
Base URL: `https://t-car.app/api/user`  
Status: integrated (B0–B7 done, 2026-11-01). Every read and write uses the live
API; `api.mock.ts` is a test double of `BankAccountsApi`. Contract answers in §7;
Q5 and the backend follow-ups still pending are listed there.

Sources: Bruno `User Application/Setting/bank` (`bank accounts`, `banks`,
`add-bank-account`, `edit-bank-account`, `delete-bank-account`), the current
`serverHttp` / `ApiPagination` conventions, [wallet-api.md](wallet-api.md)
§3.3, and authenticated/unauthenticated live requests on 2026-11-01.

> `docs/api/` is ignored by Git, like the other API docs. This file stays local.
> The supplied token is omitted. Response IBANs are shown as placeholders; the
> request IBAN is the Bruno sample. Every account created by the probes was
> deleted again (§8); the customer's existing accounts were not touched.

## 1. Rules the integration follows

| # | Rule |
| - | ---- |
| R1 | Reuse the envelope-aware HTTP client. Read and edit success: HTTP 200 / body `code: 200`. **Create success: HTTP 200 / body `code: 201`.** Validation: HTTP 200 / body `code: 422`, `data: null`. Unknown account: HTTP 200 / body `code: 404`. Missing token: HTTP 401 / body `code: 401`. The client already treats body codes below 400 as success and maps 404 to `not_found`. **Decision (2026-11-01): every success guard in this feature (reads and writes) accepts body `code: 200` or `201`**, so a later backend switch between the two does not break the app. |
| R2 | Show backend success and validation messages with `useNotify()` (toast only). Keep the dialog open with its input on a failed submit. Errors carry one `message` and no field map. |
| R3 | Account calls go through server-only `serverHttp` (bearer token from the session). Never take a customer ID or token from client input. `GET /banks` is public by design (confirmed): call it with `publicServerHttp`, no token. |
| R4 | Send account and bank IDs as integers (confirmed). A non-numeric path ID is an HTTP 500 (§4.3). The app's IDs are strings; convert with a strict integer check and treat anything else as a validation error without a request (as wallet W8 does for `account_id`). |
| R5 | The bank-accounts feature owns `features/bank-accounts/api.ts` and its test mock `api.mock.ts`; only `services/http/` stays shared. Keep `index.ts` client-safe. |
| R6 | Keep `normalizeIban` before sending: the backend rejects spaces and lower case (§4.1). The frontend IBAN rule matches the backend: exactly 24 characters, `SA` + 22 digits (Q4). Ownership and checksum stay server-defined. |
| R7 | No duplicate accounts (Q2): adding, or editing into, an IBAN that is already one of the customer's accounts is rejected before the request. |

Headers: `Accept: application/json`, `Accept-Language: en | ar`, and
`Authorization: Bearer <token>` (Bruno: `auth: inherit`). Bruno sends the writes
as `multipart/form-data`; JSON bodies were accepted as well (§3.3).

## 2. Endpoints and request DTOs

| Method | Path | Request | Purpose | App caller today |
| ------ | ---- | ------- | ------- | ---------------- |
| `GET` | `/bank-accounts` | `page`, `per_page` | The customer's accounts, paginated | Live: `getBankAccountsAction` (wallet picker). Mock: `useBankAccounts` (tab) |
| `GET` | `/banks` | `page`, `per_page`, optional `search` | Bank lookup for the add/edit form | Mock: `MOCK_BANKS` |
| `POST` | `/bank-accounts` | `bank_id`, `iban_number` | Add an account | Mock: `addBankAccountAction` |
| `POST` | `/update-bank-accounts/{id}` | `iban_number`, optional `bank_id` | Edit an account | Mock: `updateBankAccountAction` |
| `DELETE` | `/bank-accounts/{id}` | none | Delete an account | Mock: `deleteBankAccountAction` |

Note the edit path: it is `POST /update-bank-accounts/{id}`, not
`PUT /bank-accounts/{id}`. `PUT /bank-accounts/{id}` returned body `code: 405`
(`The request method is not allowed.`).

```ts
interface AddBankAccountRequest {
  bank_id: number;
  iban_number: string; // normalized, e.g. SA0380000000608010167519 (Bruno sample)
}

interface UpdateBankAccountRequest {
  bank_id: number;      // supported (confirmed); not in the Bruno sample
  iban_number: string;  // the app always sends both fields
}

interface BanksQuery {
  page?: number;     // default 1
  per_page?: number; // default 10
  search?: string;   // matches the title in the request locale
}
```

## 3. Observed success DTOs

Every observed response is JSON with the shared envelope (`ApiEnvelope<T>` in
`services/http/envelope.ts`); list endpoints add `pagination: ApiPagination`.

### 3.1 `GET /bank-accounts`

HTTP 200 / `code: 200`. Message: `Fetched successfully.` /
`تم الجلب بنجاح.`

```ts
interface BankAccountDto {
  id: number;
  bank_id: number;
  title: string;        // bank name in the request locale
  logo: string | null;  // absolute URL when present
  iban_number: string;
}

type BankAccountsResponse = ApiEnvelope<BankAccountDto[]> & {
  pagination: ApiPagination;
};
```

```json
{
  "data": [
    { "id": 6, "bank_id": 2, "title": "Bank Albilad", "logo": null, "iban_number": "<iban>" },
    { "id": 5, "bank_id": 2, "title": "Bank Albilad", "logo": null, "iban_number": "<iban>" }
  ],
  "pagination": { "current_page": 1, "last_page": 1, "per_page": 10, "total": 2, "from": 1, "to": 2 },
  "message": "Fetched successfully.",
  "code": 200
}
```

- Ordered newest first (descending `id`).
- `title` follows `Accept-Language` (`Bank Albilad` / `بنك البلاد`).
- In list responses `bank_id` is always a number.
- The existing `mapBankAccountsResponse` (`features/bank-accounts/api.ts`)
  already validates this shape and maps it to `BankAccount`. It checks
  body code 200 or 201 (R1, since B2).

### 3.2 `GET /banks`

HTTP 200 / `code: 200`, same messages. **No token required**: the request
succeeded without `Authorization`.

```ts
interface BankDto {
  id: number;
  title: string;        // localized
  logo: string | null;  // absolute https URL under /storage/lookups/banks/
}

type BanksResponse = ApiEnvelope<BankDto[]> & { pagination: ApiPagination };
```

| Probe | Result |
| ----- | ------ |
| No query | `per_page` defaults to 10; 8 banks in total on one page |
| `per_page=3` | `last_page: 3`, `total: 8` |
| `page=9&per_page=10` (past the end) | `data: []`, `current_page: 9`, `from`/`to` null |
| `search=bilad` (en) | One match: `Bank Albilad` |
| `search=الراجحي` (ar) | One match: `مصرف الراجحي` |
| `search=zzz` | `data: []`, `total: 0`, `from`/`to` null |

The list is sorted by the localized title. Search matches the title in the
request locale, so an English term does not find the Arabic name.

**The lookup holds test data (confirmed; used as it is).** Live list on
2026-11-01:

| id | English title | Arabic title | Logo |
| -- | ------------- | ------------ | ---- |
| 1 | Al Rajhi Bank | البنك الأهلي السعودي (Saudi National Bank) | none |
| 2 | Bank Albilad | بنك البلاد | none |
| 3 | Riyad Bank | بنك الرياض | none |
| 4 | Saudi First Bank | البنك السعودي الأول | none |
| 5 | Banque Saudi Fransi | البنك السعودي الفرنسي | none |
| 6 | Alinma Bank | `بنك 종료` (contains Korean text) | none |
| 7 | Rajhi Bank | مصرف الراجحي | yes |
| 9 | `fawerw` | `afesw` | yes |

Id 1 names two different banks depending on the language; ids 1 and 7 are both
Al Rajhi in English; id 6's Arabic name is broken; id 9 is a test entry. This
is test data on the TEST server, not a defect: the app renders what the API
returns and does not patch names locally.

### 3.3 `POST /bank-accounts` (add)

Bruno body (multipart):

```text
bank_id=2
iban_number=SA0380000000608010167519
```

Success is **HTTP 200 / body `code: 201`** (accept 200 or 201, R1), `data` is
the new account. Message:
`Bank account added successfully.` / `تمت إضافة الحساب البنكي بنجاح.`

```json
{
  "data": { "id": 18, "bank_id": "2", "title": "Bank Albilad", "logo": null, "iban_number": "<iban>" },
  "message": "Bank account added successfully.",
  "code": 201
}
```

- With a multipart body, `bank_id` comes back as the **string** `"2"`; the
  same request as JSON (`{"bank_id": 2, "iban_number": "..."}`) returned the
  number `2`. **Confirmed: the backend will return `bank_id` as an integer in
  all cases**, so the guards require an integer. Re-probe a multipart create
  before B4; until the fix is deployed, send JSON.
- The account appears at the top of the next `GET /bank-accounts`.
- **The backend allows duplicates today**: the same bank and IBAN were added
  twice, and the customer already had two identical accounts (ids 5 and 6).
  The app must not create duplicates (Q2, R7).
- **No checksum check**: `SA9999999999999999999999` (invalid IBAN check
  digits) was accepted. Backend agreed to look at checksum validation
  (follow-up 8); the frontend adds none.

### 3.4 `POST /update-bank-accounts/{id}` (edit)

Bruno body (multipart): `iban_number` only. Success: HTTP 200 / `code: 200`,
`data` is the updated account. Message: `Bank account updated successfully.` /
`تم تحديث الحساب البنكي بنجاح.`

```json
{
  "data": { "id": 18, "bank_id": 2, "title": "Bank Albilad", "logo": null, "iban_number": "<iban>" },
  "message": "Bank account updated successfully.",
  "code": 200
}
```

| Probe | Result |
| ----- | ------ |
| `iban_number` only | Updated; `bank_id` kept |
| `bank_id=3` + `iban_number` | Both updated; `title` became `Riyad Bank`; `bank_id` returned as `"3"` (multipart) |
| `bank_id=999` + `iban_number` | `code: 422`, `The selected bank does not exist.` |
| Empty body | `code: 200`, nothing changed (both fields are optional) |
| JSON `{"iban_number": ...}` | Updated |
| Unknown id `99999` | `code: 404`, `The requested resource was not found.` / `العنصر المطلوب غير موجود.` |
| Id of a deleted account | `code: 404`, same message |

Changing the bank on edit is supported (confirmed, Q3): the app's edit form
submits both `bankId` and `iban`, and the request sends both `bank_id` and
`iban_number`. An empty edit is a successful no-op; the form validation already
requires both fields.

### 3.5 `DELETE /bank-accounts/{id}`

No body. Success: HTTP 200 / `code: 200`, `data: null`. Message:
`Bank account deleted successfully.` / `تم حذف الحساب البنكي بنجاح.`

Deleting the same id again: HTTP 200 / `code: 404`,
`The requested resource was not found.` Keep the existing confirmation dialog;
after success, re-read the list (or drop the row) and toast the message.

## 4. Validation and error responses

### 4.1 `422` validation

HTTP 200, body `code: 422`, `data: null`, one message. Checks run in the
order bank → IBAN, and the first failure is reported.

| Probe (add unless noted) | English message | Arabic message |
| ------------------------ | --------------- | -------------- |
| Empty body | `The bank field is required.` | `حقل البنك مطلوب.` |
| `bank_id` only | `The IBAN number field is required.` | `حقل رقم الآيبان مطلوب.` |
| `iban_number` only | `The bank field is required.` | `حقل البنك مطلوب.` |
| `bank_id=999` (add and edit) | `The selected bank does not exist.` | `البنك المحدد غير موجود.` |
| `bank_id=abc` | `The bank must be an integer.` | not probed |
| IBAN `123` (add and edit) | `The IBAN number must be exactly 24 characters.` | `يجب أن يتكون رقم الآيبان من 24 حرفاً بالضبط.` |
| 22-char foreign IBAN `GB82WEST…` | `The IBAN number must be exactly 24 characters.` | not probed |
| Bruno IBAN with spaces | `The IBAN number must be exactly 24 characters.` | not probed |
| 23 characters | `The IBAN number must be exactly 24 characters.` | not probed |
| Lower-case `sa038…` | `The IBAN number must be a valid IBAN, e.g. SA000000000000000000000.` | not probed |
| `XX` + 22 digits | same as above | not probed |
| `SA0380ABCDEF…` (letters in the account part) | same as above | not probed |

Backend rule: exactly 24 characters, `SA` followed by 22 digits, no
checksum. The frontend rule (`validation.ts`) is still `SA\d{2}[A-Z0-9]{20}`
after normalization, so it accepts letters that the backend rejects. **Decision
(Q4): match the backend**, `^SA\d{22}$` after normalization (B4). The example
in the backend message has 23 characters; the IBAN is 24 (follow-up 4).

```ts
type BankAccountValidationResponse = ApiEnvelope<null> & { code: 422 };
```

### 4.2 `401` unauthorized

`GET /bank-accounts`, `POST /bank-accounts`, `POST /update-bank-accounts/{id}`,
and `DELETE /bank-accounts/{id}` without a token: HTTP 401, body
`{ "data": null, "message": "Unauthorized. Please log in.", "code": 401 }`.
`GET /banks` without a token succeeds (§3.2). The transport signs the session
out and throws `AppError('unauthorized')`.

### 4.3 `404`, `405`, and `500`

- Unknown or deleted account on edit/delete: HTTP 200 / body `code: 404`
  (§3.4, §3.5); the client maps it to `not_found`. Show the translated
  `bankAccounts.notFound` / `errors.*` copy and re-read the list.
- `PUT /bank-accounts/{id}`: body `code: 405`; not used.
- `DELETE /bank-accounts/abc`: **HTTP 500 with a full Laravel debug page**
  (exception, server file paths, stack trace). Debug mode is on in this
  environment. Agreed handling: the app sends numeric IDs only (R4), so it
  never reaches this path. The client maps 5xx to `server` without reading
  the body.
- Another customer's account ID on edit or delete: **confirmed by the backend
  to return 404** (not probed from here, to avoid changing someone else's
  data). Handled like an unknown ID.

Not probed: `per_page` limits, rate limits, timeouts, deleting an account
referenced by a wallet withdrawal (Q5).

## 5. Feature boundary and proposed API

Wire DTOs stay private to `features/bank-accounts/api.ts`; `model.ts` keeps the
client-safe types (`Bank`, `BankAccount`, `BankAccountPayload`) and the pure IBAN
helpers. The model stays unchanged: IDs are strings, `logo` is optional.

```ts
interface BankAccountsApi {
  getBankAccounts(page: number): Promise<Page<BankAccount>>;     // live (W5)
  getBanks(query: { page: number; search?: string }): Promise<Page<Bank>>;
  addBankAccount(payload: BankAccountPayload): Promise<Result<BankAccount>>;
  updateBankAccount(id: string, payload: BankAccountPayload): Promise<Result<BankAccount>>;
  deleteBankAccount(id: string): Promise<Result<null>>;
}
```

Mapping (same as the existing list mapper):

| Model field | Wire field | Mapping |
| ----------- | ---------- | ------- |
| `id` | `id` | `String(id)` |
| `bankId` | `bank_id` | `String(bank_id)`; integer in every response (confirmed) |
| `bankName` / `Bank.name` | `title` | Direct (localized) |
| `logo` | `logo` | Absolute http(s) URL, otherwise `undefined` (`toLogo`) |
| `iban` | `iban_number` | `normalizeIban` |
| `maskedNumber` | `iban_number` | `maskIban` |

Write results carry the backend `message` for the toast, as the wallet actions
do. Actions return `ActionResult` and re-read the list after success instead of
the current client-side `current` array transitions.

## 6. Integration fractions

Each fraction is its own commit, verified per `AGENTS.md`, with
`docs/README.md` updated in the same commit and approval asked before each one.

| Fraction | Scope | Done when |
| -------- | ----- | --------- |
| B0 — Contract evidence **Done (2026-11-01)** | Probe all five endpoints, success and failure, both locales; record DTOs and gaps. | This document. |
| B1 — Feature-owned API **Done (2026-11-01)** | Move `services/bankAccounts.api.ts` and `services/mocks/bankAccounts.ts` into `features/bank-accounts/` (`api.ts` interface, `api.mock.ts` for tests), no behavior change. | No import of `services/bankAccounts.api` remains; tests, typecheck, lint, build pass. |
| B2 — Bank lookup read **Done (2026-11-01)** | `bankAccountsApi.getBanks({ page, search })` reads `GET /banks` through `publicServerHttp` (guard, map, pagination, optional `search`, 10 per page); `getBanksAction(page, search?)` serves it without a session (trimmed search, max 100 characters). Both mappers accept body code 200 or 201 (R1). UI unchanged: switching only the form's bank select would break the mock add/edit actions, whose bank ids (`'sedad'`, …) are not the live numeric ids, so the switch moves to B3. | Tests cover mapping, logo handling, empty search, 201, malformed DTOs, query building, the public client, page/search validation, and error propagation. |
| B3 — Tab reads **Done (2026-11-01)** | The tab reads `GET /bank-accounts` page by page in the browser through `getBankAccountsAction` (`usePaginatedList` + `InfiniteList`, card skeletons, inline error with retry, empty state), like the wallet picker; no server query for page 1, since the hook has no initial-data input. The form's bank field is the `BankSelect` component: its panel reads `GET /banks` through `getBanksAction` when it opens, searches by title on the API 300 ms after typing pauses, loads the next page on scroll, and shows option skeletons, an inline error with retry, and "no banks" / "no results" messages; an edited account shows its own bank without reading the list. The writes drop the client-side list and `MOCK_BANKS`: they take no `current` list, check the session, the form values, and the account ID (a non-positive-integer ID is `not_found` without a request, R4), succeed without calling the API, and the tab re-reads the list from page 1. | Tests cover the writes' checks, the form's bank loading, edit pre-fill, empty and failed bank lists with retry. Until B4–B6 a write shows success but the list does not change. |
| B4 — Add **Done (2026-11-01)** | IBAN rule `^SA\d{22}$` (Q4). `addBankAccountAction` posts `{ bank_id, iban_number }` as JSON (integer `bank_id`; a non-integer bank ID is refused without a request), accepts body code 200 or 201 with an integer `bank_id`, and returns the account with the backend message; the result dialog shows it (no toast), and the tab re-reads the list. A backend 422 is toast-only and keeps the form open. `useBankAccounts.add` refuses an IBAN already in the loaded accounts inline (R7, `errors.bankAccounts.duplicateIban`). JSON is sent, so the multipart string `bank_id` does not arise. | Tests cover the IBAN rule, the JSON body, 200 and 201, a string `bank_id` as a server error, invalid bank IDs, 422 message kept, 401, duplicate refusal without a request, message pass-through, and the re-read. |
| B5 — Edit **Done (2026-11-01)** | `updateBankAccountAction` posts `{ bank_id, iban_number }` as JSON to `/update-bank-accounts/{id}`; a non-positive-integer account ID is `not_found` without a request; the API's 404 (unknown or another customer's account) becomes `not_found` with `bankAccounts.notFound`, opens the error result dialog, and re-reads the list. Duplicate check against the other loaded accounts (R7). Success message in the result dialog; a 422 is toast-only. | Tests cover the path and body, a bank change, invalid account IDs without a request, the 404 mapping, 422, malformed responses, keeping the own IBAN, refusing another account's IBAN, and the re-read after not found. |
| B6 — Delete **Done (2026-11-01)** | `deleteBankAccountAction` calls `DELETE /bank-accounts/{id}` after the confirmation; shared account-ID check and 404 mapping with edit (`not_found`, `bankAccounts.notFound`, re-read); the result dialog shows the backend message and the tab re-reads the list. | Tests cover the path, the message, invalid IDs without a request, the 404 mapping, a non-envelope answer, the session check, and the re-read. |
| B7 — Remove mock transitions **Done (2026-11-01)** | `api.mock.ts` implements the live `BankAccountsApi` for tests only (stateless; failure rules: unknown bank → 422, unknown account → `not_found`); `BankAccountsTabApi` removed; README status updated. | `api.mock.test.ts` covers paging, search, a write answered without being kept, and both failure rules. |

## 7. Contract questions and backend follow-ups

| Q | Question | Evidence / status |
| - | -------- | ----------------- |
Answers received 2026-11-01.

| Q | Question | Answer |
| - | -------- | ------ |
| Q1 | Response shapes and codes? | Resolved: success guards accept body `code: 200` or `201` (R1). |
| Q2 | Should duplicate accounts be allowed? | Resolved: **no**. The app rejects an IBAN already in the customer's accounts on add and edit (R7). The backend still accepts duplicates (§3.3). |
| Q3 | Can the bank of an existing account be changed? | Resolved: **yes**. Edit sends `bank_id` with `iban_number`. |
| Q4 | Align the frontend IBAN rule with the backend? | Resolved: **yes**, `SA` + 22 digits, 24 characters. |
| Q5 | Can an account referenced by a pending withdrawal be deleted? | **Open.** Not probed; until answered, the backend decides and the UI handles the response. |

### Backend follow-ups

| # | Follow-up | Answer |
| - | --------- | ------ |
| 1 | Bank lookup data is inconsistent (§3.2). | Test data; used as it is. Closed. |
| 2 | `bank_id` is a string in multipart create/edit responses. | Backend will return an integer in all cases. Pending deployment; re-probe before B4. |
| 3 | `bank_id` on edit is missing from Bruno. | Supported; the app sends it. Closed. |
| 4 | IBAN message example has 23 characters. | The IBAN must be 24 characters. Pending backend message fix. |
| 5 | Non-numeric ID returns an HTTP 500 debug page. | The app sends numeric IDs only (R4). Closed for the frontend. |
| 6 | Another customer's account on edit/delete. | Confirmed: returns 404. Closed. |
| 7 | Is `GET /banks` public? | Yes, by design; call it with `publicServerHttp`. Closed. |
| 8 | IBAN checksum validation. | Acknowledged by backend. No frontend checksum. |

Proposed to the backend: R7 is enforced only against the accounts the app has
loaded (the list is paginated). Rejecting a duplicate IBAN with a `422` would
make the rule complete.

## 8. Live probe history and side effects

On 2026-11-01, with the token the user supplied for testing:

1. Read `/bank-accounts` (en, ar) and `/banks` (en, ar, pagination, search).
   The customer had two accounts (ids 5 and 6).
2. Sent missing-token requests to all five endpoints.
3. Sent invalid add bodies (§4.1); none created an account.
4. Created four test accounts (ids 18–21) to observe create, duplicates, the
   missing checksum, and JSON bodies.
5. Edited only id 18 (IBAN, bank, empty body, JSON body, unknown bank).
6. Deleted ids 21, 20, 19, 18; repeated the delete and edit on 18 for the 404
   responses; sent `DELETE /bank-accounts/abc` (HTTP 500).

The final `GET /bank-accounts` returned the original ids 5 and 6 only,
unchanged. No bearer token is stored in this document.
