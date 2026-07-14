# T-Car

T-Car is a modern car rental platform that allows users to browse and rent the latest car models for business trips, family vacations, and personal transportation.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Bootstrap 5
- Sass (SCSS Modules)
- Axios
- React Hook Form
- React Icons
- react-i18next (English / Arabic, RTL & LTR)
- ESLint + Prettier

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    page.tsx          Home route (/)
    layout.tsx         Root layout, metadata, providers
    loading.tsx        Global App Router loading state
    not-found.tsx       404 page
    robots.ts / sitemap.ts
    cars/page.tsx      /cars route
    services/page.tsx   /services route
    about/page.tsx     /about route
    contact/page.tsx    /contact route
  components/
    layout/       Header, Footer, LanguageSwitcher
    home/         Hero, SearchCars, FeaturedCars, WhyChooseUs, Services, Testimonials, FAQ
    common/       Button, Loader, SectionTitle
  assets/         images, icons, fonts
  services/       api.ts (Axios instance), cars.service.ts
  hooks/          custom hooks
  utils/          helper functions
  types/          shared TypeScript types
  constants/      shared constants
  styles/         main.scss (single global stylesheet: variables + base + all component styles)
  locales/        en.json, ar.json
```

Every component now renders with plain (non-CSS-module) class names — e.g. `.hero`,
`.hero-title`, `.header-nav`, `.car-card` — all defined in `src/styles/main.scss`,
instead of each folder having its own `module.scss`.

## Environment Variables

Copy `.env.local` and set your own values:

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SITE_URL=
```

## Internationalization

Language switching is handled by `react-i18next`. The `<html>` `lang` and `dir`
attributes update automatically based on the selected language (English = LTR,
Arabic = RTL).
