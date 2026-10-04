# 8. Styles: compile from SCSS, stop committing CSS

> **Status (2026-10-04):** in progress, steps 1–3 of 7 done. Sass is pinned to
> `1.105.0`, the layout imports `main.scss`, so Next compiles every
> stylesheet, and the generated `main.css`, `main.css.map`, and
> `scripts/sync-office-css.mjs` are deleted; `.gitignore` ignores
> `src/styles/**/*.css` and `*.css.map`. Next: step 4 (Bootstrap entry). See [step 2 results](#step-2-results-2026-10-04).

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
6. **Split `main.scss`** alongside feature work: base styles to `styles/base/`,
   and each feature's section to its components' `.scss`, one feature per
   commit. Replace `@import` with `@use` / `@forward` as partials split out.
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
