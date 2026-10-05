# 8. Styles: compile from SCSS, stop committing CSS

> **Status (2026-10-04):** in progress, steps 1–5 of 7 done; step 6 started (6.1: base layer). Sass is pinned to
> `1.105.0`, the layout imports `main.scss`, so Next compiles every
> stylesheet, and the generated `main.css`, `main.css.map`, and
> `scripts/sync-office-css.mjs` are deleted; `.gitignore` ignores
> `src/styles/**/*.css` and `*.css.map`. Bootstrap is its own entry,
> `styles/vendor/bootstrap.scss` (see [step 4 results](#step-4-results-2026-10-04)),
> trimmed to the partials and utility groups the markup uses (see
> [step 5 results](#step-5-results-2026-10-04)). Step 6.1 moved the global
> layer into `styles/base/` (see [step 6 progress](#step-6-progress)). See [step 2 results](#step-2-results-2026-10-04).

## 8.1 Current state

Two style pipelines run side by side:

| | App-wide styles | Component styles (since phase 1) |
| --- | --- | --- |
| Source | `src/styles/main.scss` (12,700 lines; line 1 imports **all** of Bootstrap) | `shared/ui/*/X.scss`, `features/*/components/X.scss`, `app/[locale]/loading.scss` |
| What the app loads | `src/styles/main.css`, a **committed build output** (22,100 lines, 504 KB, plus a 200 KB `main.css.map`) imported by `app/[locale]/layout.tsx` | the `.scss` itself; Next compiles it at build time |
| How it is built | by hand, outside the repo's scripts; `scripts/sync-office-css.mjs` splices single blocks back into `main.css` to avoid a full recompile | Next's Sass + PostCSS (autoprefixer) pipeline, with `sassOptions` in `next.config.mjs` |
| Tokens | `$ds-*` variables, now in `styles/tokens/_tokens.scss` | `@use 'tokens/tokens' as *` |

Problems:

- **Two sources of truth.** An edit to `main.scss` does nothing until someone
  regenerates `main.css`; an edit to `main.css` is silently lost at the next
  regeneration. Review diffs show generated CSS instead of the change.
- **No reproducible build.** Nothing in `package.json` builds `main.css`, and
  `"sass": "^1.79.4"` floats. A newer Sass rewrites hundreds of lines (color
  notation), which is why the sync script exists.
- **Everything in one file.** All of Bootstrap and every screen's styles are
  one stylesheet, loaded on every page.

### Drift check (2026-09-30)

`main.scss` compiled with the installed Sass (1.105.0) and compared with the
committed `main.css`, rule by rule (PostCSS parse of both):

| Difference | Count | Effect |
| --- | --- | --- |
| Rules or declarations that differ in meaning | **0** | — |
| Values that differ only in number notation, e.g. `rgb(2.37%, 44.2%, 97.8%)` vs `rgb(6.06, 112.7, 249.4)` | 149 | none: the same colors |
| Vendor-prefixed declarations (`-webkit-`, `-moz-`, …): committed 139, fresh 19; 11 `::-moz-placeholder` rules exist only in the committed file | 120 | none: `main.css` was run through autoprefixer when it was generated, and Next's PostCSS runs autoprefixer on every stylesheet it compiles |

So `main.scss` is the real source and the switch is not expected to change
what users see. Compiling `main.scss` takes about 4 s on a developer machine
(3 runs, including `npx` start-up).

## 8.2 Target

- The app loads **only SCSS sources**, compiled by Next. No generated CSS or
  source map is committed, so there is one source of truth and diffs show the
  real change.
- **One Sass version**, pinned exactly in `package.json`, so the output is
  stable across machines.
- **Bootstrap in its own entry** (`styles/vendor/_bootstrap.scss`, imported
  separately by the layout), trimmed to the partials the app uses. Editing the
  app's styles then does not recompile Bootstrap in development.
- **Styles live next to what they style**, as doc 4 §4.5 describes:
  `styles/{tokens,base,vendor}` for the global layer, and each feature's rules
  in `features/<x>/components/*.scss`, moved there as that feature's
  components are touched.
- `@use` / `@forward` instead of `@import`, which also lets
  `silenceDeprecations` in `next.config.mjs` shrink.

```
styles/
  tokens/_tokens.scss        (done in phase 1)
  base/_reset.scss  _typography.scss  _layout.scss
  vendor/_bootstrap.scss     (only the Bootstrap partials in use)
  main.scss                  @use base; @forward what features need
app/[locale]/layout.tsx      import '@/styles/vendor/bootstrap.scss'; import '@/styles/main.scss';
features/<x>/components/X.scss
shared/ui/<X>/X.scss
```

## 8.3 Migration steps

Each step is one commit, checked with `next build`, a comparison of the CSS
Next emits (the drift script from 8.1: no rule may change meaning), and a
visual pass of the main screens in Arabic and English at 360 px and 1280 px.

1. **Pin Sass.** `"sass": "1.105.0"` (the version the drift check used).
   No output change.
2. **Switch the import.** `layout.tsx` imports `main.scss` instead of
   `main.css`. Compare the CSS in `.next/static/css` before and after: only
   prefix and number-notation differences are allowed. Measure `next build`
   time and the dev reload time after a style edit, before and after.
3. **Delete the generated files.** `src/styles/main.css`, `main.css.map`,
   `scripts/sync-office-css.mjs`, and the `css:sync-office` script; add
   `src/styles/*.css` and `*.css.map` to `.gitignore`. Tell the team to turn off
   any editor Sass watcher (for example a "Live Sass Compiler" extension) that
   writes `main.css`.
4. **Separate Bootstrap.** Move the `@import` of Bootstrap into
   `styles/vendor/_bootstrap.scss`, imported by the layout before `main.scss`.
   Check that the cascade order is unchanged (Bootstrap first).
5. **Trim Bootstrap.** Search the code for the Bootstrap classes in use (grid,
   `d-*`, `gap-*`, `w-100`, `btn*`, `form-*`, `visually-hidden`, `text-*`,
   `mt-*`, …), import only those partials plus `reboot`, and compare the CSS size
   before and after. `react-bootstrap` leaves with the auth dialog (doc 4 step 9).
6. **Split `main.scss`** (plan agreed 2026-10-04, replacing "each feature's
   section to its components' `.scss`"; see [step 6 plan](#step-6-plan-agreed-2026-10-04)).
   Replace `@import` with `@use` / `@forward` as partials split out.
7. **Guard it.** A check in `npm run check` (or CI) that fails if a `.css` file
   under `src/styles/` is committed again.

### Step 2 results (2026-10-04)

The CSS Next emits with `main.css` and with `main.scss` was compared rule by
rule (PostCSS parse; vendor prefixes dropped; colours and numbers
canonicalised). Every other CSS chunk is byte-identical.

| Check | Result |
| --- | --- |
| Rules, in cascade order | 4,169 in both |
| Rules that differ in meaning | **0** |
| Rules that differ only in notation (all Bootstrap) | 60: minifier whitespace (`calc(-1 * x)` vs `calc(-1*x)`, `)and (`), colours 1/255 apart, `rgb()` in SVG data URIs written as percentages |
| Prefixes only in the old file | `-moz-column-gap` (Firefox ≥ 52 needs none), 3 `.form-floating` `:-moz-placeholder` rules (Firefox ≤ 50), `-webkit-print-color-adjust` on `.form-check-input` (printing a checked payment radio in Chromium < 136 / Safari < 15.4 only) |
| Main chunk size | 402,152 → 401,397 bytes |
| Clean `next build` (one run each) | 106 s → 115 s (within run-to-run noise) |
| Dev reload after a style edit (3 touches) | `main.css`: 1.8, 1.3, 1.1 s → `main.scss`: 5.7, 4.9, 13.9 s. Expected: every edit recompiles Bootstrap with the app styles; step 4 takes Bootstrap out of that loop. The old flow also needed a ~4 s Live Sass compile before Next reloaded |

Not done: the visual pass at 360 px and 1280 px in a browser. With zero
differences in meaning, the risk is limited to the print-only prefix above.

### Step 4 results (2026-10-04)

`styles/vendor/bootstrap.scss` (a normal file, not a `_` partial, because the
layout imports it directly) holds the Bootstrap `@import`; the layout imports
it before `main.scss`. `main.scss` used one Bootstrap Sass variable,
`$font-family-base` in `body:dir(rtl)`; it is now its compiled value,
`var(--bs-font-sans-serif)`, so `main.scss` needs nothing from Bootstrap.

| Check | Result |
| --- | --- |
| Stylesheet order on every page | Bootstrap, then the app styles, in the slot the single file had |
| Rules (Bootstrap + app, concatenated) | 4,169 in both; 4,055 identical |
| Rules that changed | 114, one cause: Bootstrap's `.h1`–`.h6` and `.small` rules use `@extend h1` / `@extend small`, which, in one compilation, also copied every app rule that styles `hN` or `small` (e.g. `.footer .h4, .footer h4`). Compiled apart, the app rules keep only the element selector |
| Visible effect | None found: no `.h1`–`.h6` class is used; the 10 `.small` uses are form error/status paragraphs, none inside the containers those 20 rules target |
| Size | 401,397 → 228,157 (Bootstrap) + 169,210 (app) bytes |
| Dev reload after editing `main.scss` (3 touches) | 5.7, 4.9, 13.9 s → 2.1, 1.4, 1.4 s (the old `main.css` flow: 1.8, 1.3, 1.1 s) |

Rule from this step: Bootstrap helper classes (`.h1`–`.h6`, `.small`, `.mark`)
style only the element itself now. Styling them inside an app component needs
an explicit selector in that component's SCSS.

### Step 5 results (2026-10-04)

Inventory: every word inside a string or template literal in `src/**/*.{ts,tsx}`
(over-inclusive on purpose), matched against the classes each Bootstrap partial
and each utility group generates when compiled alone. Runtime markup was
checked too: `react-phone-input-2` renders `.form-control` in `PhoneField`, and
`shared/ui/Button` builds `btn-<variant>` / `btn-<size>`.

| Kept | Why |
| --- | --- |
| `root`, `reboot`, `type` | `--bs-*` properties, element defaults, `.small` (form messages) |
| `containers`, `grid` | `.container` (footer), `.row` (contact and extend-duration forms) |
| `forms/form-control`, `forms/form-check` | phone input; payment-method switch |
| `buttons`, `spinners` | `Button`, wallet and bank-account dialogs |
| 14 of 97 utility groups | align-items, background-color, border, color, display, flex-direction, gap, justify-content, margin, margin-bottom, margin-top, padding, text-align, width: the 24 utility classes in use |

Dropped: images, tables, the other form partials, transitions, dropdown,
button-group, nav, navbar, card, accordion, breadcrumb, pagination, badge,
alert, progress, list-group, close, toasts, modal, tooltip, popover, carousel,
offcanvas, placeholders, helpers, and 83 utility groups. Word matches that are
not class uses: `fade` (Swiper's effect name), `alert` (`role="alert"`),
`placeholder` (the input attribute); `shared/ui/Accordion`'s `.accordion` class
only received unused `--bs-accordion-*` variables.

| Check | Result |
| --- | --- |
| Rules that changed | 0: the new output is an ordered subset of the old one; `.btn-lg` / `.btn-sm` only lose their `.btn-group-lg>.btn` / `.btn-group-sm>.btn` selector parts |
| Rules removed | 1,643, none for a class the markup uses |
| Used Bootstrap classes present in the served CSS | all 39 checked |
| Bootstrap CSS | 228,157 → 62,090 bytes (31.0 → 10.2 KB gzip). Next now merges it with the small `Menu` stylesheet before it; the order is unchanged |

**Correction (2026-10-04):** the inventory missed `.visually-hidden` (Bootstrap
`helpers`), used by `PageSkeleton` for its screen-reader-only "Loading…" label,
so loading screens showed that label after the trim. Cause: the scan read only
quoted strings, and an apostrophe in a comment shifted the quote pairing. Fixed
by importing `helpers/visually-hidden` (rules byte-identical to before the trim).
A re-check that matches **every word** of every source file against each dropped
partial and utility group found no other real use (`dropdown`, `nav`, `card`,
`modal`, `carousel`, `visible` appear only as words, elements, or in comments).

Rule from this step: `styles/vendor/bootstrap.scss` lists what is included.
Before using another Bootstrap class, add its partial or utility group there.

### Step 6 plan (agreed 2026-10-04)

Target:

```
styles/tokens/_tokens.scss       design tokens (no CSS output)
styles/vendor/bootstrap.scss     trimmed Bootstrap
styles/base/_reset _layout _typography _buttons   global layer, separate files
styles/legacy/_dialogs _components                 shared legacy styles until doc 4 replaces them
styles/main.scss                 only @use lines (base, legacy, then features)
shared/ui/<Name>/<Name>.tsx <Name>.scss <Name>.test.tsx index.ts
features/<x>/<x>.scss            one stylesheet per feature
```

| # | Step | Risk | Check |
| --- | --- | --- | --- |
| 1 | Normalize `shared/ui` folders: every component in `<Name>/<Name>.tsx` + `index.ts`, named exports, props types exported | none | typecheck, tests, CSS identical |
| 2 | Add the missing `shared/ui` tests | none | tests |
| 3 | Move UI component styles out of `main.scss` / `base/` into their component `.scss` (Form, DateTimePicker, PhoneField, Loader, SectionTitle, ResourceNotFound) | low | rule comparison, browser check of forms |
| 4 | `styles/legacy/_dialogs.scss` (`.modal_overlay`, `.close_btn`, `.map_modal`, `.selection_modal`) and `_components.scss` (`src/components/*`) | low | rule comparison |
| 5 | Features, stage 1: rules into `features/<x>/<x>.scss`, still `@use`d by `main.scss`; one feature per commit, smallest first; exact duplicates removed | low | rule comparison: no rule changes meaning |
| 6 | `main.scss` is only `@use` lines; then step 7's guard | none | `npm run check` |
| 7 | Stage 2, optional, per feature: the feature's components import its stylesheet instead of `main.scss` (CSS only where used) | medium | rule comparison + browser check |

Rules for every stylesheet: `@use` only (Bootstrap in `vendor/` excepted); class
names prefixed with the feature or component; no bare element selectors
outside `base/`; breakpoints and colors from tokens; nothing new in `main.scss`.

### Step 6 progress

| Sub-step | What moved | Check |
| --- | --- | --- |
| 6.1 (2026-10-04) | The top 380 lines of `main.scss` into `styles/base/`: `_reset` (`:root` font properties, element defaults, `.mirror-in-rtl`, direction rules), `_layout` (`.section`, `.container-tcar`), `_buttons` (the app's `.btn` layer), `_loader`, `_typography` (`.section-title`). Each partial `@use`s the tokens; `main.scss` `@use`s them first, in the old order | Emitted CSS byte-identical |

| Plan step 1 (2026-10-04) | `shared/ui` normalized: `Button`, `Loader`, `SectionTitle`, `DirectionProvider` out of `index.tsx`; `DateTimePicker`, `PhoneField` into folders; `FormInput` / `FormSelect` / `FormTextarea` into `Form/`; named exports everywhere (18 importers updated); every `index.ts` exports `<Name>Props` | CSS content identical; 64 tests pass |
| Plan step 2 (2026-10-04) | Tests for the 11 `shared/ui` components that had none: `Form`, `PhoneField`, `DateTimePicker`, `SectionTitle`, `Loader`, `ErrorState`, `RouteError`, `ResourceNotFound`, `Skeleton` / `PageSkeleton`, `Illustration`, `DirectionProvider` (43 tests). Every `shared/ui` folder now has a test | 107 tests pass; three deliberate component bugs were each caught |
| Plan step 3 (2026-10-04) | Component styles next to their component, imported by it: `Form.scss` (`.form_*`, from `main.scss`), `DateTimePicker.scss` (`.dt-picker*`), `PhoneField.scss` (`.phone_field`), `Loader.scss` (was `base/_loader`), `SectionTitle.scss` (`.section-title*`, was `base/_typography`). `_typography` stays as its own file for element-level text styles. Feature overrides stay with the feature (`.cars-rail-header .section-title-*`, `.contact … .react-tel-input`). `ResourceNotFound` had no rules of its own | Same 1,726 rules before and after; computed styles of 904 elements in headless Chrome (6 pages incl. the open date picker, en/ar, 1280/360 px) identical |
| Plan step 4 (2026-10-04) | `styles/legacy/_dialogs.scss`: `.modal_overlay`, `@keyframes popup`, `.close_btn`, `.selection_modal` (shared by account, booking, car-details, my-bookings, rental-search and the old components). `styles/legacy/_components.scss`: styles used only by `src/components/*` (`InsufficientBalanceModal`, `FailedModal`'s `.wallet_result_*` / `.delete_account_modal`, `SuccessModal`, `JoinUsForm`), each section labelled with its component. `main.scss` 11,970 → 10,781 lines | Same 1,656 rules; computed styles of 2,104 elements identical (pickup-type, branch, airport and station dialogs; car reviews and branches dialogs; `/join-us`; the five old modals rendered open on a probe page; en/ar; 1280/360 px) |

**Ownership map (from step 4 on):** each top-level block of `main.scss` is traced
to its source with a source map and assigned an owner from the root class of
its selector (which code areas use that class). It decides where each block
moves. About 780 lines have no user at all (e.g. the old `booking_daily_*`
dialog, `.booking-footer`, `.payment_methods`, `.bookings-empty`,
`.review-modal-overlay`, and the `failed_result_*` / `wallet_result_*` blocks
that appear three times).

**Dead CSS removed (2026-10-05):** 57 top-level blocks whose root classes no
source file uses (795 lines: 660 in `main.scss`, 135 in
`legacy/_components.scss`), 124 compiled rules. Checks: the files changed by
deletion only; the compiled CSS is an ordered subset of the old one; every
removed selector contains a class that appears nowhere in `src/` or the
messages (dynamic prefixes such as `btn-${size}` included); none of the 100
removed selectors matches an element on 28 page states in headless Chrome
(dialogs opened, en/ar). App stylesheet 166,859 → 155,205 bytes minified
(24.9 → 23.4 KB gzip). Kept: `booking_daily_address_*` (used by
`BookingMonthlyModal`).

**Cascade check (used from step 3 on):** a moved rule can change load order, so
each move is checked with headless Chrome (`playwright-core`, outside the
project) comparing the computed style of every element inside the affected
components before and after, at two widths and both locales; the harness is run
twice on the baseline first to prove it is deterministic.

Still in `base/_reset` but owned by features, to move with them: the
`nfSwing` keyframes (not-found page) and `body:dir(ltr) .download_app` (home).

Feature sections are not contiguous in `main.scss` (`.account-panel` sits at two
places; the wallet/failed result blocks appear three times), so gathering a
feature's rules reorders them against other features. Each feature sub-step
therefore gets the rule-by-rule comparison from step 2, not only a hash check.

## 8.4 Risks

| Risk | Mitigation |
| --- | --- |
| Slower development reloads: every style edit recompiles one 12,700-line file plus Bootstrap | Step 4 takes Bootstrap out of the edit loop; step 6 shrinks `main.scss`. Measure in step 2 |
| A browser relied on a prefix that only the old autoprefixer run added | Next's autoprefixer uses the project's browserslist (Next's default today). If a supported browser needs more, add a `browserslist` entry to `package.json` instead of committing CSS |
| Someone keeps editing `main.css` out of habit | Step 3 deletes it and ignores the path; step 7 fails the check |
| Cascade order changes when Bootstrap moves to its own entry | Import order in the layout is the cascade order; step 4 compares the emitted CSS |

## 8.5 Relation to other phases

- **Phase 5 (performance)** lists "a trimmed Bootstrap import" and "split SCSS";
  steps 4 to 6 here are those items.
- **Phase 7 (images):** `main.scss` references two images with `url()`
  (`../assets/images/hero2.png`, `../assets/images/fav.svg`). Next's CSS loader
  resolves those relative paths, so the switch does not affect them; phase 7
  rewrites them to `/images/...` when the files move to `public/`.
- **Doc 4 §4.5** describes the target structure; this document is the plan to
  get there.
