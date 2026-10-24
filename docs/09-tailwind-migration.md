# 9. Tailwind CSS 4.3 migration

> **Status (2026-10-23):** Fractions 1–2 complete; Fraction 3 (shared UI)
> is in progress. The current fraction covers `Skeleton`, `PageSkeleton`, and
> `SectionTitle`.
>
> This document supersedes the SCSS end state in [08-styles-and-scss.md](08-styles-and-scss.md)
> if the migration is approved. The existing SCSS work remains valid until the
> first Tailwind fraction is merged locally.

## 9.1 Objective

Replace the repository's SCSS and trimmed Bootstrap styling with Tailwind CSS
4.3 while preserving behavior and the current visual system in both locales.
The migration is a styling implementation change, not a redesign.

The target is:

- Tailwind CSS 4.3 with the Next.js/PostCSS integration.
- `clsx` for readable conditional class composition in React components.
- A CSS-first Tailwind entry point and `@theme` tokens derived from the existing
  design tokens.
- Utility classes in component markup for component and feature styling.
- Small, intentional CSS components only where a utility class would make the
  behavior less readable or impossible to express, such as complex keyframes,
  third-party markup, and SVG animation.
- No Sass dependency, `.scss` source, Bootstrap stylesheet, generated CSS source,
  Sass watcher, or SCSS-specific check remaining after completion.

Tailwind 4.3 is a suitable target because it provides logical RTL-aware
utilities and the current CSS-first/PostCSS setup. See the official
[Tailwind CSS 4.3 release notes](https://tailwindcss.com/blog/tailwindcss-v4-3).

## 9.2 Current scope

The repository currently contains approximately:

| Area | Count |
| --- | ---: |
| SCSS files under `src/` | 45 |
| SCSS lines | 12,995 |
| TSX files | 197 |
| TSX lines containing `className` | 1,053 |

The largest style owners are `my-bookings`, `cars`, `booking`, `car-details`,
`layout`, `home`, and `rental-search`. The styles also include:

- design tokens in `styles/tokens/_tokens.scss`;
- global reset, typography, layout, and button rules;
- trimmed Bootstrap partials and utility classes;
- legacy dialog and component selectors;
- feature-level styles;
- shared UI component styles;
- Arabic/English direction rules and responsive breakpoints;
- date-picker, phone-input, Swiper, Google Maps, Lottie, and SVG-specific rules.

The worktree already contains unrelated, uncommitted auth changes. The Tailwind
migration must not overwrite or mix those changes into its fractions.

## 9.3 Design-system mapping

The existing design tokens remain the source of truth for values. They should be
ported to Tailwind theme variables rather than renamed opportunistically.

| Existing source | Tailwind target |
| --- | --- |
| `$ds-*` colors | `--color-*` theme variables |
| `$ds-radius-*` | `--radius-*` theme variables |
| spacing values | Tailwind spacing variables or explicit arbitrary values when required |
| `$breakpoint-*` | Tailwind breakpoint variables |
| Expo Arabic fonts | `@font-face` plus `--font-*` theme variables |
| Sass mixins/placeholders | utilities, component classes, or small explicit CSS rules |
| `dir="rtl"` / `:dir(rtl)` rules | `rtl:` variants, logical utilities, or scoped CSS where necessary |
| SCSS keyframes | CSS `@keyframes`, `animate-*` theme entries, or component CSS |

Do not recreate the old token names as a large compatibility layer unless a
component still needs them during an intermediate fraction. Compatibility CSS
must have a removal owner and fraction.

## 9.4 Migration rules

1. Preserve behavior, routes, accessibility, translations, and component APIs.
2. Migrate one coherent surface at a time; do not rewrite all markup and styles
   in one unreviewable change.
3. Each fraction is one local commit, following the repository workflow.
4. Before each commit, run the full verification checklist and wait for explicit
   user approval. Approval for one fraction does not approve the next.
5. Keep styles close to the component that owns them. Do not move feature rules
   into `main.scss` or create a new global stylesheet as a substitute for SCSS.
6. Prefer logical properties and Tailwind direction variants for RTL behavior.
   Avoid hard-coded `left`/`right` values when the behavior is directional.
7. Do not use `@apply` as a way to hide large SCSS translations. Use it only
   for a small, repeated component primitive with a clear owner.
8. Keep third-party selectors scoped and documented. Do not edit package output.
9. Remove a Sass/Bootstrap dependency only after all consumers have moved and
   the build proves that no stylesheet still requires it.

### Conditional classes

Use `clsx` when a component's Tailwind classes depend on props or state:

```tsx
import clsx from 'clsx';

<button
  className={clsx(
    'inline-flex items-center rounded-md px-4 py-2',
    'bg-brand text-white',
    disabled && 'cursor-not-allowed opacity-50',
    active ? 'ring-2 ring-brand/30' : 'hover:bg-brand/90',
  )}
>
  Save
</button>
```

Keep stable classes as strings and use boolean expressions or object syntax for
state-dependent classes. Avoid assembling Tailwind class fragments dynamically,
such as `` `bg-${color}-500` ``, because Tailwind cannot reliably detect those
class names during compilation. For repeated combinations, create a component
or a small helper with explicit complete class names.

## 9.5 Fractions

### Fraction 1: Tailwind foundation

- Add `tailwindcss` 4.3 and the required Next.js PostCSS integration.
- Add `clsx` and use it for conditional Tailwind classes.
- Add the Tailwind CSS entry point and import it from the locale layout.
- Port colors, radius, spacing, breakpoints, fonts, and motion tokens.
- Establish the direction strategy for `en` and `ar`.
- Keep the existing SCSS entry points active temporarily so this fraction does
  not change the rendered UI.
- Add a small proof component or migrated primitive to verify token generation.

### Fraction 2: Global layer and Bootstrap replacement — complete

Progress update: the reset, direction-aware base rules, typography defaults,
section spacing, and `container-tcar` are now owned by `tailwind.css`. The
SCSS button layer, Bootstrap entry, and feature styles remain active until the
utility-class inventory is migrated and verified.

Verification checkpoint: TypeScript, ESLint, and `next build` pass after this
change. The full test suite and route smoke test remain pending until the
Bootstrap utility migration is complete.

Next substep: migrate the plain Bootstrap utility classes in active components
to Tailwind utilities. The structural `.row`, form-switch, and `btn-light`
classes are intentionally deferred to focused replacements because they carry
component-specific Bootstrap behavior.

Progress update: active components now use Tailwind equivalents for flex/grid,
alignment, direction, width, spacing, and semantic status colors. Remaining
Bootstrap consumers are structural `.row`/grid markup, `.form-check` and
`.form-switch`, `.btn-light`, `.small`, `.visually-hidden`, and the shared
button component's own `btn-*` API. TypeScript, ESLint, and `next build` pass
after this update.

Next focused replacement: remove the generic helpers and give the contact form
and extend-booking price rows feature-owned class names. Their existing layout
rules will move with the names; payment switch styling remains deferred.

Spacing convention update: use Tailwind's standard scale (`mt-1`, `mt-2`,
`mt-4`, `gap-1`, `gap-2`, `gap-4`) instead of arbitrary rem values when the
standard utility expresses the intended spacing. The design-system spacing
values are namespaced as `--spacing-ds-*` so they do not override Tailwind's
standard scale.

