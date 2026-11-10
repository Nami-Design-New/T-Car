# Booking API (checkout and my bookings)

Last verified: 2026-11-08  
Base URL: `https://t-car.app/api/user` (TEST)  
Status: in progress. O0–O6 are done (the list, details, availability, the
draft with its confirmation, and payment are on the live API); O9a is in
progress; O7–O12 are next. The user's answers are recorded in §8.1 and applied throughout. The
questions still open are in §8.2 and §8.3, each with the fraction that must
answer or investigate it. Cancel, extend, edit, and rate still run on the
`orders` mock until their fraction.

Sources: Bruno `tcar/User Application/Booking/*.yml` (17 requests and their
`docs` blocks), the current `features/booking`, `features/my-bookings`,
`features/car-details`, and `services/bookings.api.ts`, and authenticated
requests against TEST on 2026-11-08 (§9). The token and personal values are
omitted. Where Bruno and the live backend disagree, this file records the
**live** behavior and lists the difference in §8.

This plan is written to be carried out by another agent. Read §1 (rules), §6
(gaps between the app and the API), and §7 (fractions) before you start, and
follow `AGENTS.md` (one fraction per commit, verification, approval before
every commit).

## 1. Integration rules

| # | Rule |
| - | ---- |
| R1 | **One data feature owns every `/user/booking*` endpoint**: a new `features/orders` (doc 1 §1.5 item 9: "data used by several features gets its own feature"). It holds `api.ts` (`server-only`, `serverHttp`, DTOs, guards, DTO → model), `api.mock.ts` (tests only), `model.ts` (types and pure rules), `queries.ts` (server reads for pages), `actions.ts` (Server Actions), and `index.ts` (types, pure rules, and the actions; client-safe). `features/booking` (checkout UI) and `features/my-bookings` (account UI) keep their components and import data only from `@/features/orders`. Pages import reads from `@/features/orders/queries`. `services/bookings.api.ts` and `services/mocks/bookings.ts` are deleted at the end (O12). |
| R2 | Every endpoint needs the customer token (`serverHttp`). Without it the backend returns HTTP 401 / `code: 401`, which already signs the session out (A8). |
| R3 | Errors are **HTTP 200 with a body `code`** (404, 422), except 401. `services/http/client.ts` already uses the body code. Today there is no field map, only one localized `message`. A per-field `errors` map is planned by the backend (Q11, answered): do not build field mapping until it ships, and keep the whole-message toast. |
| R4 | Ownership: a booking of another user returns `code: 422` "You are not allowed to perform this action." (Bruno says 403; the per-endpoint list for the backend is in Q4). On `GET /booking/{id}` (user, 2026-11-09): body `404` → `null`, the page calls `notFound()`; body `422` → also `null` and not found (no toast; the user tried a toast and redirect, then chose not-found). That read takes no input, so a 422 there can only be ownership. |
| R5 | Writes return `Result`; Server Actions return `ActionResult` (`toActionResult` / `fromActionResult`). The backend `message` of a success and of a 422 is toasted with `useNotify()` (integrated-API exception in `AGENTS.md`). A failed submit keeps its dialog open with the input and the error. |
| R6 | **Prices come only from the API.** Remove every client price formula (`VAT_RATE = 0.15` in `BookingDailyModal`, the 5% VAT in `ExtendDurationModal`, `booking.pricePerDay + 100` in `BookingConfirmModal`, `cancellationFee()` in `my-bookings/model.ts`). The checkout shows the prices of the draft order (`create-booking`), extend shows `extension-quote`, cancel shows the cancel quote, edit shows the modification preview. |
| R7 | Request bodies are `multipart/form-data` (Bruno) built with `FormData`. Booleans are `"0"` / `"1"`. Arrays use indexed keys: `service_id[0]`, `service_type[0]`, … Dates are `YYYY-MM-DD`; `time` is two-digit `HH`. |
| R8 | A service is identified by the pair **`(id, type)`**, never by `id` alone: on TEST car 1 returns `id: 3` twice (`driver_service` "Additional Driver" and `child_seat_service` "Child Seat"). The service list also changes with the rental context (car 1 with `to_location` returned the driver as `company_service` id 2; with `from_branch` as `driver_service` id 3). Always send the pairs from the car-details read made with the **same** booking and delivery type. |
| R9 | Backend HTML (`terms` on an order, `/privacy-policy` content) is sanitized on the server exactly as car-details R6 does (`sanitize-html` in `api.ts`) and rendered with the shared HTML component (see O3 for moving it out of `car-details`). |
| R10 | Gateway payments (`pay`, `extensions`, `modification-requests-pay`) return `{ payment_url, success_url, fail_url }`. Validate all three as `https` URLs (anything else is a `server` AppError) and open them with the same tab/`window.opener` pattern the wallet top-up uses (docs/api/wallet-api.md §3.4). Confirmed (Q9): the order success and fail pages post `payment-success` / `payment-failed` to `window.opener` like the wallet pages. Extract that logic from `features/wallet` into a shared hook in O6 and use it in both places. The order is confirmed only by re-reading the booking (`GET /booking/{id}`), never by the URL alone. |
| R11 | Statuses: the model keeps the backend's 11 values (§4.1) as a string union; the UI groups them (badge tone, tab). An unknown status is a `server` AppError at the DTO guard (logged), not a silent fallback. |
| R12 | Which actions a booking offers (cancel, extend, edit, rate) is computed by pure rules in `orders/model.ts` (§4.3) from status, pickup time, and flags. The backend stays authoritative: a 422 still goes through R5. |
| R13 | **No points and no coupon in this version** (P3, P5). Never send `use_points`; never call `apply-coupon` (E4); remove the points switch from `PaymentMethodModal` and every `pointsUsed` field. `points` / `points_value` from E3 and `coupon_*` from the order are mapped out at the DTO boundary. |
| R14 | **Payment choice** (P3): the customer picks the wallet alone, one gateway method alone, or the wallet **plus** one gateway method (the wallet pays first, the method pays the rest). Requests: wallet alone → `use_wallet=1`; method alone → `payment_method_id`; both → `use_wallet=1` + `payment_method_id`. A wallet-alone choice that the balance does not cover gets the backend 422 (shown per R5); the UI may also disable "wallet alone" when `wallet_balance < final_price`. |
| R15 | Every booking type is supported, each with its own booking modal (P1): daily, monthly, airport, station, international. |
| R16 | No location in the rental context, or no nearest branch for it → "Book now" is disabled and the card asks the customer to choose a location (P2). Never guess a branch. |
| R17 | **Driving license required** (P11). A signed-in customer without a license on file (profile `license: null`) cannot start a booking: "Book now" opens the account license upload dialog first, and a successful upload continues to the dates step. The car page reads the status with `getLicenseStatus()` (`account/queries.ts`); an unreadable profile is "unknown" and does not block (the backend stays authoritative). |
| R18 | **Car-details prices follow the booking type** (Q3b answer). The car read is made with `booking_type`, and for `monthly` `lower_price` / `max_price` are monthly prices (TEST car 1: daily 90 / 100, monthly 45 / 55). The card, the daily and monthly date dialogs (their footer shows this car price, not a client total, R6), and the confirmation label it "/ month" for monthly and "/ day" otherwise. |

