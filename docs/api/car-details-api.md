# Car details, company rates, and policies API

Last verified: 2026-11-08  
Base URL: https://t-car.app/api/user (TEST)  
Status: D1–D7 are complete (D7 adds the interim rental-context default for gaps G1/G2). Backend requests G1/G2 and G3 remain (section 8).

Sources: Bruno User Application/Home/{Car-details, car-company-rates,
policies}.yml, the current car-details feature, and read-only TEST requests in
Arabic. All observed requests succeeded without a bearer token. No TEST data
was written.

## 1. Integration rules

| # | Rule |
| - | ---- |
| R1 | Keep the detail page server-rendered. The route reads through features/car-details/queries.ts; browser-only interactions remain in leaf components. |
| R2 | First move the current mock boundary from services/carDetails.api.ts into features/car-details/api.ts and api.mock.ts. The feature index remains client-safe. |
| R3 | The detail request receives the selected rental context. The URL carries saved location as region, lat, and lng; the API maps these to region, latitude, and longitude. Send the entire tuple only when complete; when there is no saved location, omit every location parameter. Delivery, booking, and pickup IDs come only from the selected booking flow; no defaults are invented. Exception (approved 2026-11-08, gaps G1/G2): a missing booking type or delivery type becomes `daily` / `from_branch` via `withDefaultRentalContext` in `model.ts`, applied by the route before every read. Pickup IDs are never defaulted. |
| R4 | Use Accept: application/json and the active Accept-Language. These reads were public on TEST, so use the public server HTTP client rather than a customer token. |
| R5 | Preserve the API spelling serevices only in the DTO. Map it to the correctly named domain field services. |
| R6 | Warranty and policy content is backend HTML. Never render it with unsanitized dangerouslySetInnerHTML; first choose plain text or an allow-listed shared sanitizer/rich-text component. Decided: the HTML is rendered as is. `api.ts` (server only) sanitizes each `content` with `sanitize-html` (default allow-list plus h1, h2, span, u; links get `rel="noopener noreferrer"`), and `components/HtmlContent.tsx` renders it. Warranties keep `{title, content}`; policies keep one HTML string per API item. |
| R7 | An absent car returns null from the query so the route calls notFound(). Malformed success data is a server AppError; backend code 422 follows the existing integrated-API error handling. |
| R8 | Company rates are company-level and contain no comment. Map only user_name, value, and created_at to the rating UI; do not render order_number, final_price, order status, or a made-up description. |

## 2. Endpoints

| Method | Path | Auth | Query | Purpose |
| ------ | ---- | ---- | ----- | ------- |
| GET | /cars/{carId} | Public in TEST | booking_type and delivery_type (required by the backend since at least 2026-11-08); optional region, latitude, longitude (Bruno marks the coordinates required, but the backend no longer rejects their absence), airport_id, train_station_id, country_id | Identity, price, specification, services, allowance, warranties, insurance, and pickup availability |
| GET | /cars/{carId}/branches | Public in TEST | latitude, longitude, delivery_type, region (region is required by the observed backend although Bruno omits it) | Complete available-branch list for the car-detail branch dialog |
| GET | /cars/{carId}/company-rates | Public in TEST | optional latitude, longitude, delivery_type | The owning company's rating summary and rates |
| GET | /policies | Public in TEST | none | Site warranties, client instructions, and cancellation policies |

Bruno's detail example uses an airport selection:

    GET /cars/3?latitude=24.6468221&longitude=46.7138672
      &delivery_type=from_airport&airport_id=1
      &region=<selected region>&booking_type=airport

country_id belongs to the international flow and train_station_id to the
station flow. The backend has not supplied a complete validation contract for
these optional fields, so the frontend must send only the identifier matching
the selected booking type.

## 3. Observed success contracts

Every observed success has this envelope:

    interface ApiEnvelope<T> {
      data: T;
      message: string;
      code: 200;
    }

### 3.1 GET /cars/{carId}

