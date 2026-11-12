# Cities API feature

Last updated: 2026-11-03
Base URL: `https://t-car.app/api/user` (TEST; live calls verified).
Status: contract inspected (C0); C1 moved the data access to
`features/cities/api.ts` + `api.mock.ts`, still on the mock. City cars are
still mock cars grouped by mock offices. Product answers to Q1–Q6 recorded
2026-11-03 (§6).

Sources: Bruno `tcar/User Application/website api/{cities,city-cars,city-company-cars} (for website ).yml`
and `tcar/User Application/Home/{carBrands,carTypes,carAdditionalServices,companies}.yml`,
the folders' inherited bearer auth, existing cities/cars code, and live requests
on 2026-11-02 and 2026-11-03 in `ar` and `en`, without a token.

> `docs/api/` is ignored by Git, like [Auth-API.md](Auth-API.md). This file
> stays local. All probes were reads; no TEST data was written.

## 1. Rules the integration follows

| #  | Rule |
| -- | ---- |
| R1 | **Transport.** Reuse the envelope-aware client. Observed successes: HTTP 200 / body `code` 200. Observed validation errors: HTTP 200 / body `code` 422, `data: null`. The client already turns a body `code` 422 into a `validation` `AppError`. |
| R2 | **Public reads.** Every endpoint here answers without a token (Bruno inherits the folders' bearer auth, but it is not required). Use server-only `publicServerHttp`, like `/faqs`; never send the customer token. |
| R3 | **Feature ownership.** The cities feature owns `/cities` (`features/cities/api.ts`: list, guards, mapping; `api.mock.ts` for tests). The cars feature owns the car lists, `/city-cars` and `/city-company-cars` plus the four filter lookups (`features/cars/api.ts`: DTOs, guards, mappers, and requests). The city page combines them: `getCity(id)` gives the `region`, the cars query takes it. `index.ts` files stay client-safe. (Changed 2026-11-03 from "cities owns all three".) |
| R4 | **City key = id.** The API has no slug, and none is needed. City pages route by the city `id` (`/cities/1`). |
| R5 | **The city is its region (Q1).** `region` is the cars key, Arabic in both locales; send it unchanged. Cities that share a region list the same cars; that is intended. An English region ("Riyadh Region") returns no cars. |
| R6 | **Saved location tuple.** City-car requests read the guest location from browser storage after hydration. They send `region`, `latitude`, and `longitude` together only when all three values exist; otherwise none of those parameters is sent. |
| R7 | **One fallback image (Q6).** Production will have images; TEST often returns `null` for `city_image`, car `image_url`, and `company_logo` / `logo_url`. Use the URL when present and one local fallback, `public/images/placeholders/image-fallback.svg` (added in C2), through one shared constant, when it is `null`. |
| R8 | **Not found.** There is no city-details endpoint. An id that is not in `/cities` returns `null` from the query, and the page calls `notFound()`. An unknown `region` is an empty 200, not a 404. |
| R9 | **Offers (Q3).** A car's offer is a free-days deal (`type: "free_days"`), not a price discount: map it to the card's offer badge, never to `originalPrice`. Other offer types have not been observed; treat an unknown `type` as no offer. |

Headers: `Accept: application/json`, `Accept-Language: ar | en` (page locale;
city, company, brand, type, model, and lookup titles follow it; the offer
`description` and `region` do not).

## 2. Endpoints

| Endpoint | Method | Auth | Query | Success `data` | App caller |
| -------- | ------ | ---- | ----- | -------------- | ---------- |
| `/cities` | GET | none | `per_page`, `page`, `search` (optional) | `CityDto[]` + `pagination` | `getCities()`: home `PopularCities`, `/cities`, `sitemap.ts`; `getCity(id)`: `/cities/[id]` |
| `/city-cars` | GET | none | `region` (required by the app, R6), `from_day` + `to_day`, `search`, `min_price`, `max_price`, `type_id[]`, `brand_id[]`, `service_id[]`, `company_id[]`, `per_page`, `page` | `CityCompanyGroupDto[]` + `pagination` (pages count companies) | City page office rows (today `getOfficeCarGroupsForCity`) |
| `/city-company-cars` | GET | none | `company_id` (required), `region` (required by the app), the same date, search, price, `type_id[]`, `brand_id[]`, `service_id[]` filters, `per_page`, `page` | `CityCarDto[]` + `pagination` (pages count cars) | "More cars" in one office row (new) |
| `/car-brands` | GET | none | `per_page`, `page`, `search` | `LookupDto[]` + `pagination` (17 on TEST) | `CarFilters` brand options (C6) |
| `/car-types` | GET | none | `per_page`, `page`, `search` | `LookupDto[]` + `pagination` (8) | `CarFilters` type options (C6) |
| `/car-additional-services` | GET | none | `per_page`, `page`, `search` | `LookupDto[]` + `pagination` (4) | `CarFilters` service options (C6) |
| `/companies` | GET | none | `per_page`, `page`, `search` | `CompanyLookupDto[]` + `pagination` (6) | `CarFilters` company options (C6) |

Query rules from Bruno and live checks:

- `from_day` / `to_day`: `Y-m-d`, both or neither; `to_day` after `from_day`.
- `min_price` / `max_price`: numeric, at least 0.
- `per_page`: integer, 1 to 100 on `/city-cars`; the lookups document `min:1`
  with no maximum; `per_page=100` returned every lookup in one page.
- `search` on the lookups: string, at most 100 characters.

## 3. Observed response shapes

Every response uses the envelope `{ data, message, code }`; the reads add
`pagination`. English message: `Fetched successfully.` Arabic message:
`تم الجلب بنجاح.`

### 3.1 `GET /cities`

HTTP 200 / body code 200. 21 cities on TEST on 2026-11-02, 9 (the ones with cars) on 2026-11-03; `per_page=100` returns all of them
in one page.

```json
{
  "data": [
    {
      "id": "<number>",
      "city_name": "<string, localized>",
      "city_image": "<string URL | null>",
      "region": "<string, Arabic in both locales>",
      "cars_count": "<number>"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": "<number>",
    "per_page": "<number>",
    "total": "<number>",
    "from": "<number | null>",
    "to": "<number | null>"
  },
  "message": "Fetched successfully.",
  "code": 200
}
```

- Only 1 of 21 cities has a `city_image` on TEST (an absolute URL under
  `/storage/lookups/cities/`); production will have images (Q6).
- Several cities share a region: Jeddah, Makkah, and Taif are `مكة المكرمة`;
  Dammam and Khobar are `المنطقة الشرقية`; two cities are `محافظة العاصمة`.
  They list the same cars (R5).
- `cars_count` is the same for every city in a region (Jeddah, Makkah, Taif:
  1148) and larger than the cars `/city-cars` lists for it. The app shows it
  as returned, on the city card only (Q2).

### 3.2 `GET /city-cars`

HTTP 200 / body code 200. Cars are grouped by company; `pagination` counts
companies (`per_page=1` → one company per page).

```json
{
  "data": [
    {
      "company_id": "<number>",
      "company_name": "<string, localized>",
      "company_logo": "<string URL | null>",
      "cars": [
        {
          "id": "<number>",
          "image_url": "<string URL | null>",
          "year": "<number>",
          "company_name": "<string>",
          "company_logo": "<string URL | null>",
          "any_car_branches_support_airport": "<boolean>",
          "lower_price": "<number>",
          "max_price": "<number>",
          "rate": "<number>",
          "has_offer": "<boolean>",
          "brand": { "id": "<number>", "title": "<string>", "logo": "<string | null>" },
          "type": { "id": "<number>", "title": "<string>", "logo": "<string | null>" },
          "car_model": { "id": "<number>", "title": "<string>", "logo": "<string | null>" },
          "offer": "<OfferDto | null>"
        }
      ]
    }
  ],
  "pagination": "<ApiPagination>",
  "message": "Fetched successfully.",
  "code": 200
}
```

A car with an offer (observed 2026-11-03; identical in `ar` and `en`):

```json
{
  "has_offer": true,
  "offer": {
    "id": 4,
    "description": "احجز 5 و وادفع 4",
    "type": "free_days",
    "require_booking_days": 5,
    "free_days": 1,
    "max_distance": 0
  }
}
```

Observed on 2026-11-03 across all regions with cars: 41 cars; 12 with
`has_offer: true`, all carrying the same offer (id 4, `free_days`);
`has_offer` always matches whether `offer` is set. 11 cars have
`lower_price: 0` (Q7). Car images and company logos are present for some
cars (absolute URLs under `/storage/cars/` and `/storage/companies/logos/`).
Airport support appeared only in `منطقة المدينة`. Filters checked on
2026-11-02: `brand_id[0]=4` and `min_price` / `max_price` narrowed the cars;
`search=kia` also matched the company name "Kiayada Company".

### 3.3 `GET /city-company-cars`

HTTP 200 / body code 200. `data` is a flat list of the car shape in 3.2;
`pagination` counts cars. For `company_id=1` in `منطقة الرياض`, `total: 3`
matched that company's 3 cars in `/city-cars`.

### 3.4 Filter lookups

`/car-brands`, `/car-types`, `/car-additional-services`: HTTP 200 / body code
200, public, paginated, titles localized.

```json
{
  "data": [{ "id": "<number>", "title": "<string>", "logo": "<string URL | null>" }],
  "pagination": "<ApiPagination>",
  "message": "Fetched successfully.",
  "code": 200
}
```

`/companies` uses `logo_url` instead of `logo`:

```json
{
  "data": [{ "id": "<number>", "title": "<string>", "logo_url": "<string URL | null>" }]
}
```

TEST totals: 17 brands (some with placeholder titles), 8 types, 4 services,
6 companies.

### 3.5 Validation and common errors

All returned HTTP 200 / body code 422 / `data: null`, without an `errors` map:

| Request | `message` (en) |
| ------- | -------------- |
| `/city-cars` with `from_day` but no `to_day` | `The end date field is required when start date is present.` |
| `/city-cars?per_page=500` | `The items per page field must not be greater than 100.` |
| `/city-cars?max_price=50` (no `min_price`), 2026-11-03 | `The maximum price field must be greater than or equal to minimum price.` The app sends `min_price=0` with a maximum (`toCityCarsQuery`). |
| `/city-company-cars` without `company_id` | `The company field is required.` |
| `/city-company-cars?company_id=9999` | `The selected company is invalid.` |

An unknown `region` returned 200 with an empty `data` and `from` / `to` null.
`/city-cars` without `region` returned 200 with cars (the app always sends it,
R6). 401, 5xx, and timeouts were not probed.

## 4. DTOs, mapping, and integration gaps



```ts
interface CityDto {
  id: number;
  city_name: string;
  city_image: string | null;
  region: string;
  cars_count: number;
}

interface LookupDto {
  id: number;
  title: string;
  logo: string | null;
}

interface CompanyLookupDto {
  id: number;
  title: string;
  logo_url: string | null;
}

interface OfferDto {
  id: number;
  description: string;
  type: string; // "free_days" is the only observed value
  require_booking_days: number;
  free_days: number;
  max_distance: number;
}

interface CityCarDto {
  id: number;
  image_url: string | null;
  year: number;
  company_name: string;
  company_logo: string | null;
  any_car_branches_support_airport: boolean;
  lower_price: number;
  max_price: number;
  rate: number;
  has_offer: boolean;
  brand: LookupDto;
  type: LookupDto;
  car_model: LookupDto;
  offer: OfferDto | null;
}

interface CityCompanyGroupDto {
  company_id: number;
  company_name: string;
  company_logo: string | null;
  cars: CityCarDto[];
}

// GET /cities:                  ApiPage<CityDto>
// GET /city-cars:               ApiPage<CityCompanyGroupDto>
// GET /city-company-cars:       ApiPage<CityCarDto>
// GET /car-brands, /car-types,
//     /car-additional-services: ApiPage<LookupDto>
// GET /companies:               ApiPage<CompanyLookupDto>
```

### 4.2 Domain model and API interface

```ts
// features/cities/model.ts
interface City {
  id: string;
  name: string;
  region: string;
  image: string; // city_image, or the fallback (R7)
  carsAvailable: number; // shown on the city card only (Q2)
}

interface CityCarsQuery {
  region: string; // required (R6)
  page?: number;
  perPage?: number;
  query?: string; // -> search
  minPrice?: number; // sent only when narrowed (as in parseCarSearchParams)
  maxPrice?: number;
  fromDay?: string; // Y-m-d, only with toDay
  toDay?: string;
  brandIds?: string[]; // C6
  typeIds?: string[];
  serviceIds?: string[];
  companyIds?: string[];
}

// features/cars/model.ts (C3)
interface CarOffer {
  requiredDays: number; // require_booking_days
  freeDays: number; // free_days
}
// CarListing gains `offer?: CarOffer` and `showroomLogo?`; its seats,
// transmission, fuelType, and reviewsCount become optional (CarDetails keeps
// reviewsCount required). The badge text comes from carCard.freeDaysOffer /
// carCard.freeDays, not the API description (Arabic in both locales, Q8).

// features/cities/api.ts
interface CitiesApi {
  listCities(locale: string): Promise<City[]>;
  listCityCars(locale: string, query: CityCarsQuery): Promise<Page<OfficeCarGroup>>;
  listCompanyCars(locale: string, companyId: string, query: CityCarsQuery): Promise<Page<CarListing>>;
}
```

`getCities()` reads `/cities?per_page=100` once per request (React `cache`).
`getCity(id)` finds the city in that list and returns `null` when it is absent.
`CityDetails` is replaced by `City`; the hero uses `name` and `image`, without
the car count (Q2).

### 4.3 UI mapping

| Domain field | Wire field | Mapping |
| ------------ | ---------- | ------- |
| `City.id` | `id` | `String(id)`; the route segment |
| `City.name` | `city_name` | Direct (localized) |
| `City.region` | `region` | Direct; sent to `/city-cars` unchanged (R5) |
| `City.image` | `city_image` | URL, or the fallback (R7) |
| `City.carsAvailable` | `cars_count` | Direct; rendered on the city card only (Q2) |
| `Office.id` | `company_id` | `String(company_id)`; also the `/city-company-cars` key |
| `Office.name` | `company_name` | Direct |
| `Office.logo` | `company_logo` | URL, or the fallback (R7) |
| `CarListing.id` | `id` | `String(id)` |
| `CarListing.name` | `car_model.title` | Direct; the card renders `{brand} {name}` |
| `CarListing.brand` | `brand.title` | Direct |
| `CarListing.image` | `image_url` | URL, or the fallback (R7) |
| `CarListing.pricePerDay` | `lower_price` | Direct (0 shown as returned, Q7) |
| `CarListing.originalPrice` | none | Not mapped: `max_price` is the top of the price range, and the offer is not a price discount (R9) |
| `CarListing.offer` | `offer` | `{ requiredDays: require_booking_days, freeDays: free_days }` when `type` is `"free_days"` and `free_days` ≥ 1; otherwise none |
| `CarListing.rating` | `rate` | Direct |
| `CarListing.year` | `year` | Direct |
| `CarListing.showroom` | `company_name` | Direct |
| `CarListing.pickupPoint` | `any_car_branches_support_airport` | `'airport'` when true |

| URL / filter | Query parameter | Mapping |
| ------------ | --------------- | ------- |
| `q` (`query`) | `search` | Trimmed; omitted when empty |
| price range | `min_price`, `max_price` | Sent only when narrowed (open bounds are omitted) |
| hero `from` / `to` | `from_day`, `to_day` | `Y-m-d`; sent only as a pair |
| `brands` | `brand_id[n]` | Ids from `/car-brands` |
| `types` | `type_id[n]` | Ids from `/car-types` |
| `services` | `service_id[n]` | Ids from `/car-additional-services` |
| `companies` | `company_id[n]` | Ids from `/companies` |
| `sort` | none | No sort parameter; the city page's sort bar stays off |

### 4.4 Integration gaps

| Gap | Where | Resolution |
| --- | ----- | ---------- |
| Routes and links use `city.slug` | `PopularCities.tsx`, `sitemap.ts`, `app/[locale]/cities/[slug]` | Route by `id` (R4); rename the segment to `[id]` in C2 |
| The hero shows a car count | `CityHero.tsx` (`carsCount`) | Drop it; the count stays on the city card (Q2), in C2 |
| `CarListing` requires `seats`, `transmission`, `fuelType`, `reviewsCount` | `features/cars/model.ts` | Not in `CityCarDto` and not rendered by `CarCard`; make them optional (or add a narrower listing type) in C3 |
| The card's offer badge is hard-coded | `CarCard.tsx` (`{true ? … : null}`, value `1`) | Render it only for `car.offer`, with `freeDays` and the description, in C3 |
| Cars grouped on the client | `getOfficeCarGroupsForCity` (cars mock + offices mock) | The API returns groups; map them directly in C4 |
| Filter options are placeholders | `CarFilters.tsx` (`COMPANIES`, `SERVICES`, `CAR_TYPES`, mock brands) | Fixed in C6 for city pages; `/cars` and the home drawer intentionally retain their mock options until their own listing integration |

## 5. Fractions and progress

One commit per fraction, on the branch the user names. Each is verified with
`npx tsc --noEmit -p .`, `npx next lint`, `npm run test`, `npx next build`, and
a `next start` smoke test, and committed only after approval. `docs/README.md`
is updated in the same commit.

Status: ⬜ not started · 🟡 in progress · ✅ done (committed)

| #  | Fraction | Main files | Done when | Status | Commit |
| -- | -------- | ---------- | --------- | ------ | ------ |
| C0 | Inspect contracts | this file | Bruno requests, live shapes in both locales, offers, lookups, filters, pagination, and validation recorded; Q1–Q6 answered | ✅ (local doc) | |
| C1 | Move cities API/mock | `services/cities.api.ts` → `features/cities/api.ts`, `services/mocks/cities.ts` → `features/cities/api.mock.ts`, `queries.ts` | No behavior change; still on the mock; `/`, `/cities`, `/cities/riyadh` render as before | ✅ | `b8c278c` |
| C2 | City list + route by id | `features/cities/{api,model,queries}.ts`, `PopularCities.tsx`, `CityHero.tsx`, `app/[locale]/cities/[id]`, `sitemap.ts`, `public/images/placeholders/image-fallback.svg` | Home rail, `/cities`, and the sitemap list the 21 API cities in both locales with their `cars_count` on the card; `/cities/1` renders the hero without a count; `/cities/999` carries `NEXT_NOT_FOUND`; null images show the fallback; mapper tests (observed DTO, null image, malformed record, bad envelope) | ✅ | `9adaf8f` (feature/cities-api) |
| C3 | City car DTOs, mappers, and offer badge | `features/cities/api.ts`, `features/cars/model.ts`, `CarCard.tsx` | Guards and mappers for the car, group, and offer shapes; `CarListing` accepts the API fields; the badge renders only for an offer; tests for the observed payloads (with and without offer, unknown offer type), null image/logo, airport flag, malformed DTOs | ✅ | `6dcd1cb` |
| C4a | Move the car mappers to the cars feature | `features/cities/api.ts` → `features/cars/api.ts` (+ tests) | No behavior change; `features/cities/api.ts` holds only `/cities`; mappers renamed `isCompanyCarsGroup`, `mapCarListing`, `mapCompanyCarsGroup` | ✅ | `3c9942a` |
| C4b | City page reads `/city-cars` | `features/cars/{api,queries}.ts`, `app/[locale]/cities/[id]/page.tsx` | Page 1 of company rows; `search`, a narrowed price, and the date pair sent from the URL; saved `region`/`latitude`/`longitude` are read after hydration; request tests cover complete and absent location tuples | ✅ | `cfca306` |
| C5 | Pagination | `app/api/city-cars/route.ts`, `features/cars/{cityCars.client,components,searchParams}.ts` | The browser fetches same-origin `GET /api/city-cars` for company rows and a company's cars; the route proxies the public backend GETs. The first city-row page shows its skeleton while the saved browser location resolves, and a location-picker save restarts it. | ✅ | `f5343df` |
| C6 | Lookup filters | lookups API (feature decided here), `CarFilters.tsx` | Brand, type, service, and company options come from §3.4 and are sent as indexed `brand_id[n]` etc.; browser-proxy parsing and filtered page requests preserve those IDs. | ✅ | `9a53add` |
| C7 | Status docs | `docs/README.md`, this file | C0–C6 are recorded as complete; the remaining cities follow-ups are explicit. | ✅ | pending |

## 6. Decisions and open questions

Decisions supplied by the user:

- 2026-11-02: use the backend contract as it is; routes use the city id and
  send the city's `region` (R4). One fallback image for every missing image
  (R7).
- 2026-11-03: answers to Q1–Q6 below.

| #  | Question | Owner | Answer |
| -- | -------- | ----- | ------ |
| Q1 | Cities in one region list the same cars. Filter by `city_id`? | Product | Resolved 2026-11-03: the city is the region. Keep filtering by `region` (R5). |
| Q2 | What does `cars_count` count? It is per region and larger than the listed cars. | Product | Resolved 2026-11-03: show it as returned, on the city card only; not in the hero. |
| Q3 | What is the `offer` shape? | Backend | Resolved 2026-11-03: observed on 12 cars (§3.2): a `free_days` offer. Mapped to the card's offer badge (R9). |
| Q4 | Is `region` required on `/city-cars`? | Product | Resolved 2026-11-03: required. The app always sends it (R6). |
| Q5 | Which endpoints return the filter option ids? | Backend | Resolved 2026-11-03: `/car-brands`, `/car-types`, `/car-additional-services`, `/companies` in Bruno `Home` (§3.4). |
| Q6 | City images are mostly `null`. | Product | Resolved 2026-11-03: production will have images; use them as they are and fall back when `null` (R7). |
| Q7 | 11 of 41 cars have `lower_price: 0` (some with `max_price` 4–5). Test data, or a free/unknown price? | Backend | |
| Q8 | Is `free_days` the only offer `type`? Is the offer `description` meant to stay Arabic in English? | Backend | |

## 7. Live probe history

On 2026-11-02, without a token, all reads:

1. `GET /cities` in `ar` and `en` (`per_page=3`, `per_page=100`, `search=Riy`);
   recorded the shape, region sharing, and image nulls.
2. `GET /city-cars` for every region with cars: grouping, pagination
   (`per_page=1`, `page=2`), filters (`brand_id[0]`, price, `search`), dates
   (pair and missing `to_day`), `per_page=500`, an English and an unknown
   region, and no region.
3. `GET /city-company-cars` with and without `company_id`, and with an unknown
   one.

On 2026-11-03, without a token, all reads:

4. `GET /city-cars` for every region with cars in `en` and `ar`: 12 of 41
   cars have the `free_days` offer id 4; 11 have `lower_price: 0`.
5. `GET /car-brands`, `/car-types`, `/car-additional-services`, `/companies`
   (`per_page=2` in `en` and `ar`, `per_page=100`): shapes and totals.

No data was written.