Next focused replacement: replace the payment points switch's Bootstrap
`.form-check`/`.form-switch` markup with an owned switch class and remove the
Bootstrap form-check partial.

Progress update: the points switch now uses `.points-switch` and
`.points-switch-input` from the Tailwind component layer, and the Bootstrap
form-check partial is no longer imported. The remaining Bootstrap entry still
owns the phone input control, buttons, and grid. The visually-hidden helper is
now unused and will be removed with the remaining Bootstrap entry cleanup.

Next cleanup substep: move the shared `Button` base, variants, and sizes into
the Tailwind component layer. `PhoneField` already owns its rendered input
styles, so the Bootstrap form-control partial can be removed with the other
unused Bootstrap partials.

Progress update: the shared button base, variants, and sizes now live in the
Tailwind component layer. The Bootstrap stylesheet, its unused partials, and
the `bootstrap` package have been removed. The remaining SCSS is feature and
shared-component styling, which is handled by later migration fractions.

Verification checkpoint: TypeScript, ESLint, `next build`, the full test suite
(66 files / 306 tests), and route smoke tests pass with no Bootstrap stylesheet
or dependency. Visual review was accepted as the completion gate for this
fraction.

Current status: Bootstrap is removed from `package.json`, `package-lock.json`,
layout imports, and `src/styles`.

- Replace reset, body, typography, layout, button, loader, and visually-hidden
  rules used by the global shell.
- Inventory every Bootstrap class still rendered at runtime.
- Replace Bootstrap grid, form, button, spacing, display, and utility classes
  with Tailwind utilities or owned component styles.
- Remove the Bootstrap stylesheet import only after the inventory is empty.

### Fraction 3: Shared UI — in progress (`Button`)

Migrate the shared primitives in small groups, with their tests kept in place:

Progress update: `Button.tsx` now owns its layout, variants, sizes, icon,
loading-spinner, and reduced-motion utilities through `cn`. Only the custom
keyframes remain in `tailwind.css`; the SCSS import and stylesheet are removed,
and the existing component tests remain unchanged.

Follow-up fix: removed conflicting base `bg-transparent` and
`border-transparent` utilities so the primary and secondary variant utilities
are not overridden by Tailwind's generated utility order. Production smoke
tests confirm visible `btn-primary` classes in both `/en` and `/ar`.