## 2. Endpoints

All paths are under `/api/user`. "Probed" means a live request on 2026-11-08
(§9). "Bruno only" means the success body was not observed (no TEST booking in
the needed state) and the shape comes from the Bruno docs.

| # | Method | Path | Body / query | Purpose | Verified |
| - | ------ | ---- | ------------ | ------- | -------- |
| E1 | GET | `/booking/is-available-days` | query: `car_id`, `branch_id`, `type`, `from_day`, `to_day` or `count`, `delivery_type` | Free pickup hours for the period (checkout step 1) | Probed (success and 422s) |
| E2 | POST | `/booking/create-booking` | multipart `CreateBookingBody` (§3.2) | Creates the unpaid draft with every price (checkout step 2) | Probed (success and 422s) |
| E3 | GET | `/booking/{order}/payment-methods` | none | Company payment methods and wallet balance (checkout step 3); `points` ignored (R13) | Probed |
| E4 | POST | `/booking/{order}/apply-coupon` | multipart `code` | Discount on a draft | **Out of scope this version** (P5); 422s probed |
| E5 | POST | `/booking/pay` | multipart `order_id`, `payment_method_id?`, `use_wallet?` (never `use_points`, R13) | Pays the draft (checkout step 4) | Probed (gateway response and 422s; wallet success not exercised) |
| E6 | GET | `/booking` | query: `status?` (`current` or `past`), `per_page?` (1–100, default 10), `page?` | My bookings, paginated, newest first; drafts never listed | Probed |
| E7 | GET | `/booking/{order}` | none | Booking details (`UserOrderResource`) | Probed |
| E8 | POST | `/booking/{order}/cancel` | `is_quote` (query or body, required): `1` quote, `0` cancel | Cancel quote, then cancel | 422s probed; success Bruno only |
| E9 | GET | `/booking/{order}/extension-quote` | query `count` (required) | Price of extending a running rental | Probed (success and 422s) |
| E10 | POST | `/booking/{order}/extensions` | `count`, `payment_method_id?`, `use_wallet?` (query or body; no `use_points`) | Creates and pays the extension | 422s probed; success Bruno only |
| E11 | POST | `/booking/{order}/modification-requests` | multipart `type`, `count?`, `pickup_time?`, `store?`, `payment_method_id?` | Preview (`store=0`) or create (`store=1`) a change before pickup | 422s probed; success Bruno only |
| E12 | POST | `/booking/modification-requests-pay` | multipart `order_id`, `payment_method_id?`, `use_wallet?` (no `use_points`) | Pays an approved modification's difference | 404 probed (no pending request); success Bruno only |
| E13 | POST | `/booking/{order}/rate` | multipart `company_rate`, `driver_rate?` | Rate a completed booking (again = update) | 422s probed; success Bruno only |
| E14 | GET | `/privacy-policy` | none | Privacy policy HTML | Probed |
| E15 | GET | `/bank-accounts` | `per_page`, `page` | Same endpoint as docs/api/bank-accounts-api.md; not needed by booking (refunds go to the wallet) | Covered by that doc |
| E16 | POST | `/booking/{order}/rebook` | json | "Not used in app" (Bruno); known backend bug | **Out of scope** |

## 3. Request DTOs

### 3.1 E1 `GET /booking/is-available-days`

```ts
type BookingType = 'daily' | 'monthly' | 'airport' | 'station' | 'international';
/** Values the backend accepts in requests (live 422 message lists exactly these). */
type DeliveryTypeRequest = 'to_location' | 'from_branch' | 'from_airport' | 'from_station';

interface AvailabilityQuery {
  car_id: number;
  branch_id: number;
  type: BookingType;
  from_day: string;      // YYYY-MM-DD, today or later (always send, also for monthly)
  to_day?: string;       // YYYY-MM-DD, strictly after from_day; required unless monthly
  count?: number;        // >= 1, required when type = monthly (months)
  delivery_type?: DeliveryTypeRequest;
}
```