Observed for car 3 with Bruno's airport context and Arabic Accept-Language:

    interface LookupDto {
      id: number;
      title: string;
      logo: string | null;
    }

    interface CarTechnicalDetailsDto {
      power: string;
      door_count: number;
      has_navigation: boolean;
      has_bluetooth: boolean;
      has_panorama: boolean;
      has_usp: boolean;
      has_background_camera: boolean;
      has_sensors: boolean;
      has_apple_play: boolean;
    }

    interface CarOfferDto {
      id: number;
      description: string;
      type: string;
      require_booking_days: number;
      free_days: number;
      max_distance: number;
    }

    interface CarDetailsDto {
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
      car_model: LookupDto;
      details: CarTechnicalDetailsDto;
      has_offer: boolean;
      offer: CarOfferDto | null;
    }

    interface BranchAvailabilityDto {
      branch: unknown | null; // only null observed for airport pickup
      has_airport: boolean;
      has_station: boolean;
    }

    interface CompanyServiceDto {
      id: number;
      price: number;
      title: string;
      type: string;
      key: string | null;
    }

    interface HtmlContentDto {
      title: string;
      content: string;
    }

    interface InsuranceDto {
      id: number;
      title: string;
      description: string;
      requires_percentage: boolean;
      percentage: number | null;
    }

    interface CarDetailsResponseData {
      car: CarDetailsDto;
      branch_data: BranchAvailabilityDto;
      serevices: CompanyServiceDto[]; // API spelling, map to services
      free_km: number;
      free_km_price: number;
      warranties: HtmlContentDto[];
      insurance: InsuranceDto | null;
      delivery_price: number;
    }

Notes:

- max_price is a price-range ceiling, not an original/struck-through price. It
  must not become CarListing.originalPrice.
- Reuse the free_days offer mapper only when has_offer and offer describe a
  valid deal.
- The response has one image_url, and product confirmed that one image is the
  complete contract. Render the existing gallery as a single image.
- free_km and free_km_price are confirmed numeric values; their final UI
  labels need a product decision.
- Warranty objects have no API ID; map their response position to a stable UI
  key.
- `CarDetails` keeps the DTO price names: `lowerPrice` (`lower_price`) and
  `maxPrice` (`max_price`), not the listing's `pricePerDay`/`originalPrice`.
  The booking card charges `lowerPrice` when it is above 0, else `maxPrice`,
  and strikes `maxPrice` through when it is above `lowerPrice` (the cars list rule).
- branch_data.branch is the nearest branch for the selected context. The full
  branch dialog list comes from GET /cars/{carId}/branches, not this field.

### 3.2 GET /cars/{carId}/branches

The endpoint needs the same location and delivery context as the detail read.
Bruno documents latitude, longitude, and delivery_type; the live backend also
requires region. Omitting region returned code 422 with the localized message
that the region field is required.

With the Monufia location and delivery_type=to_location, the successful
response was a direct array in the standard envelope:

    interface CarBranchDto {
      branch_id: number;
      title: string;
      stock: number;
      address: string;
      latitude: number;
      longitude: number;
      place_id: string;
      region: string;
      logo: string | null;
      distance_km: number;
    }

    type CarBranchesResponse = ApiEnvelope<CarBranchDto[]>;

Map detail branch_data.branch to the nearest-branch summary. Map this endpoint's
complete array to the all-branches dialog. stock is confirmed but has no
current UI use, so retain it at the DTO boundary until product specifies a
display rule.

### 3.3 GET /cars/{carId}/company-rates

Observed for car 1 with Bruno's location context:

    interface CompanyRateOrderDto {
      id: number;
      order_number: string;
      status: string;
      final_price: number;
    }

    interface CompanyRateDto {
      id: number;
      company_id: number;
      user_id: number;
      order_id: number;
      value: number;
      user_name: string;
      order: CompanyRateOrderDto;
      created_at: string; // YYYY-MM-DD HH:mm:ss in TEST
    }

    interface CompanyRatesResponseData {
      summary: {
        average: number;
        count: number;
        label: string;
      };
      rates: CompanyRateDto[];
    }