Loading behavior: the Button keeps its title and icon visible while loading and
renders the spinner inline beside the title instead of overlaying/replacing it.

Size behavior: `sm`, `md`, and `lg` now each provide explicit Tailwind size
utilities. The `md` size previously relied only on the shared base class, so its
`btn-md` marker had no size utilities of its own.

Dialog animation behavior: the default dialog is centered at `50%`/`50%` and
opens with a shadcn-style centered fade/zoom from `scale(0.95)`; the backdrop
fades independently. The bottom-sheet animation remains opt-in through the
existing `placement="bottom-sheet"` prop.

Dialog progress: the shared Dialog layout, sizes, placement behavior, close
button, focus-visible state, and animation classes now live in `Dialog.tsx`.
The Dialog SCSS file and import are removed; marker classes remain so existing
feature-specific overrides continue to work.

ConfirmDialog progress: the cancel/confirm actions, danger tone, pending
disabled state, and error text now use Tailwind utilities in `ConfirmDialog.tsx`.
Its SCSS file and import are removed; marker classes remain for compatibility.

ResultDialog progress: the body alignment, responsive padding, animation sizing,
description typography, and action button now use Tailwind utilities in
`ResultDialog.tsx`. The SCSS file and import are removed; `result-dialog__*`
marker classes remain for compatibility. The existing bottom-sheet placement,
auto-close behavior, and action callback are unchanged.

Menu progress: the dropdown surface, item states, danger tone, separator,
reduced-motion behavior, and enter animation now use Tailwind utilities in
`Menu.tsx`. The SCSS file and import are removed; `menu__*` marker classes
remain for compatibility. Radix keyboard navigation, focus return, collision
positioning, and outside-click dismissal are unchanged.

AlertDialog progress: the failure icon, account-delete content, responsive
dialog surface, error message, and confirm/cancel actions now use Tailwind
utilities in `AlertDialog.tsx`. The component stylesheet is removed, the test
now targets `AlertDialog`, and the existing auto-close, loading, focus, and
callback behavior is unchanged.

Accordion progress: the structural heading reset, content overflow, open/close
height animations, and reduced-motion behavior now use Tailwind utilities in
`Accordion.tsx`. The SCSS file and import are removed; `accordion__*` marker
classes remain, and Radix keyboard navigation and ARIA state behavior are
unchanged.

RadioCards progress: the card reset, inherited typography, focus-visible ring,
cursor, and disabled state now use Tailwind utilities in `RadioCards.tsx`. The
SCSS file and import are removed; `radio-cards` and `radio-card` marker classes
remain so feature-specific card styles continue to compose with the primitive.

Tabs audit: `Tabs.tsx` already has no SCSS import or component stylesheet, and
the repository has no active `.tabs__*` rules or runtime callers requiring a
style migration. Its Radix roles, keyboard navigation, focus management, and
test coverage remain unchanged.

Grouped state/utility progress: `EmptyState`, `ErrorState`, `Loader`, and
`Price` now own their layout, responsive variants, state styling, currency
presentation, loader animation, and reduced-motion behavior through Tailwind
utilities. Their four SCSS files and imports are removed; existing marker
classes, public props, accessibility behavior, and tests remain unchanged.

Grouped form-control progress: `Form`, `PhoneField`, `OtpInput`, and
`DateTimePicker` now use Tailwind classes for field layout, control states,
validation messages, phone-widget overrides, OTP inputs, calendar cells, time
slots, and picker actions. Their repo-owned SCSS files and imports are removed;
the phone component's required vendor stylesheet remains external.

Grouped navigation/map progress: `BackButton` and `MapLocationModal` now use
Tailwind utilities for the button focus state, search controls, prediction
list, map placeholder, errors, and footer actions. Their SCSS files and imports
are removed; router behavior, Google Maps loading, prediction selection, and
location confirmation remain unchanged.

Grouped loading/title progress: `Skeleton`, `PageSkeleton`, and `SectionTitle`
now use Tailwind utilities for shimmer loading states, responsive skeleton
grids, title alignment, eyebrow styling, and subtitle typography. Their SCSS
files and imports are removed; loading variants, dimensions, accessibility,
and existing component props remain unchanged.

Feature surface progress: `layout` and `home` now use Tailwind utilities in
their header, navigation, footer, location, contact, FAQ, partners, CTA,
download, and feature-card markup. Their feature SCSS files and the home FAQ
stylesheet are removed; navigation state, translations, forms, links, and
responsive layouts remain unchanged.

Feature surface progress: `rental-search` now uses Tailwind utilities for the
hero carousel overlays, search bar, rental tabs, filter drawer, and drawer
motion. Its feature stylesheet is removed; search navigation, filter state,
modal flow, Swiper behavior, and RTL drawer direction remain unchanged.

