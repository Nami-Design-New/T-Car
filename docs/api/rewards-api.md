# Rewards, points, and referrals API

Last updated: 2026-11-26
Base URL: `https://admin.t-car.app/api/user` (TEST, `NEXT_PUBLIC_API_URL`)
Status: R0–R9 done; R10 (redemption) implementation in progress; R11–R12 open.
Branch `feature/rewards-tiers`.

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

An R7 live probe later on 2026-11-25 found changed TEST package thresholds:
Silver (id 6) 0–999, Bronze (id 5) 1,000–4,999, Gold (id 7) 5,000–9,999,
Diamond (id 8) 10,000–19,999. E6 returns them in that order. E7 names Silver
as current for the supplied TEST token. E8 for id 6 succeeds and an unknown id
returns body `code: 404`. E6/E7/E8 include the documented fields plus
`is_passed`; E8 also includes `next_package_name` and `next_features`. English
still receives Arabic package names (B3). The app follows the live points
thresholds; whether this change was intentional is a backend/product follow-up
(B13).

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
| Pagination | Beside `data` for every paginated endpoint (`points`, `referal-rewords`, `my-discount-cards`), per the backend answer to B2. |
| Filtering | Done by the API (`filter` query param), not on the client. |
| Referral code at sign-up | In scope: live `verify-referal-code` check plus `referal_code` sent with `completeProfile`. |
| Booking-complete points | In scope (R11); the screen still needs a design reference. |
| Redemption | `replace-points/quote` (GET) feeds the confirm dialog; `replace-points` (POST, JSON `discount_card_id`) redeems, per the backend answer to B1. |

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
| E12 | POST | `/replace-points` | JSON `{ discount_card_id }` | Redemption (write) |
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
// data: the fields below; pagination sits beside data (B2 answer)
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
// data: the fields below; pagination sits beside data (B2 answer)
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
  other_packages: { id: number; name: string; icon_url: string; start_points: number;
    high_color?: string; medium_color?: string; low_color?: string }[];
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
  discount_cards: {
    id: number;
    discount_value: number;
    points_count: number;
    /** Observed in a fresh R9 probe; the app uses it for the redeem button. */
    can_replace: boolean;
  }[];
}
```

Validity is a fixed 90 days (Bruno); there is no per-card field. A fresh
response returned `can_replace` on every card (all `false` with a zero
balance); the earlier Bruno contract omitted it.

### 3.7 E10 `GET /my-discount-cards` (envelope observed; card from Bruno)

R9 probes found an empty list and top-level pagination for omitted `filter`
and for `active`, `used`, and `expired` on TEST. The first page uses
`per_page=10`; subsequent pages use the same filter. E10 has no balance, so
My Cards reads `can_replaced_points` from E9. For card rows, a timestamp
without an offset is interpreted as Riyadh time, as with E5.

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

E12 is `POST /replace-points` with JSON `{ discount_card_id }` (backend
answer to B1). It has not been called: it spends points. Its first live call
needs a customer with points and the user's approval.

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
| referrals | `ReferralProgram`, `ReferralHistory` (all invites, counts on the client) | `ReferralHistory` holds `page: Page<ReferralInvite>`, `invitedCount`, `completedCount`, and `totalPoints` from the API. Invite `status: applied` maps to the existing `rewarded` state. `ReferralCodeCheck` has `inviterName: string \| null` for valid codes. |
| points | `PointsData { summary; page: Page<PointsTransaction> }`; `type: earned \| used`; nullable booking/rating ids and redemption value | E5 supplies the balances, signed points, translated title, source from `point_type`, and nested pagination. Server page 1 uses the URL filter (`spent` → `used`); later pages load through a Server Action. The account shell's unused E5 summary read was removed in R7. Dates without an offset are interpreted as Riyadh time. |
| rewards | `RewardTierId` union, `threshold`, perks with `description` and `icon` | `RewardTier { id: string; name; iconUrl; colors: { high, medium, low }; startPoints; endPoints; perks: { key; title; code }[] }`; `isRewardTierId` and `TIER_STYLES` removed; `RewardCatalogItem` validity fixed at 90; `RewardCardsData` gains pagination, balance read separately. |

## 5. Integration fractions

Each fraction is its own commit, verified per `AGENTS.md` (typecheck, lint,
tests, build, route smoke with `next start`), with `docs/README.md` updated
and the user's approval before committing. The route and source-file mapping
below this table identifies the pages affected by each fraction.

| Fraction | Scope | Completion evidence |
| --- | --- | --- |
| R0 — Contract and plan **Done (2026-11-25)** | Probe E1–E13 (E12 skipped, E4 from Bruno), seed TEST from the design, record DTOs, decisions, and fractions. | This document. |
| R1 — Feature-owned APIs **Done (2026-11-25)** | Moved `services/{points,referrals,rewards}.api.ts` and their mocks into `features/<x>/api.ts` + `api.mock.ts` (and the rewards mock test to `features/rewards/api.mock.test.ts`), no behavior change. The rewards mock repeats the points mock's two balances, because a feature may not import another feature's mock. | Queries, actions, and tests import from the feature; no `services/` file refers to the three features; typecheck, lint, 1,040 tests, and build pass; the nine account pages render the same mock data in `ar` and `en` with a session, redirect to sign-in without one, and an unknown tier id carries `NEXT_NOT_FOUND`. |
| R2 — Referral program **Done (2026-11-25)** | E1 through `serverHttp` with a strict DTO guard and mapper; E2 history and E3 code checks stay on the mock. | `getProgram` requests `/referal-info` and maps the observed code and 500-point reward; tests cover the observed payload, malformed responses, unchanged 401 propagation, and mock identity for history and code checks; typecheck, lint, 1,049 tests, and build pass; with a session, `/ar` and `/en` `account/referrals` show the live code (`TCAR-T2FZ`) and the 500-point reward, history still shows the mock invites, and the page redirects to sign-in without a session. |
| R3 — Referral history **Done (2026-11-25)** | E2 paginated (`InfiniteList` + `usePaginatedList`); counts from the API. | `getHistory` requests `/referal-rewords` with `page` and `per_page=10`, validates nested pagination, counts, rows, and statuses, and maps them to `ReferralHistory`; the server supplies page 1 and a Server Action loads later pages on scroll. The reward badge shows only for a rewarded invite with known points (unchanged for pending invites). Mapper, action, component, and model tests cover the new shape. Typecheck, lint, 1,062 tests, and build pass; with a session, `/ar` and `/en` `account/referrals/history` list the two live TEST invites with the API counts ("2 invites · 0 completed", 0 points) and local dates, and redirect to sign-in without one. |
| R4 — Referral code at sign-up **Done (2026-11-25)** | E3 through the public server client behind `checkReferralCodeAction`; E4 sends the checked `referal_code` with the profile. | E3 posts the normalized code without a bearer token, maps valid responses with a name or `null`, and treats body-code 422 as invalid. Format and length checks avoid a request for bad codes. A valid store code reaches `/complete-profile` as `referal_code`; absent or unchecked codes are omitted. The no-name hint and banner render in both locales. Referral and auth tests cover the transport, validation, UI, and profile body; a blank referrer name is shown as no name. Typecheck, lint, 205 referral and auth tests, and build pass. On `next start`, the code-check Server Action returns valid with the referrer name for `TCAR-T2FZ` (any case) and `{ valid: false }` for an unknown, over-long, or malformed code, in `ar` and `en`; the invite link (`?auth=login&ref=…`) renders. `/complete-profile` was not called live (it creates accounts; backend ask B11). |
| R5 — Points history **Done (2026-11-25)** | E5 with server `filter` and pagination; new transaction model; account summary card reads the balances from E5 (`per_page=1`). | `/account/points` reads the API's first page for all / earned / used (`spent` in the URL); `InfiniteList` loads later pages through a validated Server Action. The mapper checks nested pagination, each `point_type`, signed points, and dates, and uses the API title. The account shell reads balances with `per_page=1`. Points model, mapper, action, and component tests cover the flow. Typecheck, lint (one existing warning), all 1,103 tests, and production build pass. On `next start`, unauthenticated requests for all three filters in `ar` and `en` redirect to sign-in with the filter preserved; signed-in HTML smoke remains open. |
| R6 — Dynamic tier model **Done (2026-11-25, `43ca0d7`)** | Model, mock, and components use API-shaped tiers (§4): name, icon URL, colour gradient, perk icon by `key`; route `/rewards/tiers/[id]`. Still on the mock. | Typecheck, lint (one existing warning), and 49 focused tests pass; tests cover an arbitrary fifth package, API-shaped mock data, unknown perk keys, and an unknown tier id producing `NEXT_NOT_FOUND`. Production build and `next start` smoke were skipped at the user's direction after the existing `.next` cache blocked page-data collection. Full suite before merge. |
| R7 — Live tiers **Done (2026-11-25, `f631352`)** | The overview reads E7 only: `current_package` for hero/perks and deduplicated `other_packages` for the road. The account layout's unused `/points` summary request was removed; points history still reads `/points` on its own page. All-tiers reads E6 + E7; detail also reads E8 (`404` → `notFound()`). Cards and redemption remain mocked. | DTO guards map API names, icon URLs, three colours, point ranges, perks, and E7 balances; the first tier is current below its start points. E8 supplies the selected detail and maps 404 to `null`. Typecheck, lint (one existing warning), and 65 rewards-focused tests pass, including E7-only overview, current-tier deduplication, unknown-id route, and API-colour gradients. A live TEST probe confirmed E6/E7/E8 fields in `ar` and `en` and E8 body-code 404; it found changed package thresholds (B13). Production build and signed-in route smoke remain pending under the user's skip-build instruction. |
| R8 — Catalog **Done (2026-11-25, `df1cffe`)** | E9 supplies four cards and the redeemable balance in one response; each item maps its numeric id, discount value, point cost, and `can_replace` flag (which controls the redeem button), with documented 90-day validity. My cards and redemption remain mocked for R9–R10. | A live TEST E9 probe returned card ids 5–8, discounts 50–300, costs 1,000–6,000, and zero redeemable points. Typecheck, lint (one existing warning), and 68 rewards-focused tests pass, including E9 mapping, empty catalog, malformed data, and transport errors. Production build and signed-in route smoke remain pending under the user's skip-build instruction. |
| R9 — My cards **Implementation ready (2026-11-25)** | E10 with server filter and pagination, page size 10; E9 supplies the balance. `/account/rewards/cards?filter=active\|used\|expired` preserves the selected filter in the URL, and a Server Action loads later pages. This fraction also corrected R8 to use E9's per-card `can_replace` instead of comparing the balance. | TEST returned an empty E10 list for all four filters, with `pagination` at the response top level. The mapper validates the Bruno row shape and dates; typecheck, lint (one existing warning), and 74 rewards-focused tests pass. Route smoke remains pending; production build is skipped at the user's direction. |
| R10 — Redemption **Implementation in progress (2026-11-26)** | Confirm dialog reads E11; confirm calls E12 in a Server Action returning `ActionResult`; 400/422 toasted, dialog stays open. Points and referrals use B2's top-level pagination shape. | Typecheck, lint (one existing warning), 180 focused tests, and production build pass. Unauthenticated affected routes redirect to sign-in in both locales. Signed-in route smoke and live verification of the revised contracts remain pending. E11 insufficient points was observed; E12 success requires a customer with points and approval. |
| R11 — Booking-complete points | E13 on the completed-booking screen (design reference needed). | Earned points shown for a completed booking; 404 handled. |
| R12 — Remove production mocks | No production caller uses a rewards, points, or referrals mock; mocks stay for tests. | Grep shows mocks imported only from tests. |

### Pages affected by each fraction

Routes below omit the locale prefix; the same page files serve `/ar` and `/en`.

| Fraction | Route or UI | Source in this codebase |
| --- | --- | --- |
| R0 | Planning only | No page changed. |
| R1 | Shared account sections | [Account sections layout](<../../src/app/[locale]/account/(sections)/layout.tsx>) and the rewards, referrals, and points feature APIs. |
| R2 | `/account/referrals` | [Referral program page](<../../src/app/[locale]/account/(sections)/referrals/page.tsx>) |
| R3 | `/account/referrals/history` | [Referral history page](<../../src/app/[locale]/account/(sections)/referrals/history/page.tsx>) |
| R4 | Sign-up modal, opened across the app; no dedicated route | [RegisterForm](../../src/features/auth/components/RegisterForm.tsx) and [ReferralCodeField](../../src/features/referrals/components/ReferralCodeField.tsx) |
| R5 | `/account/points` | [Points history page](<../../src/app/[locale]/account/(sections)/points/page.tsx>) |
| R6 | `/account/rewards`, `/account/rewards/tiers`, `/account/rewards/tiers/[id]` | [Rewards overview](<../../src/app/[locale]/account/(sections)/rewards/page.tsx>), [all tiers](<../../src/app/[locale]/account/(sections)/rewards/tiers/page.tsx>), [tier detail](<../../src/app/[locale]/account/(sections)/rewards/tiers/[id]/page.tsx>) |
| R7 | `/account/rewards`, `/account/rewards/tiers`, `/account/rewards/tiers/[id]` | The same three rewards pages above, plus the [account sections layout](<../../src/app/[locale]/account/(sections)/layout.tsx>) for removal of its unused `/points` read. |
| R8 | `/account/rewards/catalog` | [Rewards catalog page](<../../src/app/[locale]/account/(sections)/rewards/catalog/page.tsx>) → `getRewardCatalog()` → E9 `GET /discount-cards`. |
| R9 | `/account/rewards/cards` | [My cards page](<../../src/app/[locale]/account/(sections)/rewards/cards/page.tsx>) |
| R10 | `/account/rewards/catalog` | [Rewards catalog page](<../../src/app/[locale]/account/(sections)/rewards/catalog/page.tsx>) and its redemption dialogs/action. |
| R11 | `/account/bookings/[id]` (planned; design reference pending) | [Booking detail page](<../../src/app/[locale]/account/bookings/[id]/page.tsx>) |
| R12 | Rewards, referrals, and points account pages | Feature-owned APIs in `src/features/{rewards,referrals,points}/api.ts`; no new page planned. |

## 6. Backend asks

| # | Ask |
| --- | --- |
| B1 | `replace-points` spends points but was a GET (prefetch / retry can redeem twice). **Answered 2026-11-26: it will be `POST /replace-points` with JSON `{ discount_card_id }`; the quote stays GET.** The app uses POST. |
| B2 | Pagination sat inside `data` for `/points` and `/referal-rewords` but beside `data` for `/my-discount-cards`. **Answered 2026-11-26: pagination will be beside `data` for all three.** The app reads the top-level `pagination` only (switched in R10). |
| B3 | Package names have one untranslated field; the English API returns the Arabic name. Add `name_ar` / `name_en` (or translate `name` from `Accept-Language`). |
| B4 | Below the first package `current_package` is `null`. Either start the first package at 0 or confirm the app should show the first package as current. |
| B5 | Perks have no description or icon; the design shows both. Add a description, or confirm the app maps `key` to an icon and drops the description. |
| B6 | The Gold perk's `code` is stored in the admin (`TCARGOLD`) but `/packages` returns `code: null`. Confirm whether it is hidden until the customer reaches that package. |
| B7 | Admin dashboard: editing a package sends POST without `_method=PUT` and gets 405. |
| B8 | `verify-referal-code` returns the same "invalid" message for the customer's own code; a distinct message if the design has one. `referrer_name` is `null` for a referrer without a name; R4 handles this with no-name hint and banner variants in the UI. |
| B9 | Field names keep typos (`referal`, `rewords`, `joint_at`). Fix before integration or keep them as the contract (the app maps them in one place). |
| B10 | Seed TEST with a customer who has points, a redeemed card, and a completed booking, so E5, E10, E12, and E13 can be verified with data. |
| B11 | `/complete-profile` takes the optional `referal_code`, but its behaviour with an invalid or since-removed code is unconfirmed (it cannot be probed without creating an account). The app sends only a code that `verify-referal-code` accepted and that the action re-checks for format; confirm whether the backend validates it again, and whether an invalid code fails the whole profile (422) or is ignored. |
| B12 | Return `date` with a time-zone offset (ISO 8601); the app assumes Riyadh time for the current `Y-m-d H:i:s` value. |
| B13 | Confirm whether TEST's package thresholds were intentionally changed after the design seed: Silver now starts at 0, Bronze at 1,000, Gold at 5,000, Diamond at 10,000. The app follows the live API ordering by `start_points`. |