The observed summary was average 3.4, count 8, with a localized label. There
was no pagination, review text, or customer-safe display guidance. The first
integration should use only summary.average and summary.count, after product
confirms that company-level ratings belong on this page.

### 3.4 GET /policies

The response has localized HTML content:

    interface PolicyHtmlDto {
      id: number;
      type: string; // observed: user
      content: string; // HTML
    }

    interface PolicyWarrantyDto {
      id: number;
      title: string;
      content: string; // HTML
    }

    interface PoliciesResponseData {
      warranties: PolicyWarrantyDto[];
      client_instructions: PolicyHtmlDto[];
      cancellation_policies: PolicyHtmlDto[];
    }

The global warranties overlap semantically with the warranties embedded in the
detail response. Product selected the detail response warranties as the source
of truth for the car page. Do not merge or duplicate the global list there.

## 4. Current-feature mapping

| Current model/UI | Confirmed API source | Integration note |
| ---------------- | -------------------- | ---------------- |
| identity, name, brand, image, year, showroom, logo, daily price, rating | data.car | Map from the existing car-listing fields and use the existing image fallback. |
| originalPrice | none | Leave absent; max_price is not a discount. |
| offer | car.has_offer and car.offer | Reuse the validated free-days mapper. |
| specifications / quick facts | car.details, free_km, free_km_price, delivery_price, note | The current model contains string quick-fact labels only, so add a small mapped view model. |
| add-ons | serevices | Map id/title/price. Use driver.svg for key=adding_driver, travel-abroad.svg for key=travel_abroad, and shield-checked.svg when key is null. Unknown keys use the neutral fallback until specified. |
| insurance card | insurance | Current UI expects terms and cancellation lists, while the endpoint has one description and percentage values. Do not fabricate terms. |
| warranties | detail warranties | Product selected the detail response as the source of truth. Its HTML is rendered as safe plain text. |
| pickup summary | branch_data.branch | Map the nearest branch title, address, distance, logo, and coordinates. |
| all-branches dialog | GET /cars/{carId}/branches | Map the complete branch list using the same location, delivery type, and required region. |
| rating summary | company-rates.summary | Map average and count to the summary UI. |
| rating list | company-rates.rates | Render user_name, star value, and a localized formatted created_at date as in the approved UI. There is no description/comment. Do not render order number, order price, or order status. |

## 5. Plan and fractions

Each fraction is one approved commit. Verify with TypeScript, lint, targeted
tests, production build, and a route smoke test. Once implementation begins,
update docs/README.md in the same commit.

| # | Fraction | Main files | Done when | Status |
| - | -------- | ---------- | --------- | ------- |
| D0 | Contract decisions and probes | this document | Confirm HTML policy rendering and mileage/delivery presentation; branch-list, single-image, all-or-none location, service-icon, warranty-source, rating-display, and validation behavior recorded | Documented; only Q4 remains open |
| D1 | Feature-owned API boundary | services/carDetails.api.ts moved into features/car-details/{api.ts,api.mock.ts}; queries.ts | No UI change; the feature owns its API interface and mock; the public index remains client-safe | Complete (commit 65ef03a) |
| D2 | Core detail read | feature API/model/query and detail route | GET /cars/{id} replaces the mock for core detail fields with the full selected rental context; missing id uses notFound(); malformed, 422, and error states are tested | Complete (commit 76e38ca) |
| D3 | Offer, rating, technical quick facts, services, and insurance | detail API/model/components/tests | The listing offer badge overlays the detail image; the car's rating and backend technical quick facts are visible; `serevices` map with the agreed icons; insurance renders its API description and optional percentage without invented policy terms | Complete (commit 2f58d22) |
| D4 | Warranty content | car-details API/model/components/tests | Detail-response warranty HTML maps to safe plain text in the accordion; the existing route loading/error boundaries cover the read, and an empty warranty list has its own state | Complete (commit cd94c72); superseded by 02da8cb: warranty and policy HTML is sanitized and rendered as HTML (R6) |
| D5 | Company rates and policy links | rate/policy API/query/components/tests | Render the summary plus user name, star value, and formatted date for every rate; omit descriptions and all order metadata. Add renter-instructions and cancellation-policy tabs at the end of the detail page from GET /policies | Complete (commit cac6433) |
| D6 | Pickup and booking context | detail API/query, booking URL parsing, and branch component | Detail maps the nearest branch and GET /cars/{id}/branches fills the branch dialog; both send the selected location, delivery type, and region | Complete (commit a07aabe) |
| D7 | Status and live smoke | docs/README.md and this file | Completed fractions and unresolved backend gaps are recorded; Arabic and English route smoke tests cover saved and absent context | Complete (commit c77fe44): gaps (6.1), smoke (9), and the interim `daily` / `from_branch` default for G1/G2 |

