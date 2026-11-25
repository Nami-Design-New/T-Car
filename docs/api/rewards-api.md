# Rewards, points, and referrals API

Last updated: 2026-11-25
Base URL: `https://admin.t-car.app/api/user` (TEST, `NEXT_PUBLIC_API_URL`)
Status: R0 (contract evidence and plan) and R1 (feature-owned APIs) done; R2–R12 open. Branch
`feature/rewards-api`.

Sources: Bruno `User Application/Setting/referal and points` (12 requests),
`User Application/Auth/verifyReferalCode.yml`, `completeProfile.yml`, and
authenticated / unauthenticated live requests on TEST (2026-11-25). Only
response structure and messages are recorded; the token and customer values
are omitted.

TEST data was seeded from the design through the admin dashboard on
2026-11-25: four packages (Bronze 1,000 · Silver 5,000 · Gold 10,000 ·
Diamond 20,000, with the design's perks and badge icons), four discount cards
(50 SAR / 1,000 points, 100 / 1,900, 200 / 3,800, 300 / 6,000), and a referral
reward of 500 points. The test customer has no points or bookings, so the
populated shapes of `/points`, `/my-discount-cards`, `current_package`, and
`complete-booking-rewords` are taken from the Bruno docs, not observed.

## 1. Decisions

| Question | Decision |
| --- | --- |
| Tiers | **Fully dynamic** (product decision 2026-11-25). A tier is an API package: numeric id (as a string), name, `icon_url`, three colours, start/end points, perks. Routes become `/rewards/tiers/{id}`. The fixed `bronze/silver/gold/diamond` ids, `TIER_STYLES`, and local badge images are removed from the model. |
| Tier name | Shown as the API returns it. The admin has one untranslated name field (backend ask B3). |
| Tier colours | `high_color`, `medium_color`, `low_color` build the badge/hero gradient (light → mid → dark), replacing the per-tier Tailwind gradients. |
| Perks | API `features[]`: `key` + translated `title` (+ `code`). `key` picks the perk icon (10 known keys, fallback icon for unknown keys). The API has no perk description, so the description line is dropped. |
| Below the first tier | `current_package` is `null` below the first `start_points`. The app keeps its current rule and shows the first tier as current (backend ask B4). |
| Balances | `level_points` = tier points (`tierPoints`); `can_replaced_points` = spendable balance (`balance`). Redemption changes only the balance. |
| Envelope | HTTP 200 for every outcome except 401; the real status is the body `code`. Reads throw `AppError`; `404` → `null` → `notFound()`. Writes return `Result`; backend 422/400 messages are toasted with `useNotify()` and keep the dialog open. |
| Pagination | `points`, `referal-rewords`: `data.pagination`. `my-discount-cards`: top-level `pagination` beside `data` (the wallet / bank-accounts shape). Both map to `ApiPagination`. |
| Filtering | Done by the API (`filter` query param), not on the client. |
| Referral code at sign-up | In scope: live `verify-referal-code` check plus `referal_code` sent with `completeProfile`. |
| Booking-complete points | In scope (R11); the screen still needs a design reference. |
| Redemption | `replace-points/quote` feeds the confirm dialog; `replace-points` redeems. Both are GET (backend ask B1). |

## 2. Endpoints

All need the bearer token (sent by `serverHttp`) except
`verify-referal-code`, where it is optional. `Accept-Language: ar | en`.

| # | Method | Path | Query / body | Used by |
| --- | --- | --- | --- | --- |
| E1 | GET | `/referal-info` | — | Referrals page |
| E2 | GET | `/referal-rewords` | `per_page` (1–100, default 10), `page` | Referral history |
| E3 | POST | `/auth/verify-referal-code` | JSON `{ referal_code }` (≤ 16 chars, case-insensitive) | Register form |
| E4 | POST | `/complete-profile` | adds `referal_code` to the existing body | Register form (auth) |
| E5 | GET | `/points` | `filter` = `earned \| used` (omit for all), `per_page`, `page` | Points page, account summary card |
| E6 | GET | `/packages` | — | All tiers |
| E7 | GET | `/packages/current` | — | Rewards overview |
| E8 | GET | `/packages/{id}` | — | Tier detail |
| E9 | GET | `/discount-cards` | — | Catalog |
| E10 | GET | `/my-discount-cards` | `filter` = `active \| used \| expired` (omit for all), `per_page`, `page` | My cards |
| E11 | GET | `/replace-points/quote` | `discount_card_id` | Redemption confirm dialog |
| E12 | GET | `/replace-points` | `discount_card_id` | Redemption (write) |
| E13 | GET | `/booking/{order}/complete-booking-rewords` | — | Booking-complete screen |

## 3. Observed DTOs

Shared envelope: `{ data: T, message: string, code: number }`.

### 3.1 E1 `GET /referal-info` (observed)

```ts
interface ReferalInfoDto {
  referal_code: string;          // "TCAR-T2FZ"
  referal_reword_value: number;  // 500 (admin setting)
  user_level_points: number;
  user_can_replace_points: number;
}
```

### 3.2 E2 `GET /referal-rewords` (observed, one pending invite)

```ts
interface ReferalRewordsDto {
  referal_rewords: {
    id: number;
    user_name: string;
    points: number | null;              // null while pending
    status: "pending" | "applied";      // applied on the friend's first completed booking
    joint_at: string;                   // "Y-m-d H:i:s"
    first_order_at: string | null;
  }[];
  referal_rewords_count: number;
  applied_referal_rewords_count: number;
  referal_points: number;
  pagination: ApiPagination;
}
```

### 3.3 E3 `POST /auth/verify-referal-code` (observed)

| Case | Response |
| --- | --- |
| Valid code (any case) | `code: 200`, `data: { valid: true, referrer_name: string \| null }` (`null` for the test referrer, who has no name) |
| Own code (token sent), unknown code | `code: 422`, "The referral code is invalid." |
| Missing / longer than 16 | `code: 422`, field validation message |

### 3.4 E5 `GET /points` (envelope observed; transaction shape from Bruno)

```ts
interface PointsDto {
  level_points: number;
  can_replaced_points: number;
  last_replaced_points: number;       // 0 when none
  transactions: {
    id: number;
    type: "earned" | "used";
    point_type: "booking_reward" | "referral_reward" | "rate_reward" | "replace";
    title: string;                    // translated
    points: number;                   // negative when used
    order_id: number | null;
    discount_card_id: number | null;
    discount_value: number | null;
    date: string;                     // "Y-m-d H:i:s"
  }[];
  pagination: ApiPagination;
}
```

### 3.5 E6 / E8 package, E7 current (observed)

```ts
interface PackageDto {
  id: number;
  name: string;
  icon_url: string;
  start_points: number;
  end_points: number;
  high_color: string;    // "#F3C29B"
  medium_color: string;
  low_color: string;
  current_package: boolean;
  features: { key: string; title: string; code: string | null }[];
}

interface CurrentPackageDto {
  level_points: number;
  can_replaced_points: number;
  current_package: PackageDto | null;
  other_packages: { id: number; name: string; icon_url: string; start_points: number }[];
}
```

Known perk keys: `bronze_welcome`, `monthly_points`,
`monthly_contract_discount`, `booking_wallet_refund`,
`monthly_discount_code`, `points_every_days`, `free_delivery_every_bookings`,
`vip_support_24h`, `free_delivery_pickup_all`, `diamond_offers`.
E8 with an unknown id: `code: 404`, "The requested resource was not found."

### 3.6 E9 `GET /discount-cards` (observed)

```ts
interface DiscountCardsDto {
  can_replaced_points: number;
  discount_cards: { id: number; discount_value: number; points_count: number }[];
}
```

Validity is a fixed 90 days (Bruno); there is no per-card field.

### 3.7 E10 `GET /my-discount-cards` (envelope observed; card from Bruno)

```ts
// data: MyDiscountCardDto[], pagination at the top level
interface MyDiscountCardDto {
  id: number;
  discount_card_id: number;
  code: string;
  discount_value: number;
  points_count: number;
  status: "active" | "used" | "expired";
  expire_at: string;
  used_at: string | null;
  order_id: number | null;
}
```

### 3.8 E11 quote, E12 redeem

| Case | Response |
| --- | --- |
| E11 success (Bruno) | `data: { points_count_before, replace_points, points_count_after }` |
| E12 success (Bruno) | `data: { level_points, can_replaced_points, last_replaced_points, discount_card: MyDiscountCardDto }` |
| Not enough points (observed on E11) | `code: 400`, "You do not have enough replaceable points for this discount card." |
| Missing id / unknown id (observed) | `code: 422`, "Select a discount card." / "The selected discount card does not exist." |

E12 has not been called: it spends points. Its first live call needs a
customer with points and the user's approval.

### 3.9 E13 `GET /booking/{order}/complete-booking-rewords`

Bruno: `data: { order_id, earned_points, level_points, can_replaced_points }`
(`earned_points` = booking reward + rating reward, 0 when none). Observed only
the `code: 404` for an order that is not the customer's.

### 3.10 Unauthorized

Without a token: HTTP 401, `{ data: null, message: "Unauthorized. Please log in.", code: 401 }`,
handled by `serverHttp` (signs the session out, A8).

## 4. Model changes

| Feature | Current model | Change |
| --- | --- | --- |
| referrals | `ReferralProgram`, `ReferralHistory` (all invites, counts on the client) | History gains `pagination`; counts and total points come from the API. `status: applied` maps to the existing `rewarded` state. `ReferralCodeCheck` gains `referrerName`. |
| points | `type: earned \| spent \| expired`, `PointsSource` union, client-side filter | `type: earned \| used`; source from `point_type` (`booking`, `referral`, `rating`, `redemption`); `title` from the API; `expired` and the per-booking `balance` field are removed; filter and pagination move to the query. |
| rewards | `RewardTierId` union, `threshold`, perks with `description` and `icon` | `RewardTier { id: string; name; iconUrl; colors: { high, medium, low }; startPoints; endPoints; perks: { key; title; code }[] }`; `isRewardTierId` and `TIER_STYLES` removed; `RewardCatalogItem` validity fixed at 90; `RewardCardsData` gains pagination, balance read separately. |

## 5. Integration fractions

Each fraction is its own commit, verified per `AGENTS.md` (typecheck, lint,
tests, build, route smoke with `next start`), with `docs/README.md` updated
and the user's approval before committing.

| Fraction | Scope | Completion evidence |
| --- | --- | --- |
| R0 — Contract and plan **Done (2026-11-25)** | Probe E1–E13 (E12 skipped, E4 from Bruno), seed TEST from the design, record DTOs, decisions, and fractions. | This document. |
| R1 — Feature-owned APIs **Done (2026-11-25)** | Moved `services/{points,referrals,rewards}.api.ts` and their mocks into `features/<x>/api.ts` + `api.mock.ts` (and the rewards mock test to `features/rewards/api.mock.test.ts`), no behavior change. The rewards mock repeats the points mock's two balances, because a feature may not import another feature's mock. | Queries, actions, and tests import from the feature; no `services/` file refers to the three features; typecheck, lint, 1,040 tests, and build pass; the nine account pages render the same mock data in `ar` and `en` with a session, redirect to sign-in without one, and an unknown tier id carries `NEXT_NOT_FOUND`. |
| R2 — Referral program | E1 through `serverHttp` with a strict DTO guard and mapper. | Referrals page shows the live code and reward value; mapper tests (observed payload, malformed, 401). |
| R3 — Referral history | E2 paginated (`InfiniteList` + `usePaginatedList`, as the bank-account picker); counts from the API. | History page lists live invites, loads the next page on scroll; pending invite shows no points. |
| R4 — Referral code at sign-up | E3 behind `checkReferralCodeAction` (shows `referrerName`); E4 sends the checked `referal_code` with the profile. | Register form: valid / invalid / own-code cases; profile completion with a code; auth tests updated. |
| R5 — Points history | E5 with server `filter` and pagination; new transaction model; account summary card reads the balances from E5 (`per_page=1`). | `/account/points` all / earned / used tabs read the API; mapper tests for each `point_type`. |
| R6 — Dynamic tier model | Model, mock, and components move to API-shaped tiers (§4): name, icon URL, colour gradient, perk icon by `key`; route `/rewards/tiers/[id]`. Still on the mock. | Tier pages render from the API-shaped mock in `ar` and `en`; unknown tier id → `NEXT_NOT_FOUND`. |
| R7 — Live tiers | E6 + E7 for the overview and all-tiers pages, E8 for the tier detail (`404` → `notFound()`). | Live packages render; a customer below the first tier sees it as current. |
| R8 — Catalog | E9; balance from the same response. | Catalog shows the four live cards, all unaffordable for the test customer. |
| R9 — My cards | E10 with server filter and pagination. | My cards page reads the API per filter; empty state on TEST. |
| R10 — Redemption | Confirm dialog reads E11; confirm calls E12 in a Server Action returning `ActionResult`; 400/422 toasted, dialog stays open. | Insufficient-points path verified live; success path verified once with the user's approval on a customer with points. |
| R11 — Booking-complete points | E13 on the completed-booking screen (design reference needed). | Earned points shown for a completed booking; 404 handled. |
| R12 — Remove production mocks | No production caller uses a rewards, points, or referrals mock; mocks stay for tests. | Grep shows mocks imported only from tests. |

## 6. Backend asks

| # | Ask |
| --- | --- |
| B1 | `replace-points` spends points but is a GET (prefetch / retry can redeem twice). Make it a POST; the quote can stay GET. |
| B2 | Pagination sits inside `data` for `/points` and `/referal-rewords` but beside `data` for `/my-discount-cards`. Pick one. |
| B3 | Package names have one untranslated field; the English API returns the Arabic name. Add `name_ar` / `name_en` (or translate `name` from `Accept-Language`). |
| B4 | Below the first package `current_package` is `null`. Either start the first package at 0 or confirm the app should show the first package as current. |
| B5 | Perks have no description or icon; the design shows both. Add a description, or confirm the app maps `key` to an icon and drops the description. |
| B6 | The Gold perk's `code` is stored in the admin (`TCARGOLD`) but `/packages` returns `code: null`. Confirm whether it is hidden until the customer reaches that package. |
| B7 | Admin dashboard: editing a package sends POST without `_method=PUT` and gets 405. |
| B8 | `verify-referal-code` returns the same "invalid" message for the customer's own code; a distinct message if the design has one. `referrer_name` is `null` for a referrer without a name. |
| B9 | Field names keep typos (`referal`, `rewords`, `joint_at`). Fix before integration or keep them as the contract (the app maps them in one place). |
| B10 | Seed TEST with a customer who has points, a redeemed card, and a completed booking, so E5, E10, E12, and E13 can be verified with data. |
