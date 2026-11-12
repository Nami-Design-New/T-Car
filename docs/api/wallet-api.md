# Wallet API

Last updated: 2026-11-01  
Base URL: `https://t-car.app/api/user`  
Status: integrated (W0–W9 done, 2026-11-01); backend follow-ups in §7.

Sources: Bruno `User Application/Setting/wallet`, current `serverHttp` and
`ApiPagination` conventions, and authenticated/unauthenticated live requests.
Only response structure and messages are recorded; the supplied token and
customer values are omitted.

## 1. Decisions and observed behavior

| Question | Decision / observation |
| --- | --- |
| Summary source | Use the summary fields returned by `GET /wallet`; do not use `/profile` as the wallet summary source. |
| Request bodies | Match Bruno: both POST requests send JSON `{ "amount": 1, "account_id": 1 }`. |
| Transaction status | `pending \| success \| failed` (provided enum). |
| Transaction type | `refund \| payment \| topup \| withdrawal` (provided enum). |
| Pagination | Ask backend to add it; meanwhile define it using the app's `ApiPagination` shape and plan for `page` / `per_page`. |
| Success/validation copy | Show the backend message using `useNotify()`; validation is toast-only. |
| Caps, throttling, pending restrictions, idempotency | Keep these server-authoritative and out of the frontend contract for now. The UI must not invent policy; handle a backend rejection through the standard error path. |

## 2. Endpoints and request DTOs

| Method | Path | Request | Purpose |
| --- | --- | --- | --- |
| `GET` | `/wallet` | `page`, `per_page` (pagination requested; not yet returned) | Wallet summary and transaction history |
| `GET` | `/bank-accounts?per_page=10&page=1` | query params | Bank accounts available for withdrawal |
| `POST` | `/wallet` | `WalletActionRequest` | Top-up |
| `POST` | `/wallet/withdraw` | `WalletActionRequest` | Withdrawal |

Bruno's request DTO for both POST endpoints:

```ts
interface WalletActionRequest {
  amount: number;
  account_id: number;
}
```

The Bruno sample is `amount: 1`, `account_id: 1`. A top-up request with that
body returned HTTP 200 / body code 200. The same body on withdrawal returned a
422 validation envelope saying the amount is required, even when the account
ID was selected from the live bank-account list. Keep the Bruno DTO documented,
but resolve this mismatch with the backend before implementing withdrawal.

## 3. Observed success DTOs

Every observed response is JSON with the shared envelope:

```ts
interface ApiEnvelope<T> {
  data: T;
  message: string;
  code: number;
}
```

### 3.1 `GET /wallet`

HTTP 200, `code: 200`. This endpoint returns both summary values and
transactions. The wallet screen should map its summary from this response.

```ts
type WalletTransactionType =
  | 'refund'
  | 'payment'
  | 'topup'
  | 'withdrawal';

type WalletTransactionStatus = 'pending' | 'success' | 'failed';

interface WalletTransactionDto {
  id: number;
  value: number;
  type: WalletTransactionType;
  account_id: number | null;
  status: WalletTransactionStatus;
  created_at: string;
}

interface WalletResponseDto {
  transactions: WalletTransactionDto[];
  balance: number;
  withdrawable_balance: number;
  non_withdrawable_balance: number;
}

type WalletResponse = ApiEnvelope<WalletResponseDto>;
```

Observed message: `Transactions fetched successfully.`

Model mapping:

```ts
const summary: WalletSummary = {
  total: data.balance,
  withdrawable: data.withdrawable_balance,
  nonWithdrawable: data.non_withdrawable_balance,
};

const transaction: WalletTransaction = {
  id: String(dto.id),
  amount: dto.value,
  type: dto.type,
  status: dto.status,
  accountId: dto.account_id === null ? null : String(dto.account_id),
  createdAt: dto.created_at,
};
```

The list above records the agreed enum values. Continue to reject malformed
payloads; an unrecognized enum value should become a server-contract error and
be logged rather than silently mapped to a misleading UI row.

### 3.2 Pagination requested from backend

Pagination was not present in the observed `GET /wallet` response. Request
`page` and `per_page` query parameters and add the same metadata shape the app
uses for paginated API responses:

```ts
interface ApiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// Proposed response after backend pagination is added:
type PaginatedWalletResponse = ApiEnvelope<WalletResponseDto> & {
  pagination: ApiPagination;
};
```

