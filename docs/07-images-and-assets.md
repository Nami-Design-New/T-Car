# 7. Images and assets

> **Status (2026-10-04):** steps 1–5 of §7.4 are done; step 6 waits for the API
> phase. An audit on 2026-10-04 found leftovers, which are being closed in
> follow-up fractions (tracked in [README → Migration status](README.md#migration-status)):
>
> - ✅ Brand filter logos came from `/mock/` inside `features/cars` components;
>   they now come from `carsApi.listBrands()` through `getCarBrands()`, and a
>   `no-restricted-syntax` lint rule rejects `/mock/…` string literals outside
>   `src/services/mocks/` (rule 3).
> - ✅ Deleted the duplicate `src/assets/images/logo.png` and the unused
>   `public/images/brand/logo.svg`; `src/assets/` now holds only `fonts/` and
>   `animations/`. Rule 4 is enforced with `no-restricted-syntax`, which bans
>   any static or dynamic import of an image file (`.svg`, `.png`, `.jpg`,
>   `.webp`, …) in every folder. It replaced a `no-restricted-imports` pattern
>   list that the per-folder `overrides` silently replaced in `app/`,
>   `features/`, `shared/`, and `services/`.
> - Not pursued (user decision, 2026-10-04): `icons/payment/wallet.svg`
>   (62 KB, PNG inside) and `icons/payment/tamara.svg` (259 KB, JPEG inside)
>   stay as SVG; they are not converted to WebP. They load only inside the
>   on-demand payment dialog.

## 7.1 Current state

All 66 image and animation files (plus the 5 fonts) live in `src/assets/` and
are imported as modules
(`import sar from '@assets/icons/sar.svg'`), so every image is bundled
through webpack. Three kinds of image are mixed together:

| Kind | Examples today | Problem |
| ---- | -------------- | ------- |
| **UI icons** | `icons/sar.svg`, `icons/account.svg`, the rental tab icons, `card.svg`, `taby.svg`, `tamara.svg`, `ryal.svg` (split between `icons/` and the `assets/` root) | No single place; `ryal.svg` and `icons/sar.svg` are two different riyal signs |
| **Static app images** (part of the product, not data) | `logo.png`, `fav.svg`, `hero1-3`, `app-phone.png`, the store badges | Mixed with data images in `images/` |
| **Data images** (will come from the backend as URLs) | car photos (`car1*.jpg`), city photos (`c1-6.jpg`), office/partner logos (`b1-8.webp`), bank logos, country flags, car-brand logos (`nissan.svg`) | Imported as build-time modules by the mocks, so the model types say `string \| StaticImageData` although the API will send URL strings |

Other findings:

- **Oversized "icons".** `icons/balance.svg` (2.0 MB), `icons/coin.svg`
  (1.9 MB), and `images/gift.svg` (1.3 MB) are each one PNG wrapped in an
  SVG. The wallet tab and every car card download megabytes for small icons.
- **Unused by code:** `icons/Payment.svg`,
  `images/cta.png`, `images/notlogin.png`, `images/logo.svg`,
  `images/car1-back.jpg`, `car1-interior.jpg`, `car1-side.jpg`.
- **Naming:** `Play Sotre.webp` (typo), `Apple Store.webp` (spaces),
  `flages/` (typo), `Wallet.svg` / `Payment.svg` (capitalised).
- `next.config.mjs` allows images from **any** HTTPS host
  (`remotePatterns: [{ hostname: '**' }]`).

## 7.2 Target

Every image is served from `public/`, in three separate trees:

```
public/
  icons/             UI icons: small, part of the design system
    payment/         card.svg, tabby.svg, tamara.svg, wallet.svg
    rental/          daily.svg, monthly.svg, airport.svg, station.svg, international.svg
    ...              sar.svg, account.svg, booking.svg, whatsapp.svg, ...
  images/            static app images: part of the product, versioned with the code
    brand/           logo.png, logo-car.svg, logo-text.svg
    hero/            hero-1.jpg, hero-2.png, hero-3.png
    app/             app-phone.png, app-store.webp, google-play.webp
    illustrations/   cancel-booking.svg, gift.svg
  mock/              stand-ins for backend images, used only by services/mocks
    cars/  cities/  offices/  banks/  flags/  brands/
```

Stays in `src/`, because these are not served as image URLs:

- `src/assets/fonts/`: `next/font/local` needs the files inside the project.
- Lottie animations (`non_data.json`, `successful_login.json`) move to
  `src/assets/animations/`: they are JSON data the component imports.

`src/app/icon.svg` stays where it is (Next's favicon convention).

### Rules

1. **Icons and static images** are referenced by path through one registry,
   so a rename is a one-place edit and paths are typed:

   ```ts
   // shared/config/assets.ts
   export const ICONS = {
     sar: { src: '/icons/sar.svg', width: 16, height: 16 },
     ...
   } as const;
   export const IMAGES = {
     logo: { src: '/images/brand/logo.png', width: 160, height: 48 },
     ...
   } as const;
   ```

   `<Image {...ICONS.sar} alt="" />`. The registry carries each file's
   intrinsic size, which a static import used to supply.

2. **Data images are plain URL strings in the model.** `CarListing.image`,
   `City.image`, `Office.logo`, `Bank.logo`, `Country.flag`, and the others
   become `string`. The mocks return `'/mock/cars/creta.jpg'`, exactly the
   shape the API will return (`https://cdn.../creta.jpg`). Components render
   them with `next/image` and `fill` or an explicit size, never assuming a
   static import.

3. **`public/mock/` is only for mocks.** Nothing outside `services/mocks/`
   references it; it is deleted once the API is wired in.

4. **Lint.** `no-restricted-syntax` blocks importing any image file, so new
   code goes through the registry or the model. (Not `no-restricted-imports`:
   the per-folder layer rules in `.eslintrc.json` override that rule's options.)

5. **Remote images (API phase).** Narrow `images.remotePatterns` to the
   backend's image host, read from `env.ts`, when the API is integrated.

### Trade-off to accept

Files in `public/` are not content-hashed. A changed file keeps its URL, so it
needs cache headers or a new file name to reach users who have the old one
cached. Static imports gave that for free, plus the automatic width and
height. The registry replaces the sizes; rename a file (or add a `?v=`) when
its content changes.

## 7.3 Classification

| File today | Target | Kind |
| ---------- | ------ | ---- |
| `icons/sar.svg`, `ryal.svg` | `icons/sar.svg`, `icons/sar-alt.svg` (pick one with design) | icon |
| `icons/account.svg`, `booking.svg`, `arrow-down.svg`, `bank-edit.svg`, `bank-delete.svg`, `branch-car.svg`, `delivery-car.svg`, `whatsapp-icon.svg`, `money.svg` | `icons/…` (kebab-case) | icon |
| `icons/coin.svg`, `balance.svg` | `icons/…` after re-exporting as real SVG (see 7.1) | icon |
| `icons/dailytab.svg`, `monthlytab.svg`, `airport.svg`, `stationtab.svg`, `international.svg` | `icons/rental/…` | icon |
| `icons/Wallet.svg`, `card.svg`, `taby.svg`, `tamara.svg` | `icons/payment/…` | icon |
| `icons/logo-car.svg`, `logo-text.svg`, `images/logo.png`, `images/fav.svg` | `images/brand/…` | static |
| `images/hero1.jpg`, `hero2.png`, `hero3.png` | `images/hero/…` | static |
| `images/app-phone.png`, `Apple Store.webp`, `Play Sotre.webp` | `images/app/…` | static |
| `icons/cancel_booking.svg`, `images/gift.svg` | `images/illustrations/…` (`gift` re-exported, see 7.1) | static |
| `images/car1*.jpg` | `mock/cars/…` (the unused angles become the car details gallery) | data |
| `images/c1-6.jpg` | `mock/cities/<slug>.jpg` | data |
| `images/b1-8.webp` | `mock/offices/<slug>.webp` (the home `Partners` section reads the offices from the cars query) | data |
| `images/banks/sedad-bank.png` | `mock/banks/…` | data |
| `images/flages/flag1-5.png` | `mock/flags/…` | data |
| `icons/nissan.svg` | `mock/brands/…` (filter options come from the API with the URL filters) | data |
| `images/non_data.json`, `successful_login.json` | `src/assets/animations/` | animation |
| `Variables.svg` | `docs/design/Variables.svg`: the design-token source sheet (`styles/tokens/_tokens.scss` cites it); not an app asset | design reference |
| `icons/Payment.svg`, `images/cta.png`, `images/notlogin.png`, `images/logo.svg` | delete (unused; confirm `notlogin.png` and `cta.png` with design first) | unused |

## 7.4 Migration steps

Each step is one commit, verified with `next build` and a page check that the
images still render (no 404s in the served HTML's image URLs).

1. **Registry and icons.** Create `shared/config/assets.ts`; move the UI icons
   to `public/icons/` and switch every icon import to the registry.
2. **Static images.** Move them to `public/images/`; switch their imports to
   the registry.
3. **Data images.** Move them to `public/mock/`; change the model types from
   `string | StaticImageData` to `string`; point the mocks at `/mock/...` URLs.
   `Partners` reads the offices through a query instead of importing logos.
4. **Animations and cleanup.** Move the Lottie JSON to `src/assets/animations/`;
   move `Variables.svg` to `docs/design/` and update the path in
   `_tokens.scss`; delete the unused files; rewrite the two `url()` references
   in `main.scss` (see [doc 8](08-styles-and-scss.md) §8.5); add the lint rule; `src/assets/` keeps only
   `fonts/` and `animations/`.
5. **Weight** (can run in parallel, needs design): re-export `coin`,
   `balance`, and `gift` as real SVGs or small WebP files.
6. **API phase:** narrow `remotePatterns` to the image host; delete
   `public/mock/`.