Cars progress: `CarCard`, `CarOfficeRow`, and `CarsRail` now carry their card,
office-row, and horizontal-rail presentation in Tailwind utilities. `CarsRail`
now uses Swiper with RTL direction, responsive auto-width slides, looping, and
pause-on-hover autoplay. The `cars.scss` file remains active for the listing
shell, sort bar, and filter controls, which are the remaining parts of this
feature fraction.

- `Button`, `Dialog`, `ConfirmDialog`, `ResultDialog`;
- `Menu`, `Accordion`, `RadioCards`, `Tabs`;
- `Skeleton`, `EmptyState`, `ErrorState`, `Loader`, `Price`;
- `Form`, `PhoneField`, `OtpInput`, `DateTimePicker`;
- `BackButton`, `MapLocationModal`, and remaining shared UI.

Each group must preserve focus behavior, loading states, portal layering,
keyboard interaction, and RTL layout.

### Fractions 4–8: Feature surfaces

Migrate one feature per fraction, in this order:

1. `layout` and `home`;
2. `rental-search`, `cars`, and `cities`;
3. `car-details` and `booking`;
4. `account`, `wallet`, `bank-accounts`, and `points`;
5. `my-bookings` and `auth`.

The legacy rules used by each feature move with that feature. A fraction is not
complete while its old SCSS remains the active source for that surface.

### Fraction 9: Legacy cleanup and stylesheet removal

- Convert remaining legal pages, not-found animations, third-party overrides,
  and legacy dialog selectors.
- Remove every SCSS import.
- Delete all `.scss` files under `src/`.
- Remove `sass`, Bootstrap, SCSS-specific Next configuration, and obsolete
  scripts/checks from `package.json` and the repository.
- Rename or replace `check:css` with a guard that prevents accidental re-entry
  of SCSS and verifies the Tailwind entry point.
- Update docs 8 and 9 plus the phase/status tables.

## 9.6 Verification for every fraction

Run these checks in the repository's required order:

```text
npm run test
npx tsc --noEmit -p .
npx next lint
npx next build
npx next start -p 3123
```

While the server is running, curl affected routes and verify:

- expected page markup is present in the HTML;
- unknown resource IDs carry `NEXT_NOT_FOUND` in the rendered response;
- both `/en` and `/ar` routes render;
- the affected route's loading, error, empty, and not-found states remain valid.

Also perform a visual pass at 360px and 1280px for both locales, including:

- header, footer, home hero, car rails, filters, and search;
- account sections and booking details;
- dialogs, forms, validation errors, loaders, and result states;
- RTL ordering, icons, arrows, spacing, focus rings, and responsive wrapping.

Stop the server after the smoke test and run:

```text
git checkout tsconfig.tsbuildinfo
```

No fraction is committed until the user explicitly approves it.

## 9.7 Acceptance criteria

The migration is complete when:

- no `.scss` files remain in the repository;
- `sass` and Bootstrap are no longer dependencies or build inputs;
- all styles are produced from the Tailwind CSS entry point and intentionally
  scoped component CSS, if any remains;
- no runtime class depends on a removed Bootstrap utility;
- the existing design tokens, Arabic/English layouts, and responsive behavior
  are preserved;
- `npm run test`, typecheck, lint, build, and route smoke tests pass;
- the CSS bundle is measured before and after, with any meaningful increase
  explained;
- docs 8, 9, and the migration status table describe the final architecture;
- each fraction is represented by its own approved local commit.

## 9.8 Risks and decisions

### Visual drift

The largest risk is not Tailwind setup; it is translating nested SCSS selectors,
Bootstrap cascade behavior, and legacy specificity without changing the UI.
Computed-style snapshots or targeted browser screenshots should be used for
high-risk surfaces.

### RTL and responsive behavior

Existing rules use both direction-aware selectors and physical properties.
Every physical property must be reviewed rather than mechanically converted.

### Third-party markup

Phone input, Swiper, Google Maps, date picker, and animation libraries render or
depend on classes outside the normal component tree. Their selectors need an
explicit owner and regression check.

### Tailwind utility readability

Some 1,500-line feature stylesheets may produce unwieldy class strings. The
preferred solution is a small semantic component boundary, not a return to a
large global stylesheet.

### Documentation conflict

Phase 8 currently records the SCSS architecture as complete. Until this proposal
is accepted, that status remains historical. Once implementation starts, update
the phase entry to identify the Tailwind migration as the active follow-up and
mark the old SCSS target as superseded.

## 9.9 Effort estimate

Expected engineering effort is **7–10 working days** for a functional migration
and **10–15 working days** for close visual parity with full responsive and RTL
verification. Because the repository requires approval between fractions, the
calendar duration may be two to three weeks even when engineering time is lower.
