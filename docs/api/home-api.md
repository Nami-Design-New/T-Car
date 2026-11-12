# Home API (`GET /home`)

Last verified: 2026-11-04

Base URL: `https://t-car.app/api`

Status: the Hero, partners, why-us, support, apps, contacts, join-us, and
footer copy are integrated, as are the `/partners` list, `/why-us` cards, and
the home offers rail (`/offer-cars`).

Source: Bruno `Site/Home.yml` and live TEST requests using Arabic and English
`Accept-Language` values. This endpoint is public and has no query or body.

## Request

| Method | Path | Auth | Headers |
| ------ | ---- | ---- | ------- |
| `GET` | `/home` | Public (no token) | `Accept: application/json`, `Accept-Language: en \| ar` |

## Observed response

The response envelope contains `data`, `message`, and `code` (`200` on
success). The app consumes these sections:

```ts
interface HomeSectionDto {
  sub_title: string;
  title: string;
  description: string;
}

interface HomeResponse {
  data: {
    hero: HomeSectionDto;
    partners: HomeSectionDto;
    why_us: HomeSectionDto & { image: string };
    support: HomeSectionDto;
    apps: HomeSectionDto;
    contacts: HomeSectionDto & {
      form_title: string;
      form_description: string;
    };
    join_us: { title: string; description: string; image: string };
    footer: { text: string };
  };
  message: string;
  code: number;
}
```

The server query sends the active locale. `features/home/api.ts` validates the
envelope and selected fields, then maps snake_case names to the feature model.
The home route and root layout share the locale-aware query.

## Integration scope

| API field(s) | Current use |
| ------------ | ----------- |
| `data.hero.sub_title`, `title`, `description` | Hero eyebrow, heading, and supporting copy |
| `data.partners.sub_title`, `title`, `description` | Partners section heading and introduction |
| `data.why_us.sub_title`, `title`, `description`, `image` | Why Us eyebrow, heading, introduction, and section background; the cards come from `/why-us` |
| `data.support.sub_title`, `title`, `description` | FAQ section heading and introduction; FAQ entries still come from `/faqs` |
| `data.apps.sub_title`, `title`, `description` | Download-app section copy |
| `data.contacts.sub_title`, `title`, `description` | Contact section heading and introduction |
| `data.contacts.form_title`, `form_description` | Contact form introduction; contact details still come from `/settings` |
| `data.join_us.title`, `description`, `image` | Join-us call-to-action content and decorative image |
| `data.footer.text` | Shared footer description; settings continue to supply contact details and legal links |

Carousels, city lists, and FAQ entries continue to use their dedicated data
sources. If `/home` is unavailable, the root layout falls back to its existing
translated footer copy so other routes remain renderable.

## Partner and Why Us lists

Bruno requests: `Site/partners.yml` and `Site/why-us.yml`. Both endpoints are
public `GET` requests with no query or body. Live TEST requests on 2026-11-02
succeeded without a token in both locales. The `Accept-Language` header
localizes names and copy. Both responses use the standard `{ data, message,
code }` envelope; the observed `data` values are arrays with no pagination
object.

```ts
interface ApiEnvelope<T> {
  data: T;
  message: string;
  code: number;
}

interface PartnerDto {
  id: number;
  name: string;
  image_url: string;
}

interface WhyUsDto {
  id: number;
  image_url: string;
  title: string;
  description: string;
}

type PartnersResponse = ApiEnvelope<PartnerDto[]>;
type WhyUsResponse = ApiEnvelope<WhyUsDto[]>;
```

The live `GET /partners` response contained five records with `id`, `name`,
and `image_url`. The home `Partners` carousel reads it through
`getPartners()` (`features/home/queries.ts`), which sends the active locale and
maps each record to `HomePartner`; `name` is the image alt text and
`image_url` its source. A malformed response throws `AppError("server")`. Its
section heading and introduction come from `GET /home` (`data.partners`).

The live `GET /why-us` response contained one record with `id`, `image_url`,
`title`, and `description`; its title and description were localized. The
`WhyChooseUs` section (a server component) reads it through `getWhyUsCards()`
(`features/home/queries.ts`), which sends the active locale and maps each record
to `HomeWhyUsCard`; `image_url` is the decorative card image (empty alt, the
title follows). A malformed response throws `AppError("server")`. The
one-record response renders one card until more records are available. The
section heading, introduction, and background image come from `GET /home`
(`data.why_us`, mapped to `HomeContent.whyUs`); the old hard-coded cards and
the `whyChooseUs` messages were removed.

## Home offer cars

Bruno request: `User Application/Home/offer cars (home).yml`. The endpoint is
public and sends the standard paginated envelope. The home rail reads the
browser's saved location after hydration; the entire location tuple is omitted
when localStorage holds no usable location. The active `Accept-Language` header
localizes company, brand, type, and model titles.

| Method | Path | Auth | Query | Headers |
| ------ | ---- | ---- | ----- | ------- |
| `GET` | `/offer-cars` | Public (no token) | `page`, `per_page=3`, `delivery_type=from_branch`; and, only when saved, `region`, `latitude`, `longitude` | `Accept: application/json`, `Accept-Language: en \| ar` |

Live TEST on 2026-11-04 returned nine offer cars for the saved Asir location in Arabic.
The response is a direct car list (not the company-group structure from
`/cars-listing`), with this relevant shape:

```ts
interface HomeOfferCarDto {
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
  brand: { id: number; title: string; logo: string | null };
  type: { id: number; title: string; logo: string | null };
  car_model: { id: number; title: string; logo: string | null };
  offer: {
    id: number;
    description: string;
    type: string;
    require_booking_days: number;
    free_days: number;
    max_distance: number;
  } | null;
  availability: {
    booking_types: Record<"daily" | "monthly" | "airport" | "station" | "international", boolean>;
    delivery_types: Record<"to_location" | "from_branch", boolean>;
  };
}

interface ApiPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

type HomeOfferCarsResponse = ApiEnvelope<HomeOfferCarDto[]> & {
  pagination: ApiPagination;
};
```

`cityCarsApi.listHomeOfferCars()` validates and maps each record through the
same `mapCarListing()` function used by city/company cards. The browser reads
successive pages through the same-origin `/api/offer-cars` proxy and passes
them to the home `CarsRail`, so card links, fallback images, availability,
pricing, and the free-days offer badge stay consistent. Selecting an available
car opens `CityCarBookingFlow`, the same availability-constrained rental flow
used by city-company cards.