Free-km and delivery-price presentation: closed by the user on 2026-11-08 with
no UI in this phase. They stay unmapped and are not displayed.

## 6. Observed validation behavior

All probes below were read-only requests to GET /cars/{id} on 2026-11-05 with
English Accept-Language. Validation failures returned HTTP 200 with a body
code of 422; an absent car returned HTTP 404 with a body code of 404.

| Case | Observed response | Frontend behavior |
| ---- | ----------------- | ----------------- |
| latitude=999 | 422: latitude must be between -90 and 90 | Do not send invalid coordinates. Show the backend validation message if it reaches the UI. |
| No latitude or longitude | 2026-11-05: 422 latitude is required. 2026-11-08: 200 with car data (location is now optional) | The URL and frontend request still omit the full tuple when location is unavailable; do not send a partial tuple. Without a location the car loads but has no nearest branch. |
| longitude=999 | 200 with car data | Backend does not currently validate longitude bounds. The frontend must still keep longitude finite and within -180 to 180. |
| Unknown car ID | 404: requested resource was not found | Query returns null and the route renders notFound(). |
| delivery_type=invalid | 422 with accepted values in the message | Send only flow-supported delivery types. |
| booking_type=invalid | 422: selected booking type is invalid | Send only flow-supported booking types. |
| airport booking with no airport_id | 422: airport is required for airport pickup | Send the selected airport ID for the airport flow. |
| airport booking with airport_id=999999 | 422: selected airport is invalid | Preserve the backend validation message; do not substitute another airport. |
| GET /cars/{id}/branches with no region | 422: region is required | Branch-list requests must include the complete location tuple and delivery context. |

### 6.1 Backend gaps found in D7 (2026-11-08)

Read-only GET /cars/3 probes, English Accept-Language, no token. The route
column is what `/[locale]/cars/[id]` does today with the matching URL.

| # | Case | Backend | Route today | Recommendation | Status |
| - | ---- | ------- | ----------- | -------------- | ------ |
| G1 | No booking_type (any delivery or location) | 422: the booking type field is required | Error boundary (`cars.details` RouteError) instead of the car. Reached by `/cars/{id}` with no query: sitemap entries, shared or bookmarked links, and CarCard clicks for listings without `availability` (they send only region/lat/lng) | Backend request: make booking_type and delivery_type optional for this public read. Applied interim: a missing value becomes `daily` / `from_branch` (R3 exception); verified 200 for cars 1–9, with and without location | Interim applied; backend request open |
| G2 | booking_type present, no delivery_type | 422: the delivery type field is required | Car renders with `from_branch` (interim, as G1) | Same as G1 | Interim applied; backend request open |
| G3 | booking_type=station, no train_station_id | 200 with car data (airport requires its ID; station does not) | Car renders | No change: the flow sends the selected station ID. Backend question: is the missing station-ID validation intended, given that airport requires its ID? | Backend question open |
| G4 | booking_type=station, train_station_id=999999 | 422: the selected train station is invalid | Error boundary | Only reachable with an edited URL; keep | Recorded |
| G5 | booking_type=international, no country_id | 422: the country is required for international bookings | Route rewrites the URL to `booking_type=daily&delivery_type=from_branch` and removes the incomplete international context before reading the car | Keep the safe URL fallback; the backend contract remains unchanged | Frontend handled |
| G6 | booking_type=international, country_id=999999 | 422: the selected country does not exist | Error boundary | Only reachable with an edited URL; keep | Recorded |
| G7 | No location, valid booking and delivery types | 200 with car data (was 422 on 2026-11-05) | Car renders without the nearest-branch card; branch list stays empty because GET /branches still needs the full tuple | No change | Recorded |