- `to_day == from_day` is rejected ("The end date field must be a date after
  start date."): the shortest rental is one night.
- For today, past hours are already removed (13:xx local → slots from `14`).
- `to_location` uses the branch **delivery** hours; on TEST branch 3 has none,
  so `to_location` returned "not available" while `from_branch` returned 08–21.
  Confirmed (Q5): a `to_location` booking is possible only when the car is
  available for `to_location` at that branch. This 422 is the expected answer,
  not a bug: show the message and keep the dates dialog open.

### 3.2 E2 `POST /booking/create-booking` (multipart)

```ts
interface CreateBookingBody {
  car_id: number;
  branch_id: number;
  type: BookingType;
  from_day: string;              // YYYY-MM-DD, today or later
  time: string;                  // 'HH', one of E1 slots, >= 1 hour from now
  to_day?: string;               // required unless monthly
  count?: number;                // required for monthly (months); ignored otherwise
  delivery_type?: DeliveryTypeRequest; // required for daily, monthly, international
  // to_location only (all eight required):
  pickup_lat?: number;  pickup_long?: number;  pickup_region?: string;  pickup_address?: string;   // max 255 / 500
  delivery_lat?: number; delivery_long?: number; delivery_region?: string; delivery_address?: string;
  // airport
  airport_id?: number;           // same region as the branch
  delivery_to_airport?: 0 | 1;   // required for airport; 0 → send delivery_* yourself
  // station
  train_station_id?: number;
  delivery_to_station?: 0 | 1;   // backend bug: send delivery_* yourself (Bruno "known issue")
  // international, or the travel_abroad service selected
  country_id?: number;
  // add-ons, same order in both arrays (R8)
  'service_id[i]'?: number;
  'service_type[i]'?: ServiceType;
  note?: string;                 // max 500
}

type ServiceType =
  | 'car_service'
  | 'driver_service'
  | 'company_service'
  | 'child_seat_service'
  | 'airport_fast_delivery';
```

`payment_method_id` (in the Bruno sample) is ignored here; it belongs to E5.
Creating a draft **deletes the user's previous draft**.

### 3.3 Other writes

```ts
interface ApplyCouponBody { code: string }                       // E4, max 50; NOT used this version (P5)

interface PayBody {                                              // E5 and E12
  order_id: number;              // booking id (E12: the booking, not the modification request)
  payment_method_id?: number;    // from E3; required whenever an amount is left for the gateway
  use_wallet?: 0 | 1;            // R14: wallet alone, method alone, or both
  // use_points exists in the API but is never sent (R13)
}

interface CancelParams { is_quote: 0 | 1 }                       // E8, required

interface ExtensionQuoteQuery { count: number }                  // E9: days (daily, max 365) or months (monthly, max 12); `days` / `months` are prohibited

interface ExtensionBody {                                        // E10
  count: number;
  payment_method_id?: number;    // required unless use_wallet is sent (and when the wallet does not cover all)
  use_wallet?: 0 | 1;
}

interface ModificationBody {                                     // E11
  type: 'pickup_time' | 'days_count';
  pickup_time?: string;          // 'H:i', e.g. '14:00'; required for pickup_time; must differ
  count?: number;                // 1–365, the NEW total (days or months); required for days_count; must differ
  store?: 0 | 1;                 // 0 = preview (default), 1 = create. Backend bug (Q14): pickup_time + store=0 → server error, so send store=1 for pickup_time
  payment_method_id?: number;
}

interface RateBody {                                             // E13
  company_rate: number;          // 1–5
  driver_rate?: number;          // 1–5, only when the booking has_driver (else 422); meaning of has_driver: Q6
}
```

Payment combinations for E5 / E10 / E12 (Bruno, partially probed; points are
not used, R13): the wallet pays first when `use_wallet=1`, the gateway method
pays what is left. Everything covered by the wallet → paid at once (`data: null`
for E5/E12, the updated booking for E10). Something left and no
`payment_method_id` → 422.

The add-on pairs are the only way the customer adds a driver or any other
service (Q6 answer): `service_id[i]` + `service_type[i]` from the car-details
services of the same context.

## 4. Observed response DTOs

Envelope (shared, `services/http/envelope.ts`): `{ data, message, code }`;
lists add `pagination` (`ApiPagination`).

### 4.1 Statuses and enums

```ts
type OrderStatus =
  | 'start'      // Bruno's draft status; never seen by the client (Q1: a draft comes back as 'coming')
  | 'new'        // paid, waiting for the company
  | 'accepted'
  | 'rejected'
  | 'open'
  | 'coming'     // pickup coming up
  | 'current'    // car with the customer
  | 'late'       // past the return time (late_hours set)
  | 'complete'
  | 'cancelled'
  | 'suspended';

/** E6 `status=past` = complete | cancelled | rejected; `current` = everything else except start. */

/** Values seen in responses. `from_location` is NOT a request value (Q5b). */
type DeliveryTypeResponse = DeliveryTypeRequest | 'from_location';
```

Observed on TEST: a daily `to_location` booking and an airport booking both
come back with `delivery_type: "from_location"`; international and daily
branch bookings with `from_branch`. Map `from_location` to the same UI as
`to_location` (delivered to an address); confirming that reading is Q5b (O3).

### 4.2 E6 `GET /booking` → `ApiPage<OrderListItemDto>`

```ts
interface OrderListItemDto {
  id: number;
  car_image: string | null;   // absolute URL
  car_name: string;           // brand + model, e.g. "Toyota Avalon"
  car_year: number;
  date: string;               // 'YYYY-MM-DD HH:mm', pickup
  status: OrderStatus;
  late_hours: number | null;
  company_name: string;
  company_rate: number;       // company average, e.g. 3.8
  company_logo: string | null;
  is_rated: boolean;
  my_rating: { company_rate: number | null; driver_rate: number | null };
}
```

Message `Fetched successfully.`; an empty page has `from: null`, `to: null`.
Invalid `status` → 422 "The selected status is invalid."; `per_page=0` → 422.

### 4.3 E7 `GET /booking/{id}` and E2 → `OrderDto` (UserOrderResource)

```ts
interface LookupDto { id: number; title: string; logo: string | null }

interface OrderCarDto {
  id: number;
  image_url: string | null;
  year: number;
  company_name: string;
  company_logo: string | null;
  lower_price: number;
  max_price: number;
  rate: number;
  note: string | null;
  brand: LookupDto;
  type: LookupDto;
  has_offer: boolean;
  offer: unknown | null;      // same CarOfferDto as car-details §3.1 when present
}

interface OrderBranchDto {
  id: number;
  title: string;
  distance_km: number | null;
  latitude: string;           // numeric string
  longitude: string;
  place_id: string;
  region: string;
  address: string;
  logo: string | null;
}

interface OrderDto {
  id: number;
  order_number: string;       // e.g. "ORD-6984BC6E": show this as the booking reference
  user_id: number;
  car: OrderCarDto;
  status: OrderStatus;
  late_hours: number | null;
  booking_type: BookingType;
  delivery_type: DeliveryTypeResponse;
  pickup_day: string;         // YYYY-MM-DD
  delivery_day: string;       // YYYY-MM-DD (return day)
  pickup_time: string;        // 'HH:mm:ss'
  delivery_time: string;      // 'HH:mm:ss'
  pickup_location:   { pickup_lat: string | null;   pickup_long: string | null;   address: string | null };
  delivery_location: { delivery_lat: string | null; delivery_long: string | null; address: string | null };
  branch: OrderBranchDto;
  note: string | null;
  // prices (numbers, SAR)
  car_price: number;
  price: number;
  count: number;              // nights (2026-11-10 → 2026-11-12 = 2, confirmed Q2), or months
  delivery_fee: number;
  service_fee: number;
  completion_fee: number;
  discount: number;
  coupon_code: string | null; // not mapped (no coupon this version, R13)
  coupon_discount: number;    // not mapped
  additional_services_cost: number;
  total_price: number;
  tax_value: number;
  final_price: number;        // the amount to pay
  cancellation_fee: number;
  refund_amount: number;
  tax_rate: number;
  tax_rate_type: 'percent' | string;
  service_fee_rate: number;
  service_fee_rate_type: 'percent' | string;
  // flags
  pay_extension: boolean;
  pending_extension_id: number | null;
  has_modify_request: boolean;
  has_driver?: boolean;       // present on E7, ABSENT on the E2 response
  is_rated: boolean;
  my_rating: { company_rate: number | null; driver_rate: number | null };
  created_at: string | null;  // 'YYYY-MM-DD HH:mm:ss'; null on a draft (Q1b)
  terms: string;              // HTML (R9)
}
```

**Price details** (Q3 answer: the app design, 2026-11-08). The rows, in this
order, each read one API field; the UI computes nothing (R6):

| Row (ar) | Row (en) | Value | API field |
| -------- | -------- | ----- | --------- |
| السعر | Price | `count × car_price` as a hint (e.g. "5 X 500"), amount | `count`, `car_price`; amount `price` |
| رسوم التوصيل | Delivery fee | amount | `delivery_fee` |
| رسوم الخدمة | Service fee | amount | `service_fee` |
| رسوم تم | Tamm fee | amount | `completion_fee` |
| الخصم | Discount | amount | `discount` |
| الإجمالي قبل الضريبة | Total before tax | amount | `total_price` |
| الضريبة | Tax, with `tax_rate`% beside it | amount | `tax_value` (`tax_rate`, `tax_rate_type`) |
| الإجمالي | Total (highlighted) | amount | `final_price` |

The design's sample numbers are placeholders (its rows do not add up), so do
not derive a formula from them. Observed on draft 226 (car 1, 2 nights, one
driver service): `price 90 + service_fee 9 + completion_fee 3 +
additional_services_cost 10 + delivery_fee 0 = total_price 112`; `tax_value
11.2` (10%); `final_price 123.2`; `discount 110` is **not** subtracted from
`total_price`; `car_price` 45 while the car's `lower_price` is 90. The
user confirmed these values are shown as returned (Q3b, §8.1).

Extra row: "Additional services" = `additional_services_cost`, the total of the
selected add-ons (P10, answered), shown when > 0. Fields with no row: `coupon_*` (R13),
`cancellation_fee` / `refund_amount` (shown only on a cancelled booking, O7),
the `service_fee_rate*` pair (not in the design).

Location fields are `null` for `from_branch`; show the branch address then.

Messages: E7 `Fetched successfully.`, E2 `Booking costs calculated successfully.`

Pure rules for `orders/model.ts` (from the Bruno docs; the backend stays authoritative, R12):

```ts
const pickupAt = (o) => new Date(`${o.pickup_day}T${o.pickup_time}`);
canCancel  = ['new','accepted','coming'].includes(status) && pickupAt > now;
canExtend  = ['current','late'].includes(status)
          || (['accepted','open'].includes(status) && deliveryType === 'from_branch' && pickupAt <= now);
           // and no unpaid extension: !payExtension && pendingExtensionId === null (Q10)
canModify  = !['start','current','late','complete','cancelled'].includes(status)
          && pickupAt > now && !hasModifyRequest;
canRate    = status === 'complete';      // is_rated → the dialog edits the existing rating
// An unpaid draft is also 'coming' (Q1). Until Q1b is answered, treat
// created_at === null as a draft: it offers no action and shows no countdown.
isDraft    = createdAt === null;
```

### 4.4 E1 → `AvailabilityDto`

```ts
interface AvailabilityDto { slots: { time: string }[] }   // time: 'HH'
```

### 4.5 E3 → `PaymentOptionsDto`

```ts
interface PaymentMethodDto {
  id: number;
  title: string;          // e.g. "Tamara", "Tabby", "Apple Pay", "Online Payment"
  type: string;           // observed: 'tamara' | 'tabby' | 'apple_pay' | 'online'
  icon: string;           // a Bootstrap Icons class name ("bi-globe"), not a URL (Q8)
}

interface PaymentOptionsDto {
  payment_methods: PaymentMethodDto[];   // active methods of the booking's company
  wallet_balance: number;
  points: number;                        // not mapped (R13)
  points_value: number;                  // not mapped (R13)
}
```

`type` is missing from the Bruno example. Map `type` to local icons in
`shared/config/assets.ts`; an unknown `type` gets a neutral card icon (do not
reject it).

### 4.6 E5 / E10 / E12 gateway → `PaymentStartDto`

```ts
interface PaymentStartDto {
  payment_url: string;   // observed: https://t-car.app/order/pay/{id}?amount=123.2&locale=en (locale follows Accept-Language)
  success_url: string;   // https://t-car.app/order/success/{id}
  fail_url: string;      // https://t-car.app/order/fail/{id}
}
```

Message `Proceed to payment now.` (ar: `انتقل إلى الدفع الآن.`). The order stays
unpaid until the gateway finishes; probed draft 226 kept its status after the
gateway response. A fully covered E5 / E12 returns `data: null` with
`user.payment_successful` text (Bruno); E10 returns the updated booking.

### 4.7 E9 `GET /booking/{id}/extension-quote` → `ExtensionQuoteDto`

```ts
interface ExtensionQuoteDto {
  count: number;
  car_price: number;
  price: number;
  additional_services_cost: number;   // not in Bruno
  offer_discount: number;             // not in Bruno
  new_delivery_day: string;           // YYYY-MM-DD
  late_fee: number;
  late_days: number;
  tax_type: 'percent' | string;
  tax_value: number;                  // the rate (10)
  tax_added_value: number;            // the tax amount
  total_amount: number;               // to pay
}
```

Observed: booking 153 (`late`, 5 days), `count=2`: price 200, late_fee 500
(5 × 100), tax 20, total 740. Bruno describes `late_fee` as one day's rent;
live it is per late day (Q12). `count` is the number of **extra** days, not the
new total (the app sends the new total today; §6).

### 4.8 Bruno-only success bodies (verify when a TEST booking allows it)

```ts
interface CancelQuoteDto {            // E8 is_quote=1
  payed_amount: number;
  can_cancel_fee_amount: number;
  cancel_fee_percentage: number;
  total: number;                      // refunded to the wallet
}
// E8 is_quote=0 → OrderDto with status 'cancelled', cancellation_fee, refund_amount

interface ModificationQuoteDto {      // E11
  modification_request_id: number | null;   // null when store=0
  count: number;
  car_price: number;
  price: number;
  final_price: number;
  new_final_price: number;
  difference_amount: number;          // > 0 the user pays, < 0 refund to wallet
}

interface RateResultDto {             // E13
  company_rate: number;
  driver_rate: number | null;
  has_driver: boolean;
}
```

Modification request statuses (Bruno): `pending_provider`,
`provider_rejected`, `pending_admin`, `admin_rejected`, `pending_payment`,
`applied`. No endpoint returns them to the user today (Q7).

### 4.9 E14 `GET /privacy-policy`

```ts
type PrivacyPolicyDto = { id: number; type: 'user' | string; title: string; content: string /* HTML */; created_at: string }[];
```

## 5. Observed error behavior

All rows: HTTP 200 with the body `code`, `data: null`, English
`Accept-Language` (Arabic messages are localized too), except 401.

| Endpoint | Case | `code` | Message |
| -------- | ---- | ------ | ------- |
| any | no token | 401 (HTTP 401) | Unauthorized. Please log in. |
| E7, E3 | unknown id, or non-numeric id | 404 | The requested resource was not found. |
| E3, E4, E5, E7, E8, E9, E11 | another user's booking | 422 | You are not allowed to perform this action. |
| E6 | `status=foo` | 422 | The selected status is invalid. |
| E6 | `per_page=0` | 422 | The items per page field must be at least 1. |
| E1 | nothing sent | 422 | The car ID field is required. |
| E1 | monthly without `count` | 422 | The count field is required when type is monthly. |
| E1 | past `from_day` | 422 | The start date field must be a date after or equal to today. |
| E1 | `to_day == from_day` | 422 | The end date field must be a date after start date. |
| E1 | invalid `type` | 422 | The selected booking type is invalid. It must be daily, monthly, airport, station, or international. |
| E1 | `delivery_type=from_location` | 422 | The selected delivery type is invalid. It must be to_location, from_branch, from_airport, or from_station. |
| E1, E2 | branch without stock/hours, or `time` not a free slot | 422 | The car is not available for the selected days. |
| E2 | daily without `delivery_type` | 422 | The delivery type field is required when type is daily. |
| E2 | `time=10:00` | 422 | The time must match the format H (24-hour, e.g. 09). |
| E2 | `to_location` without coordinates | 422 | The pickup latitude field is required when delivery type is delivery to location. |
| E2 | unknown `(id, type)` service pair | 422 | One of the selected services is not available for this car or branch. |
| E2 | `travel_abroad` service or international without `country_id` | 422 | The country is required for international bookings or when the travel-abroad permit is selected. |
| E2 | airport without `delivery_to_airport` | 422 | The delivery to airport field is required when type is airport. |
| E4 | no code | 422 | Enter the coupon code. |
| E4 | unknown code | 422 | This coupon code is not valid. |
| E4 | paid booking | 422 | A coupon can only be applied before the booking is paid. |
| E5 | nothing sent | 422 | The order field is required. |
| E5 | paid booking | 422 | This order has already been paid. |
| E5 | `use_points=1`, no balance, no method | 422 | The payment method is required. |
| E5 | method of another company / unknown | 422 | The selected payment method is not available for this company. |
| E8 | `is_quote` missing | 422 | The quote field is required. |
| E8 | after pickup (`late`) | 422 | This booking cannot be cancelled after the pickup time. |
| E8 | draft | 422 | This booking cannot be cancelled. |
| E9, E10 | `count` missing | 422 | The count field is required. |
| E9 | `days` sent | 422 | The days field is prohibited. |
| E9 | `count=400` | 422 | The count field must not be greater than 365. |
| E9, E10 | draft / before pickup | 422 | This booking cannot be extended before pickup or after completion. |
| E10 | no method and no wallet/points flag | 422 | The payment method field is required when none of use wallet / online are present. |
| E11 | no `type` | 422 | The type field is required. |
| E11 | after pickup (`late`), and also a draft | 422 | Booking modification is only allowed before car pickup. |
| E12 | no `pending_payment` request | 404 | The requested resource was not found. |
| E13 | not `complete` | 422 | You can rate a booking only after it is completed. |
| E13 | `company_rate=9` | 422 | The rating must be between 1 and 5. |

Frontend handling: reads throw `AppError` (404 → `not_found`, 422 →
`validation` with `serverMessage`); writes return `Result`; dialogs toast the
`serverMessage` (R5) and stay open.

## 6. The app today versus the API

| Area | App today (file) | API | Change |
| ---- | ---------------- | --- | ------ |
| Data access | `services/bookings.api.ts` → mock; `booking/actions.ts`, `my-bookings/{actions,queries}.ts` | §2 | Move to `features/orders` (R1). |
| Rental context at checkout | `CarBookingCard` gets car identity and prices only (`car-details/components/CarDetailsView.tsx`) | E1/E2 need `branch_id`, `type`, `delivery_type`, airport/station/country ids, location | Pass a `BookingContext` from the car-details page (parsed URL query + `car.pickupInfo.nearestBranch`) to `CarBookingCard`. |
| Branch | none at checkout | `branch_id` required | Use the nearest branch from the detail read; the all-branches dialog may change it. None → block "Book now" and ask for a location (R16). |
| Time slots | fixed `TIME_SLOTS` "8:00 AM"… (`shared/lib/booking-validation.ts`) | E1 `slots[].time` `HH`, depend on dates | Load slots after the range is picked; `time` becomes `HH`; drop `TIME_SLOTS`. |
| Days | client `days` = nights; same day invalid | `count` = nights (Q2, confirmed) | Keep nights; the API `count` is shown after E2. |
| Prices | client 15% VAT, fake struck price | E2 `OrderDto` prices | R6. Confirm modal renders the price-details rows of §4.3 from the draft. |
| Add-ons | `AddonsGrid` local selection, `AddonService` without `type`, keyed by `id` | `(id, type)` pairs | Add `type` to `AddonService`, key by `${type}:${id}`, lift the selection to the booking card. |
| Notes, addresses | `notes` (max 500), addresses max 200 | `note` max 500; address max 500; region max 255 required | `pickup_region` / `delivery_region` from `LocationData.region`; reject a pick without region. |
| Terms | hard-coded `booking.confirm.terms.*` list | `terms` HTML on the order; `/privacy-policy` | Render `order.terms` (R9); keep the checkbox. Privacy policy: Q16 (O5). |
| Payment methods | fixed `wallet`, `visa`, `tabby`, `tamara` radio, hard-coded balance 500 and 100 points | E3 dynamic list + `wallet_balance` | Methods from E3; the wallet is a toggle that combines with one method or stands alone (R14); remove the points switch (R13). |
| Coupon | none | E4 | None this version (P5, R13). |
| Pay result | `createBooking` → success dialog → `/account/bookings` | E5 gateway or immediate success | R10; success → `/account/bookings` (P6). |
| Statuses | `current`, `upcoming`, `late`, `completed`, `cancelled` + mock `statusLabel` | 11 statuses (§4.1) | R11; labels from `messages/*.json` (`myBookings.status.*`). |
| List | all bookings, split client-side by `splitBookings` | E6 `status=current` or `past`, paginated | Server read per tab (`?status=`), `InfiniteList` for more pages. The app does not show active/past count badges. |
| List item | `carBrand`, `carName`, `rating`, `statusLabel`, `dateLabel` | §4.2 | `car_name` already contains the brand; `rating` = `company_rate`; format `date` with the locale. |
| Details reference | `reference` "2383" | `order_number` | Map. |
| Details prices | `pricePerDay`, `vatRate`, `pointsUsed`, `cancellationPercent`, `warrantyNote` | §4.3 | Replace with API fields; remove `pointsUsed` and `warrantyNote` and their UI (P8). |
| Cancel | fee from `cancellationPercent` | E8 quote then cancel | Open the dialog → quote; confirm → `is_quote=0`. |
| Extend | new **total** days, client 5% VAT | E9/E10 `count` = **extra** days or months, then payment | Quote, then pay (payment step reused). |
| Edit request | `EditDailyBookingModal` edits dates, time, addresses | E11 only `pickup_time` **or** `days_count` | New edit dialog: pickup time or number of days (P4). |
| Pay modification difference | none | E12 | Needs the request status (Q7). |
| Review | both `showroomRating` and `driverRating` required | `company_rate`, `driver_rate` only if `has_driver` | Show the driver stars only when `hasDriver` (meaning: Q6b); prefill `my_rating`. |
| Monthly / airport / station / international | `components/modals/BookingMonthlyModal.tsx` (legacy); no airport, station, or international modal | E2 variants | All supported, each with its own modal (P1): O9a–O9d. |

## 7. Plan and fractions

Each fraction is one commit, verified as `AGENTS.md` says (`npx tsc --noEmit
-p .`, `npx next lint`, `npm run test`, `npx next build`, `next start -p 3123`
and `curl` the pages), with `docs/README.md` updated in the same commit.
Writes against TEST are allowed only as in §9 (drafts, gateway links,
expected 422s); never pay with the wallet, cancel, extend, or rate a real
booking without the user's approval.

| # | Fraction | Main files | Done when | Open items it settles | Status |
| - | -------- | ---------- | --------- | --------------------- | ------ |
| O0 | Contract and probes | this file | Endpoints, DTOs, errors, gaps, and questions recorded; user answers of 2026-11-08 applied | | Done (2026-11-08) |
| O1 | `features/orders` boundary, no behavior change | new `features/orders/{api.ts,api.mock.ts,model.ts,queries.ts,actions.ts,validation.ts,index.ts}`; move `services/bookings.api.ts`, `services/mocks/bookings.ts`, `booking/actions.ts`, `my-bookings/{actions,queries}.ts`; data types (`UserBooking`, `BookingDetailsView`, `BookingEditRequest`, `BookingReviewInput`, `CreateBookingRequest`) move to `orders/model.ts` | `api.ts` still binds the mock; pages import `@/features/orders/queries`; components import actions from `@/features/orders`; lint boundaries pass; tests moved with the code; same HTML on `/account/bookings`, `/account/bookings/1`, a car page | | Done (9ec5a95, 2026-11-08) |
| O2 | Bookings list from E6 | `orders/api.ts` (DTO, guard, mapper, `listOrders({status,page,perPage})`), `orders/model.ts` (`OrderStatus`, `OrderListItem`, status groups), `my-bookings` list components, `messages/*.json` | `/account/bookings` and `?status=past` read E6 on the server; cards show car, year, company logo and rate, localized date, status badge for all 11 statuses, late hours; next pages via `InfiniteList` (route handler or action); empty state per tab; mock and `api.test.ts` updated | | Done (53c7a80, 2026-11-08) |
| O3 | Booking details from E7 | `orders/api.ts` (`OrderDto` guard/mapper, `getOrder`), `orders/queries.ts`, `my-bookings` details components; move the car-details HTML sanitizer + `HtmlContent` to `shared` (`shared/lib/sanitizeHtml.ts`, `shared/ui/HtmlContent`) and reuse it | Reference = `order_number`; the §4.3 price-details rows; branch or delivery addresses; pickup and return date-time; terms HTML; buttons follow the §4.3 rules; unknown id **and** another user's id give `NEXT_NOT_FOUND`; `late` shows late hours; `pointsUsed`, `warrantyNote` and their UI removed (P8) | Q1b, Q4b (keep R4 until the backend changes), Q5b | Done (3341a48, 2026-11-08; follow-up 303b98a 2026-11-09: no drafts, 422 → not found, any response delivery type). Q1b and Q5b closed; Q4b waits on the backend. Production build and page smoke not run for this commit (the user's dev server was running): run them at the start of O4 |
| O4 | Daily checkout step 1: context and availability | `car-details` page → `CarDetailsView` → `CarBookingCard` (`BookingContext`), `booking/components/BookingDailyModal.tsx`, `orders/actions.ts` (`checkAvailabilityAction`), `shared/lib/booking-validation.ts` | The dates dialog loads slots from E1 for the picked range and branch; `time` is `HH`; no slot or 422 (including "not available" for `to_location`, Q5) shows the backend message and keeps the dialog open; with no location or no nearest branch "Book now" is disabled and the card asks for a location (R16) | | Done (2026-11-09; verified with typecheck, lint, and 33 focused tests) |
| O5 | Checkout step 2: draft and confirmation | `car-details` `AddonService.type` + `AddonsGrid` lifted selection, `orders` (`createDraftAction`), `BookingConfirmModal.tsx`, `booking/model.ts`; license gate: `account` (`getLicenseStatus`, `LazyLicenseUploadDialog`), `CarBookingCard.tsx` | Confirm shows the price-details rows of §4.3 from the draft, the selected add-ons, terms HTML; `to_location` sends both points with region; travel-abroad add-on requires the selected country; R6 formulas removed; "/ month" label for monthly (R18); no license → upload dialog before the dates step (R17) | Q3b, P10, Q16, P11 | Done (2026-11-10: Q3b, P10, Q16 answered by the user; R17 and R18 added) |
| O6 | Checkout step 3: payment and pay | `orders` (`getPaymentOptionsAction`, `payAction`), `PaymentMethodModal.tsx`, shared `usePaymentWindow` hook extracted from `features/wallet` | Methods and wallet balance from E3; points switch removed; wallet alone, method alone, or wallet + method (R14); E5 gateway opens the payment tab (R10) or a wallet-covered payment succeeds at once; result → `/account/bookings` (P6); wallet top-up still works with the shared hook. No coupon (P5) | P7, Q8 | Done (2026-11-10): `getPaymentOptionsAction` (E3) and `payOrderAction` (E5, `Result` with the backend message); the wallet is a selectable card (no switch, user 2026-11-10) that can always be chosen together with one method; the wallet alone needs `wallet_balance >= final_price`; clicking the chosen method again clears it; when the wallet covers the total, the method is not sent (R14); methods are icon-mapped by `type` (tabby, tamara, anything else the card icon); the gateway tab uses the shared `usePaymentWindow` (`shared/hooks`, moved from `features/wallet`; `shared/lib/paymentWindow.ts` holds `paymentOutcome` and `isHttpsUrl`); choosing an empty wallet, or confirming the wallet alone with a balance below `final_price`, opens the insufficient-balance dialog (the legacy `InsufficientBalanceModal`, moved to `features/booking`, with `public/icons/low-balance.svg`): "Top up now" → `/account/wallet`, closing it keeps the choice so a method can be added (an empty wallet stays unselected); success → success dialog → `/account/bookings`; a failed gateway → "payment not completed", then the sheet again; a closed tab → the sheet again; `createBooking` and the old `PaymentMethod` union removed. Not exercised live: a real gateway or wallet payment (needs the user's approval, §7) |
| O7 | Cancel | `orders` (`cancelQuoteAction`, `cancelAction`), `CancelBookingModal.tsx`, `my-bookings` hooks | Dialog shows the E8 quote (paid, fee, percentage, refund); confirm cancels and refreshes; 422 shown in the dialog; the quote body is checked against §4.8 on a real cancellable booking (with the user's approval) | | Not started |
| O8 | Extend | `orders` (`extensionQuoteAction`, `extendAction`), `ExtendDurationModal.tsx` (+ payment step from O6) | Counter is extra days (or months for monthly); quote from E9 incl. late fee; pay via E10 with R14 (gateway or wallet); pending extension hides the button | Q10, Q12, Q13 | Not started |
| O9a | Monthly booking modal | `features/booking/components/BookingMonthlyModal.tsx`, `orders` actions | Monthly context now selects the feature-owned modal and E1 sends `type=monthly` with `count`; E2 draft creation and payment still follow O5/O6 | P9 | In progress (modal move and live E1 wiring, 2026-11-09) |
| O9b | Airport booking modal | new modal in `features/booking` | E2 with `airport_id` and `delivery_to_airport` (return at the airport or at an address); confirm and pay reuse O5/O6 | P9 | Not started |
| O9c | Station booking modal | new modal in `features/booking` | E2 with `train_station_id`, `delivery_to_station`, and `delivery_*` always sent (backend bug, Q14) | P9, Q14 | Not started |
| O9d | International booking modal | new modal in `features/booking` | E2 with `type=international`, `delivery_type`, `country_id`; travel-abroad add-on hidden (the backend rejects it with international) | P9 | Not started |
| O10 | Modification request | `orders` (`modificationPreviewAction`, `modificationRequestAction`, `payModificationAction`), new edit dialog replacing `EditDailyBookingModal` (P4) | The dialog offers "pickup time" or "number of days"; `days_count` preview then store; `pickup_time` store only; difference payment (E12, R14) once the backend exposes the request status | Q7, Q14, Q15 | Not started; difference payment blocked on Q7 |
| O11 | Rate | `orders` (`rateAction`), `BookingReviewModal.tsx`, `my-bookings/validation.ts` | Only on `complete`; driver stars only when `has_driver`; prefilled from `my_rating`; re-rating updates | Q6b | Not started |
| O12 | Clean-up and live smoke | delete `services/bookings.api.ts`, `services/mocks/bookings.ts` if still present, `TIME_SLOTS`, `cancellationFee`, `toEditRequest`; the dev-only `logDetailData` in `features/orders/api.ts` and `features/car-details/api.ts` (kept until the whole booking feature ends, user decision 2026-11-09); `docs/README.md`; this file §9 | No production import of a booking mock; ar/en smoke of list, details, checkout up to the gateway link for each booking type, and every 422 path in §5 reachable from the UI | | Not started |

Progress (2026-11-10): O0–O6 done on `feature/booking-api` (local commits, not
pushed); O9a in progress; next is O7. O3 also shipped UI the user asked for during review: actions in the
shared `Menu` with a round horizontal-dots trigger, `BackButton` to the list, the
late countdown (time overdue since the return time, with the late-fee hint;
shown for `late` only), the payment-safety and direct-extension notices
(`coming` and `current`, new `public/icons/info.svg`), and the order time
(Riyadh time). Booking times are read as Riyadh time (UTC+3, `bookingInstant`).

Each read fraction (O2, O3) adds `api.test.ts` cases for: valid DTO, missing
field → `server` error, unknown status → `server` error, 404 → `not_found`.
Each write fraction adds action tests for `ok`, a 422 with `serverMessage`, and
`unauthorized`.

When a fraction settles an open item, move it from §8.2 / §8.3 to §8.1 in the
same commit, with the date and the source (backend reply, user, or probe).

## 8. Decisions and open questions

### 8.1 Answered (2026-11-08, by the user)

| # | Question | Answer | Effect on the plan |
| - | -------- | ------ | ------------------ |
| Q1 | Draft status | `coming` is the status of a new booking (draft). | `OrderStatus` keeps `start` only for completeness; a draft is handled as `coming` (§4.3, `isDraft`). |
| Q2 | Day count | 2026-11-10 → 2026-11-12 is `count: 2`; this is the contract. | `count` = nights; the same day is invalid (E1). Keep the client's nights count. |
| Q3 | Visible price breakdown | The app design: price (`count × car_price`), delivery fee, service fee, Tamm fee, discount, total before tax, tax with its rate, total. | Price-details table in §4.3, read field by field. |
| Q4 | Which endpoints return 422 for another user's booking | E3, E4, E5, E7, E8, E9, E11 confirmed live. E10 and E13 run input validation before the ownership check, and E12 answers 404 when there is no pending request, so their ownership answer was not reached with safe inputs (§9 item 10). | Send the list with the request in Q4b; R4 stays until then. |
| Q5 | `to_location` availability | A `to_location` booking needs the car to be available for `to_location` (the branch's delivery hours). | E1's "not available" for `to_location` is expected; O4 shows it. |
| Q6 | How a driver or other service is booked | The app sends the service type and service id. | R8 pairs; no separate driver flag in requests. |
| Q9 | Order payment pages and `window.opener` | Yes, like the wallet. | R10 uses the wallet pattern. |
| Q11 | Per-field `errors` map | Yes, it is planned. | R3: keep the message toast until it ships. |
| P1 | Booking types | All are supported; each has its own booking modal. | R15; fractions O9a–O9d. |
| P2 | No location / no nearest branch | Block "Book now" and ask for a location. | R16; O4. |
| P3 | Payment combination | No points. The wallet plus any other method, or each one alone. | R13, R14; O6, O8, O10. |
| P4 | Edit request | Replace the edit dialog with pickup time or number of days. | O10. |
| P5 | Coupon | Not in this version. | R13; E4 out of scope. |
| P6 | After a successful payment | The bookings list. | O6 → `/account/bookings`. |
| P7 | Gateway window (2026-11-10) | New tab, the wallet pattern. | O6: `usePaymentWindow`; a blocked pop-up falls back to a same-tab redirect. |
| P8 | Fields the API lacks | No points in the app; remove the warranty for now. | O3 removes `pointsUsed` and `warrantyNote` and their UI. |
| Q1b | Telling a draft from a paid `coming` booking (2026-11-09) | There is no draft in the app; the backend will add `created_at`. | `isDraft` removed; status and the `canX` rules decide. If `created_at` is later set on drafts too, recheck a draft's E7. |
| Q3b | `car_price` and `discount` (2026-11-10) | The draft prices are correct as returned. The car-details price is the per-month price when the type is monthly. | Show the API fields as they are (R6); R18 labels the price per month. |
| Q5b | `delivery_type: "from_location"` in responses (2026-11-09) | Ignore it. | Removed from `OrderDeliveryType`; the response guard accepts any string, and the app only tests `from_branch` vs anything else. |
| Q16 | `/privacy-policy` at checkout (2026-11-10) | `order.terms` is enough. | E14 is not used by the checkout. |
| P10 | Add-ons in the price details (2026-11-10) | The additional services price is the total of the selected add-ons. | The confirmation keeps an "Additional services" row reading `additional_services_cost` (shown when > 0). |
| P11 | Driving license (2026-11-10) | A customer without a license cannot book; open the license dialog to add one. | R17. |

### 8.2 Open: backend (answer or investigate in the named fraction)

| # | Question | Observed | Fraction |
| - | -------- | -------- | -------- |
| Q4b | Return 403 (or 404) instead of `code: 422` for another user's booking on E3, E4, E5, E7, E8, E9, E10, E11, E12, E13, so it is distinct from validation. | Still open after O3: E7 for another user's booking (1) still returns body `code: 422`; R4 remains in force. **User, 2026-11-09: E7 now returns 404; app rule: body 404 and body 422 both show not found (R4).** Live probe the same day (booking 1, another user's) still answered body `code: 422`; unknown id 99999 answers `code: 404`. The app maps both to `notFound()`, so no code change either way; recheck the other endpoints when they switch. | O3 |
| Q6b | `has_driver` was `false` on a draft with a `driver_service` add-on, and it is missing from the `create-booking` response. What does it mean (a delivery driver?), and when may `driver_rate` be sent? | Draft 226 | O11 |
| Q7 | The user cannot see a modification request's status, id, or difference (only `has_modify_request`). Add them to `GET /booking/{id}` so the app can offer "pay the difference". | E7 | O10 |
| Q8 | `payment_methods[].icon` is a Bootstrap Icons class. Provide an image URL, or confirm the full `type` list for local icons. | E3. O6 maps `tabby` and `tamara` to local icons and every other type (`online`, `apple_pay`, unknown) to the card icon, so a new type never breaks the sheet. | O6 (app side done) |
| Q10 | What do `pay_extension` and `pending_extension_id` mean exactly (unpaid extension waiting for the gateway)? | E7 | O8 |
| Q12 | `late_fee` was 500 for 5 late days at 100/day; Bruno says one day's rent. Which is right? | E9 on 153 | O8 |
| Q13 | `extension-quote` also returns `additional_services_cost` and `offer_discount`; confirm they are part of the contract. | E9 | O8 |
| Q14 | Bruno "known issues": station return location and `'delivery _lat'` typo; `pickup_time` + `store=0` server error; `rebook` binding. Status? | Bruno | O9c, O10 |
| Q15 | A modification on a draft says "only allowed before car pickup" although pickup is in the future. Use a draft-specific message? | E11 on 226 | O10 |

### 8.3 Open: product (ask the user in the named fraction)

| # | Question | Fraction |
| - | -------- | -------- |
| P7 | Gateway: new tab with `window.opener` (wallet pattern) or same-tab redirect? Q9 makes the wallet pattern possible; use it unless the user says otherwise. | O6 |
| P9 | Designs for the monthly, airport, station, and international booking modals: where are they, and does monthly keep the current `BookingMonthlyModal` UI? Airport also needs a "return at the same airport" choice (`delivery_to_airport`). | O9a–O9d |

## 9. Probe record (2026-11-08)

Account: the TEST customer the user supplied (id omitted). Its bookings: 153,
151, 150, 140, all `late` (airport, international, daily to-location,
international). No `complete`, `new`, `accepted`, or `coming` booking exists,
so the success bodies of cancel, modification, rate, and the wallet/points
pay paths were not observed (§4.8).

1. E6 with no status, `current`, `past` (empty), invalid status, `per_page=0`.
2. E7 for each booking; unknown id; another user's id (1); non-numeric id; no token.
3. E3 on 153, on another user's booking, on an unknown id; E14.
4. E9 on 153 and 150 (success), without `count`, with `days`, `count=400`, on another user's booking.
5. E8 `is_quote=1` on 153 (after pickup), without `is_quote`, on another user's booking.
6. E11 `store=0` on 153, without `type`; E13 on 153 (not complete), with `company_rate=9`;
   E4 on 153 (paid) and without code; E5 on 153 (paid) and without fields; E12 on 153 (404).
7. Car 1 detail with `daily` / `from_branch` and the Monufia location gave branch 3 and the
   services in R8. E1 for car 1, branch 3: daily `from_branch` (08–21), `to_location`
   (not available), monthly with `count`, monthly without `count`, past date, same day,
   no fields, wrong branch, invalid `type`, `delivery_type=from_location`, today (from 14).
8. E2 validation: empty body, no `delivery_type`, unavailable `time`, `time=10:00`,
   `to_location` without coordinates, unknown service pair, travel-abroad without country,
   airport without `delivery_to_airport`, international without country.
9. **Writes on TEST**: one draft was created, booking **226** (car 1, branch 3, daily
   `from_branch`, 2026-11-10 → 2026-11-12, 10:00, `driver_service` id 3, note "probe
   draft - frontend contract check"). On it: E3, E4 with an unknown code, E8 quote,
   E9, E10, E11 (pickup time and days count), E13 (all 422), E5 with `use_points=1`,
   an unknown method, then `payment_method_id=6` (gateway links in en and ar; nothing
   was paid). The draft is unpaid and hidden from E6; the next `create-booking` by this
   customer deletes it.
10. Ownership (Q4), against another user's booking 1 with inputs that cannot change it:
   E4 (unknown code), E8 (`is_quote=1`), E11 (`store=0`) → 422 "not allowed"; E10 without a
   method and E13 with `company_rate=9` → their input 422 (validation runs first); E12
   without a method → 404.