Do not assume the current endpoint accepts pagination parameters until the
backend confirms it. The UI integration should be able to render the first
page while that contract is pending.

### 3.3 `GET /bank-accounts`

HTTP 200, `code: 200`. The observed endpoint returns:

```ts
interface BankAccountDto {
  id: number;
  bank_id: number;
  title: string;
  logo: string | null;
  iban_number: string;
}

type BankAccountsResponse = ApiEnvelope<BankAccountDto[]> & {
  pagination: ApiPagination;
};
```

The wallet should reuse the bank-accounts feature API and map numeric IDs to
the existing string ID model. Use `title` for the bank name, retain nullable
`logo`, and derive the masked number from `iban_number`.

### 3.4 `POST /wallet` top-up success

Top-up creates a payment request (current response, 2026-11-01; the earlier
probe recorded `data: null`). The customer pays at `payment_url`; the gateway
ends on the backend-hosted `success_url` or `fail_url`. The balance changes
only after payment, which is why an immediate `GET /wallet` showed no change.

```json
{
  "data": {
    "payment_url": "https://t-car.app/wallet/pay/75?locale=en",
    "success_url": "https://t-car.app/wallet/success/75?locale=en",
    "fail_url": "https://t-car.app/wallet/fail/75?locale=en"
  },
  "message": "Wallet top-up request created successfully.",
  "code": 200
}
```

The app requires all three as `https` URLs (anything else is a `server`
error), toasts the message, and opens `payment_url` in a new tab (opened before
the request so pop-up blockers allow it, without `noopener`). The backend's
success and fail pages post a plain string to `window.opener`:
`'payment-success'` or `'payment-failed'`. The wallet page accepts it only from
that tab and the origins of `success_url` / `fail_url`, closes the tab, shows
the result dialog, and re-reads `GET /wallet` (the API stays the source of
truth for the balance). A tab closed without a message only re-reads the
wallet. If the browser blocks the tab, the page redirects to `payment_url`
instead, with no result dialog on return.

### 3.5 `POST /wallet/withdraw` success

Observed 2026-11-01 with `{ "amount": 1, "account_id": 5 }` (the earlier
"amount field is required" 422 no longer occurs). `data` is the new
transaction, the same DTO as a `GET /wallet` row, created as `pending`:

```json
{
  "data": {
    "id": 84,
    "value": 1,
    "type": "withdrawal",
    "account_id": 5,
    "status": "pending",
    "created_at": "2026-11-01 13:12:58"
  },
  "message": "Wallet withdrawal request created successfully.",
  "code": 200
}
```

The app validates it with the transaction guard, toasts the message, and
re-reads `GET /wallet` for the balance and history.

## 4. Validation and authorization responses

### 4.1 `422` validation

Observed on both wallet POST paths as HTTP 200 with body `code: 422` and
`data: null`. Invalid top-up (`amount: 0`) returned `The amount field is
required.`. The withdrawal request using the Bruno body also returned
`The amount field is required.` despite a numeric amount being sent. No
structured field-error map was observed.

```ts
interface WalletValidationResponse extends ApiEnvelope<null> {
  code: 422;
}
```

The shared HTTP client reads `code: 422` from the envelope and converts it to a
validation `AppError`. Show the backend's `message` through `useNotify()` only;
do not add a second inline validation message for this API response. Client
validation may still prevent obviously malformed amounts before submission.

### 4.2 `401` unauthorized

Unauthenticated `GET /wallet`, `POST /wallet`, and
`POST /wallet/withdraw` returned HTTP 401 with body `code: 401`, `data: null`,
and message `Unauthorized. Please log in.`.

```ts
type WalletUnauthorizedResponse = ApiEnvelope<null> & { code: 401 };
```

The transport handles HTTP 401 by status, clears the session through the
existing unauthorized path, and throws `AppError('unauthorized', ..., 401)`.
The UI should follow the app's established sign-in redirect/session behavior.

## 5. Feature boundary and proposed API

Wire DTOs stay private to `features/wallet/api.ts`; `features/wallet/model.ts`
contains client-safe model types only. Authenticated calls use server-only
`serverHttp`. Keep `features/wallet/index.ts` safe for client imports.