## 7. Resolved decisions

| Former question | Resolved decision |
| --------------- | ----------------- |
| Q1: branch shape and nearby list | The detail response provides the nearest branch; GET /cars/{id}/branches provides the complete branch-dialog list. |
| Q2: gallery contract | The detail API has one image only; render a single image. |
| Q3: service icon mapping | adding_driver uses driver.svg, travel_abroad uses travel-abroad.svg, and a null key uses shield-checked.svg. |
| Q5: warranty source | Use only the detail response warranties on the car page. |
| Q6: company ratings | Show the summary and each rate's user name, stars, and formatted date. Omit descriptions and all order metadata. |
| Q7: validation behavior | Record the observed 404 and 422 contracts in section 6. |
| Q8: unavailable saved location | Send region, lat, and lng together only when all exist; otherwise omit the full tuple. |

| Q4: insurance content | Closed by the user on 2026-11-08: the insurance section keeps the API description and optional percentage only. |

| G1/G2: missing rental context | 2026-11-08: the route requests `daily` / `from_branch` when the URL has no booking or delivery type (interim; see R3 and section 6.1). |

## 8. Open backend requests

No frontend decision is open. For the backend team:

| # | Request |
| - | ------- |
| G1/G2 | Make booking_type and delivery_type optional on GET /cars/{carId}, which serves public, shareable, and sitemap URLs. Once done, remove `withDefaultRentalContext` and the R3 exception. |
| G3 | Confirm whether booking_type=station without train_station_id should be a 422, as airport is. |

Branch, airport, station, and country validation are all verified (sections 6
and 6.1). Every flow sends only the ID it selected.

## 9. Read-only probe record

On 2026-11-05, without authentication, Arabic Accept-Language:

1. GET /cars/3 with Bruno's airport context returned 200 / code 200 and the
   DTO in section 3.1.
2. GET /cars/1/company-rates with its Bruno location context returned 200 /
   code 200 and the DTO in section 3.2.
3. GET /policies returned 200 / code 200 and localized HTML in section 3.4.
4. GET /cars/1 with to_location context returned a nearest branch in
   branch_data.branch; GET /cars/1/branches required region and then returned
   the full branch list in section 3.2.
5. Invalid/missing coordinates, invalid delivery and booking types, airport
   selection failures, and an unknown car ID produced the results in section 6.

On 2026-11-08, without authentication, English Accept-Language: the cases in
section 6.1, plus GET /cars/{1..9}?booking_type=daily with each delivery type
and no location (all 200; car 10 returned 404).

D7 route smoke on 2026-11-08 (`next start`, build of 02da8cb):

| Route (ar and en) | Result |
| ----------------- | ------ |
| `/cars/3?type=daily&deliveryType=from_branch&region=Riyadh&lat=24.7136&lng=46.6753` (saved context) | Car page: localized title, details grid, mobile rating button, policy tabs |
| `/cars/3?type=daily&deliveryType=from_branch` (no location) | Car page, as above |
| `/cars/3?region=Riyadh&lat=24.7136&lng=46.6753` (location only) | Before the interim: error boundary (G1). After: car page |
| `/cars/3` (no context) | Before the interim: error boundary (G1). After: car page |
| `/cars/3?type=monthly` (booking type only) | After the interim: car page (G2) |
| `/cars/999999999` (with or without context) | `NEXT_NOT_FOUND` |
| `/en/cars/3?type=station&deliveryType=from_branch&stationId=999999` | Error boundary (G4) |
| `/en/cars/3?type=international&deliveryType=from_branch` | Error boundary (G5) |

