# Settings API (`GET /settings`)

Last updated: 2026-11-02  
Base URL: `https://t-car.app/api/user`  
Status: partly integrated. The contact details, the about / terms / privacy
links, and the Join Us company sizes are in use (`features/settings`, Contact
Us / Join Us branch C3ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“C4). The rest of the response is **planned, not
implemented** (Ãƒâ€šÃ‚Â§4ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â§5). This document is a plan only: no code change.

Sources: Bruno `User Application/Setting/setting.yml`, live requests on
2026-11-02 (English and Arabic, no token), and the current code.

> `docs/api/` is ignored by Git, like the other API docs. This file stays local.

## 1. Request

| Method | Path | Auth | Headers |
| ------ | ---- | ---- | ------- |
| `GET` | `/settings` | **Public** (no token) | `Accept: application/json`, `Accept-Language: en \| ar` |

Success: HTTP 200 / body `code: 200`. Message: `Settings retrieved
successfully.` / `ÃƒËœÃ‚ÂªÃƒâ„¢Ã¢â‚¬Â¦ ÃƒËœÃ‚Â¬Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â¨ ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â¥ÃƒËœÃ‚Â¹ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¯ÃƒËœÃ‚Â§ÃƒËœÃ‚Âª ÃƒËœÃ‚Â¨Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚Â¬ÃƒËœÃ‚Â§ÃƒËœÃ‚Â­.`. The app reads it on the server
through `publicServerHttp`, once per request (`getSettings`, React `cache`).

## 2. Response (observed 2026-11-02)

```ts
interface SettingsDto {
  // Backend pages (localized by Accept-Language: ?locale=en | ar)
  terms_url: string;
  about_us_url: string;
  privacy_policy_url: string;

  // App assets
  app_icon_url: string;     // https://t-car.app/storage/settings/....png
  splash_image_url: string; // https://t-car.app/storage/settings/....png

  // Feature switches
  daily_booking_showing: boolean;
  monthly_booking_showing: boolean;
  station_booking_showing: boolean;
  airport_booking_showing: boolean;
  international_booking_showing: boolean;
  rewards_screen_showing: boolean;

  // Location defaults
  latitude: number;   // 24.6477765
  longitude: number;  // 46.8291086
  region: string;     // "Ãƒâ„¢Ã¢â‚¬Â¦Ãƒâ„¢Ã¢â‚¬Â ÃƒËœÃ‚Â·Ãƒâ„¢Ã¢â‚¬Å¡ÃƒËœÃ‚Â© ÃƒËœÃ‚Â§Ãƒâ„¢Ã¢â‚¬Å¾ÃƒËœÃ‚Â±Ãƒâ„¢Ã…Â ÃƒËœÃ‚Â§ÃƒËœÃ‚Â¶" (Arabic in both languages)
  distance: number;   // 20 (unit not stated; km assumed)

  // Car filters
  min_filter_price: number; // 5
  max_filter_price: number; // 55

  // Contact
  phone: string;          // "+201151305555" (test data)
  email: string;          // "momen@gmail.com" (test data)
  facebook_link: string;  // test data: all three point to the admin page
  instagram_link: string;
  twitter_link: string;

  // Join Us
  company_sizes: { id: number; size: number }[]; // ids 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“5, sizes 10ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“50
}
```

Every value above was identical in English and Arabic except the three page
URLs (`?locale=`) and the message.

## 3. Already in use

| Field(s) | App model (`features/settings`) | Used by |
| -------- | ------------------------------- | ------- |
| `company_sizes` | `AppSettings.companySizes` | Join Us size select (`getSettingsAction`) |
| `email`, `phone`, `facebook_link`, `instagram_link`, `twitter_link` | `AppSettings.contact` | Home Contact card, footer (`getSiteSettings`, props) |
| `about_us_url`, `terms_url`, `privacy_policy_url` | `AppSettings.links` | Footer (About us, terms, privacy), register form consent (`useSiteLinksStore`) |

The mapper keeps each of these optional: an unusable value is left out
instead of failing the whole settings read.

## 4. Planned (not implemented)

Each row is one fraction on a new branch, in the order listed. Each adds its
fields to `AppSettings` and `mapSettings` (optional, so a missing value never
breaks the read), follows the state rules in doc 1 Ãƒâ€šÃ‚Â§1.5 item 10, and is
verified per `AGENTS.md`.

| # | Fields | Where the app decides this today | Plan |
| - | ------ | -------------------------------- | ---- |
| S1 | `daily_booking_showing`, `monthly_booking_showing`, `station_booking_showing`, `airport_booking_showing`, `international_booking_showing` | `features/rental-search/components/RentalTabs.tsx`: fixed list of five `RentalType` tabs in the home Hero | Implemented (2026-11-02): `getBookingTypeAvailability()` reads the switches on the server and passes them to `Hero` / `RentalTabs`; disabled tabs are hidden. Missing flags or settings read failures keep all tabs available. `/cars` and `/cities/[slug]` call `notFound()` for direct searches using a disabled known type. |
| S2 | `min_filter_price`, `max_filter_price` | `PRICE_MIN = 100`, `PRICE_MAX = 30000`, defined twice: `features/cars/hooks/useUrlCarFilters.ts` and `features/cars/searchParams.ts`; used by `CarFilters` (price slider) and the URL parsing | Use the API bounds 5â€“55 as the allowed minimum and maximum. Remove the `$` display and render the price with the SAR `Price` component. |
| S3 | `latitude`, `longitude`, `region`, `distance` | `shared/ui/MapLocationModal/MapLocationModal.tsx`: fixed center `24.7136, 46.6753` (Riyadh). The guest location (`shared/lib/guest-location.ts`) has no default. No search radius in the app. | Use `latitude` / `longitude` as the map default center. Do not use `region` or `distance` for now (Q3 and Q5). |
| ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â | `app_icon_url`, `splash_image_url` | Not applicable | Mobile app assets; the web app keeps its own icon (`src/app/icon.svg`). Not planned. |

The response also contains `rewards_screen_showing`, but the web app has no points/rewards section in scope; this switch is documented as observed and is not planned for web integration.

## 5. Questions before implementing

| Q | Question | Why |
| - | -------- | --- |
| Q1 | Resolved: `min_filter_price` / `max_filter_price` (5 / 55) are the allowed minimum and maximum in the app. | Use 5â€“55 as-is; remove the `$` and use the SAR `Price` component. |
| Q2 | Resolved: should a disabled booking type work from a shared link or saved search? **No.** | Disabled types are unavailable through those entry points too. |
| Q3 | Resolved: `distance` is not used. | Do not integrate it for now. |
| Q4 | Resolved: `rewards_screen_showing` is not used for now. | No points/rewards integration is planned at this time. |
| Q5 | Resolved: `region` is not used for now. | Do not integrate it for now. |

## 6. Notes

- All settings are read on the server; components get them as props. Only
  values that unrelated client components need across the tree go into a
  Zustand store (today only the site links), per doc 1 Ãƒâ€šÃ‚Â§1.5 item 10.
- The contact values and social links on the TEST server are test data.