```ts
interface WalletSummary {
  total: number;
  withdrawable: number;
  nonWithdrawable: number;
}

interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  accountId: string | null;
  createdAt: string;
}

interface WalletApi {
  getWallet(page?: number, perPage?: number): Promise<WalletPage>;
  getBankAccounts(): Promise<BankAccount[]>; // delegate to bank-accounts feature
  topUp(input: WalletActionRequest): Promise<Result<null>>;
  withdraw(input: WalletActionRequest): Promise<Result<null>>;
}
```

`WalletPage` should contain the summary, mapped transactions, and pagination
metadata when the backend adds pagination. Until then, represent pagination as
an explicitly unavailable/first-page state rather than fabricating totals.

## 6. Integration fractions

No implementation code is included in this plan. Keep each fraction separate;
update the migration status in `docs/README.md` with every implementation
fraction and request approval before each commit.

| Fraction | Scope | Completion evidence |
| --- | --- | --- |
| W0 — Contract evidence **Done (2026-10-29)** | Probe the live GET, top-up success, validation, and unauthorized cases; record the Bruno request DTOs and agreed transaction enums. | GET `/wallet` 200 shape captured; POST `/wallet` 200 and `code: 422` captured; wallet GET/POST `401` captured; withdrawal's observed 422 mismatch and pagination request are documented as backend follow-ups. |
| W1 — Wallet models and DTO guards **Done (2026-10-29)** | Added the agreed transaction and status unions, required status/account ID model fields, strict guards for the observed `GET /wallet` DTO, and UI mapping (including ID as a temporary reference fallback). | Focused wallet mapper tests pass for the observed payload, all agreed enum values, nullable account ID, malformed values, and invalid envelopes. Typecheck, lint, and production build pass. The full suite has 14 failures in unrelated auth/account/layout/shared UI tests (483 pass); wallet tests pass. The protected wallet route returns the expected unauthenticated 307 login redirect. |
| W2 — Feature-owned wallet API **Done (2026-10-29)** | Move the wallet API interface and mock from `services/` into `features/wallet/`, keeping the current behavior and DTO mapper unchanged. | `features/wallet/api.ts` owns the interface and current API export; `api.mock.ts` owns the mock; `useWallet` imports from the feature. The mock still delegates bank-account reads to the existing service pending its feature API migration. |
| W3 — Read integration preparation **Done (2026-10-29)** | Prepare the authenticated read boundary without wiring a live request: confirm the DTO mapper, captured GET shape, session behavior, and pagination constraints. | Reuse `mapWalletResponse` for the observed GET DTO; perform the future request only through server-only `serverHttp`; rely on its existing 401 session handling; keep the browser token inaccessible; do not add `page` / `per_page` until the backend returns pagination. The current API remains on its mock per the repository's API-integration phase rule. |
| W4 — Authenticated wallet read **Done (2026-10-29)** | Read summary and history together from `GET /wallet` through feature-owned server API code and pass the result to the wallet client. | The route calls a server-only query protected by the existing session check; `serverHttp` adds the backend token and handles 401; tests cover endpoint path, mapping, malformed success, and error propagation. Wallet balances/history no longer load from the browser mock. |
| W5 — Bank-account choices **Done (2026-11-01)** | Delegate to the existing bank-accounts API and map ID/title/logo/IBAN for withdrawal selection. | `features/bank-accounts/api.ts` reads `GET /bank-accounts?page=n&per_page=10` through `serverHttp`, validates the `pagination` block, and maps ID/bank ID to strings, `title` to the bank name, an absolute http(s) `logo` (else none), and the normalized/masked IBAN. `getBankAccountsAction(page)` serves `BankAccountPicker` (in the bank-accounts feature, exported from its index), which loads page 1 on open and the next page on scroll (`usePaginatedList` + `InfiniteList`) with card skeletons, an inline error with retry, and the empty state. The bank accounts tab (list, add, edit, delete) still uses its mock (`features/bank-accounts/api.mock.ts` since bank-accounts B1). Tests cover mapping, pagination, logo handling, malformed DTOs, page validation, and 401 propagation. |
| W6 — Wallet server query and route **Covered by W4** | Add server-only `queries.ts`; load wallet data for the wallet route and pass it to the client screen. Replace the stateful browser read mock. | Route smoke verifies authenticated rendering, loading/error states, and 401 session handling. |
| W7 — Top-up action **Done (2026-11-01)** | Integrate `POST /wallet` with `{ amount }` only (`account_id` omitted for top-up, product decision pending backend confirmation) and `ActionResult`; redirect to the returned payment page, toast backend messages, and handle 422/401 using shared rules. | `walletApi.topUp` posts `{ amount }` and maps the payment URLs (https only); `topUpAction` re-parses the amount and calls it. Success toasts the backend message and opens `paymentUrl` in a new tab; the tab's `payment-success` / `payment-failed` message shows the result dialog and re-reads the wallet; a backend 422 toasts its message and keeps the sheet open without an inline error. Tests cover the observed payment response, missing/non-https URLs, 422, 401, the message parser, and the tab watcher (origin/source checks, tab closed without a message). |
| W8 — Withdrawal action **Done (2026-11-01)** | Integrate `POST /wallet/withdraw`; refresh the wallet on success and handle 422/401. | `walletApi.withdraw` posts `{ amount, account_id }` (numeric ID; a non-integer ID is a validation error without a request) and maps the returned `pending` transaction; `withdrawAction` parses the amount (minimum only) and a required account, leaving balance, ownership, and limits to the API. Success toasts the backend message, shows the result dialog, and re-reads the wallet; a backend 422 is toast-only. Tests cover the observed response, malformed transactions, invalid IDs, 422, and 401. |
| W9 — Remove mock transitions **Done (2026-11-01)** | Retire stateful browser wallet reads and mock-based Server Action balance calculations. Let the API own balance, transaction status, and eligibility. | No production caller uses the wallet mock (W8 removed the last balance transition and the local wallet copy). W9 set `MAX_TOP_UP` to the confirmed 100,000 SAR (shown in the sheet, rechecked by the action) and `WalletTab`'s unused `loading`/`error`/`onRetry` (route `loading.tsx`/`error.tsx` cover the read). |

For each implementation fraction, follow the project checks in `AGENTS.md`:
typecheck, lint, build, and affected-route smoke test; restore tracked
`tsconfig.tsbuildinfo`. Commit approval is separate for every fraction.

## 7. Contract questions and answers

| Q | Answer |
| --- | --- |
| Q1 — Request body | Use the Bruno JSON body for both actions: `{ "amount": number, "account_id": number }`. |
| Q2 — Endpoint responses | Live GET `/wallet` success: HTTP 200 / `code: 200`. Top-up with the Bruno body: HTTP 200 / `code: 200` / `data: null`. Invalid top-up and attempted withdrawals: HTTP 200 / `code: 422` / `data: null`. Unauthenticated GET and POST calls: HTTP 401 / `code: 401` / `data: null`. Withdrawal success was not observed. |
| Q3 — Enums | Transaction status is `pending \| success \| failed`; transaction type is `refund \| payment \| topup \| withdrawal`. |
| Q4 — Summary and pagination | Use summary fields from `GET /wallet`. Request `page` and `per_page` support from backend; model pagination with the app's `ApiPagination`. |
| Q5 — Wallet fields | Use the wallet values returned by `GET /wallet`; do not source the wallet summary from `/profile`. |
| Q6 — Validation message | Show backend success and validation messages as toasts only via `useNotify()`. |
| Q7 — Caps and operational policy | Removed as frontend contract questions. Caps, rate limits, pending-state restrictions, and idempotency remain backend-authoritative; the UI follows the shared error path for rejections. |

### Remaining backend follow-ups

1. ~~Fix/confirm the withdrawal request contract~~: resolved 2026-11-01 (§3.5).
2. Add `page` / `per_page` support and return pagination using `ApiPagination`.
3. ~~Confirm withdrawal's successful response body~~: observed 2026-11-01 (§3.5).
4. Confirm that top-up accepts `{ amount }` without `account_id` (the app
   sends only the amount since W7).
5. ~~Confirm the top-up limits~~: maximum 100,000 SAR confirmed 2026-11-01
   (`MAX_TOP_UP`); minimum stays `MIN_TOP_UP`.
6. The success/fail pages must post `'payment-success'` / `'payment-failed'`
   with `window.opener.postMessage(message, <front-end origin>)` (not `'*'`),
   and must not send a `Cross-Origin-Opener-Policy` that cuts `window.opener`.
