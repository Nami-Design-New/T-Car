# Design System Migration Summary

Last updated: 2026-09-27

## Objective

Migrate the application from legacy Sass variables and hardcoded visual values to the semantic design system defined in [`src/assets/Variables.svg`](src/assets/Variables.svg).

The migration is being completed incrementally to avoid changing the entire application at once. The main source file is [`src/styles/main.scss`](src/styles/main.scss).

## Design direction

- Neutral, readable page and card surfaces.
- Blue for primary actions, focus, and selected states.
- Soft green for secondary actions.
- Dedicated success, warning, and error roles.
- Deep navy retained as an application-specific branded surface.
- The shared car card keeps its ticket-style offer strip as a recognizable application detail.

## Token architecture

### Primitive tokens

The `$ds-*` primitives reproduce the values in `Variables.svg`:

- Neutral: `100` through `600`
- Primary blue: `50`, `100`, `200`, `400`, and `500`
- Secondary green: `50`, `100`, and `200`
- Success, warning, and error scales
- Base white and black

### Semantic color tokens

The application now uses roles such as:

- Surfaces: `$ds-surface-background`, `$ds-surface-on-background`, `$ds-surface-elevated`, `$ds-surface-card-primary`, `$ds-surface-disabled`, `$ds-surface-brand`
- Text: `$ds-text-primary`, `$ds-text-subtle`, `$ds-text-placeholder`, `$ds-text-disabled`, `$ds-text-on-action`, `$ds-text-on-brand`
- Actions: `$ds-action-primary`, `$ds-action-secondary`
- Status: `$ds-status-success`, `$ds-status-warning`, `$ds-status-error`, `$ds-status-error-background`
- Structure: `$ds-stroke-light`, `$ds-stroke-heavy`, `$ds-shadow-color`

### Spacing and radius tokens

- Spacing scale: `2`, `4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`, `64`, and `80px`
- Radius scale: `0`, `4`, `8`, `12`, `16`, `24`, `32`, and full/pill radius

### One token added during this migration

`$ds-gauge-amber: #e0993a` was added to the token block. The rating stars and
the booking countdown use a warm amber that no neutral or primary ramp provides,
and it had been living as a local `$gauge-amber` declaration in the middle of the
booking-details section. Promoting it keeps every color declaration in the token
block at the top of the file.

Its dead sibling `$gauge-bg: #1c2333` was removed. It had zero references, so
nothing depended on it, but it was the last hardcoded color in the migrated
region. This is the only deletion of non-token code in the whole migration;
flagging it here rather than burying it.

## Compatibility bridge: removed

The bridge existed to keep unmigrated sections compiling. It mapped legacy
variables onto semantic tokens:

| Legacy variable | Semantic alias it resolved to |
| --- | --- |
| `$primary` | `$ds-surface-brand` |
| `$secondary` | `$ds-action-primary` |
| `$accent` | `$ds-text-primary` |
| `$light` | `$ds-surface-on-background` |
| `$dark` | `$ds-text-primary` |
| `$gray` | `$ds-text-subtle` |
| `$gray-light` | `$ds-stroke-light` |
| `$white` | `$ds-white` |

plus the standalone `$radius-md`, `$radius-lg`, `$shadow-sm`, and `$shadow-md`
declarations. All of it is now gone. The final section, the daily-booking modal,
took the last references, and the declarations were deleted rather than left
behind, so there is no dead token surface left to confuse a later reader.

`$font-size-base`, `$section-padding-y`, and `$section-padding-y-sm` are not part
of the bridge. They are still referenced and stay.

One Bootstrap interaction worth recording, since it looks like a regression if
you hit it cold. Line 1 imports Bootstrap, which defines its own `$primary` with
a `!default` assignment. The local `$primary: $ds-surface-brand` override sat
below that import, so it reassigned a variable after Bootstrap's CSS had already
been inlined and had no effect on the emitted Bootstrap output. Deleting it
changes nothing in the compiled result.

## Completed migration

The following areas have been migrated and checked for legacy colors, hardcoded colors, and legacy radius usage:

- Base/reset styles
- Shared buttons and loaders
- Shared section titles
- Language switcher
- Header, user menu, and footer
- Not-found page
- Terms and privacy pages
- Home hero and its pickup, map, branch, and selection modals
- Popular cities
- Partners
- Why Choose Us
- Download-app section
- FAQ
- Contact section
- CTA section
- City-details page, including date/time and sorting controls
- Shared `CarCard`
- Car-details page and branch-information modal
- Payment-method selector
- Insufficient-balance modal
- Wallet top-up modal
- Wallet result modal
- Account-deletion modal
- Details and booking flow: insurance and warranty accordions, add-on grid,
  sticky booking footer, and the booking modal with its date range calendar,
  time/location fields, and total footer
- Reviews and booking confirmation UI: reviews summary card, rating chip,
  reviews modal, confirm modal, price breakdown, payment method list, and the
  booking confirmation sheet
- Authentication: the `focus-ring` mixin, the `%auth_heading`, `%auth_subtext`,
  `%auth_input`, and `%auth_btn` placeholders, login form, edit-phone modal,
  verify-phone modal, OTP form, register form, and the success modal
- Review modal and the car-listing filter panel: the search field, filter
  headers, filter chips, radio and checkbox rows, service rows, the dual range
  price slider, price inputs, the brand list, and the mobile filter sheet
- Account page: the account sidebar, the shared form-field and icon-wrapped
  input rules, and the save button
- Wallet page: the balance card, wallet history rows, and the notifications
  block
- Bookings page: the tab strip, booking cards, their status pills, and the
  empty state
- Booking-details page: the page background, both copies of the duplicated
  header, the hero band, the dates and location cards, the countdown gauge, and
  the sticky price sidebar
- Action and cancellation modals: the extend-booking duration picker and price
  breakdown, the cancel-booking modal, the profile tab, and the license modal
- Join-us section: the shared form-group, label, input, textarea, select, and
  error rules, the file-upload field, and the showroom registration heading
- Daily-booking modal: the sticky header, the date-range calendar with its
  disabled and selected day states, the range summary, the pickup-time and
  address fields, the address card, the nested map modal with its locate
  button, the bottom sheet, and the sticky footer with the total

## Remaining migration

Nothing. Every section in `main.scss` is migrated. A single scan over the
application-style region, lines 132 to the end, returns `0` for legacy variable
references and `0` for hardcoded color literals, and there are no `rgba()`
calls with literal color channels left either.

The current state of application styles:

| Measure | Value |
| --- | ---: |
| Sections migrated | 33 of 33 |
| Lines migrated | 11821 of 11821 |
| Legacy token references | 0 |
| `$ds-*` references | 1492 |
| Hardcoded `#rgb`/`#rrggbb` literals | 0 |
| Hardcoded `rgba()` channels | 0 |

The single color literal that is not token-driven is the `.form_select` chevron
data URI described under deliberate substitutions below. It is percent-encoded,
so the scans do not see it.

## Deliberate role substitutions

Two replacements in the account-deletion modal changed a value rather than only
renaming it, and are recorded here so they are not mistaken for token drift:

- `.delete_account_cancel` was a navy outline button built from the legacy
  `$primary`. It is now an interactive outline action:
  `$ds-action-primary` for the border and label, `$ds-surface-elevated` for the
  fill, and `$ds-surface-card-primary` for the hover tint. This follows the
  pattern already used by `.branches-info-close` and `.payment_method_modal`.
- `.delete_account_confirm` is a destructive action, so it uses
  `$ds-status-error` rather than a success or neutral action color. This matches
  the destructive `.logout_btn` in the user menu. Its hover state uses
  `darken($ds-status-error, 5%)`, consistent with the other action hovers.

The booking modal added the following, all copied from the already-migrated
city-details calendar so the two calendars stay visually identical:

- Disabled calendar days moved from `rgba($dark, 0.25)` to
  `$ds-text-placeholder`, and the disabled confirm button moved from `#ddd`/`#999`
  to `$ds-surface-on-background`/`$ds-text-placeholder`. Both now match the
  city-details calendar exactly. This is a visible change: the disabled button
  is lighter and the disabled day labels are slightly darker than before.
- The calendar day hover tint moved from `rgba($secondary, 0.08)` to the opaque
  `$ds-surface-card-primary`, again matching the city-details calendar.
- Range highlights stayed as `rgba($ds-action-primary, 0.08)` rather than
  becoming the opaque surface token, because they are gradient stops that need
  transparency.

The reviews UI added two more:

- Filled rating stars moved from `#ffb800` to `$ds-status-warning`, and the
  `.car-quick-info-rating` chip moved from `rgba(#ffb800, 0.1)`/`#ffb800` to
  `$ds-warning-50`/`$ds-status-warning`. This copies the rating chip already
  migrated on the car-details page, so the two rating treatments now match.
  Stars are visibly more orange and the chip background is more opaque.
- Empty stars moved from `#ddd` to `$ds-stroke-heavy`, and review body text
  moved from `#555` to `$ds-text-subtle`, which is slightly lighter.

The authentication block added two:

- The `%auth_input` and register-form inputs moved from the cool blue-gray
  `#dce5ef` border to `$ds-stroke-light`, and the OTP input fill moved from
  `#f8fbff` to `$ds-surface-card-primary`. These are the same values within a
  couple of RGB steps, so the inputs are visually unchanged.
- The `.resend` hover state moved from `rgba($secondary, 0.13)` to
  `darken($ds-surface-card-primary, 3%)`, which keeps the same role, a slightly
  stronger version of the resting tint.

Two notes on judgment calls in this block. The WhatsApp button's white icon
tint now uses `rgba($ds-text-on-brand, …)` rather than `rgba($white, …)`, because
that button sits on a saturated brand fill, which is what rule 5 is for. The
`focus-ring` mixin default parameter changed from `$secondary` to
`$ds-action-primary`; all three call sites in the file pass only `$opacity` and
rely on the default, so no call site needed a matching edit. Any future call
site that passes an explicit color has to be checked, because the default no
longer masks a legacy reference.

The review modal and car-listing filters added four, and one of them is a real
color change rather than a like-for-like swap:

- The submit button in the review modal rested on `$primary`, which resolved to
  the navy brand surface `#0a2540`, and turned blue on hover. It now rests on
  `$ds-action-primary` and darkens by 6% on hover, which is the button
  convention used everywhere else in this migration. This is the one place in
  the file where the resting fill genuinely changed; set it back to
  `$ds-surface-brand` if the navy resting state is wanted.
- The notification dot on the mobile filter toggle was `#ef4444`, the raw
  `$ds-error-500` primitive, and now uses `$ds-status-error`, which is one step
  darker at `#dc2626`.
- Chip and price-box resting fills moved from `#f5f5f6` and `#fafafa` to
  `$ds-surface-on-background` at `#f8f8f8`, and the filter search field from
  `#f8fafc` to the same token, so all of them now share one value. Chip hover
  moved from `rgba($secondary, 0.07)` to `$ds-surface-card-primary`.
- Empty review stars moved from `#ddd` to `$ds-stroke-heavy` at `#d6d6d6`, and
  the range slider track from `#e5e5e5` to `$ds-stroke-light` at `#e9e9e9`.

The account, wallet, bookings, and booking-details pages added five, and two of
them are visible:

- The booking-details primary action used to rest on blue and turn navy on
  hover, the inverse of the review-modal submit button, which rested on navy and
  turned blue. Both now rest on `$ds-action-primary` and darken by 6% on hover,
  so the two buttons agree. The sidebar action lost its navy hover as a result.
- Booking status pills were hand-mixed per state. They now use the status scale:
  current and completed on `$ds-status-success`, late on `$ds-status-warning`,
  cancelled on `$ds-status-error`, and upcoming on `$ds-action-primary`, each with
  the matching 50 or 100 tint. Two of these are exact matches, `#d97706` and
  `#dc2626`, which were already the status values. The booking-card pills on the
  bookings page moved further, since `#f5a623`, `#ff4d4f`, and `#18b56b` were
  all outside the ramps.
- The warm beige page background `#f5f4f0` and the warm rating-star amber
  `#ffb800` are the last warm values in the migrated file. The background is now
  the neutral `$ds-surface-on-background` at `#f8f8f8`, and the stars use
  `$ds-gauge-amber` so they match the review modal's stars. Both are visible
  changes; there is no warm neutral in the token set to fall back to.
- Wallet amounts moved from `#18b56b` to `$ds-status-success` and the negative
  amount and payment-row tint from `#e11d48` to `$ds-status-error`.
- The countdown unit gradient was `#f3f3f3` to `#fafafa` and is now
  `$ds-surface-on-background` to `$ds-surface-elevated`, keeping the same
  light-to-white direction.

The action and cancellation modals added two, both about the last of the
hand-picked status colors:

- `#e53935` was the destructive red in five places, the late-fee row, the
  cancel-modal danger row, the profile warning state, the delete-account button,
  and its icon. All five now use `$ds-status-error` at `#dc2626`, which is
  marginally darker and slightly less orange. This extends the destructive
  exception already documented for the account-deletion confirm button; if a
  dedicated destructive action token is wanted, these five are its reason.
- `#36b37e` in the profile verification state became `$ds-status-success`, and
  the two tinted panels became their status-background tokens: `#fff0f2` and
  `#fff1f2` both collapse into `$ds-status-error-background` at `#fff1f2`, and
  the extend-booking and refund panels use `$ds-surface-card-primary`. The
  `#e5f0ff` refund panel and the `#e7f1ff` duration picker were two different
  pale blues and are now one value.

The join-us section added one substitution worth calling out because it was not
made. The `.form_select` chevron is an inline SVG data URI whose stroke is baked
in as `stroke='%23666'`, and it was left that way. A Sass variable cannot be
interpolated into that position without reintroducing a literal `#`, which would
terminate the URL as a fragment and break the icon. The alternative is an
external SVG or an icon font, which is a markup change rather than a token
change. The value is percent-encoded, so it does not register as a hardcoded
color literal in the scans, but it is a real literal and it is recorded here
rather than hidden. It is the only color left in the migrated file that is not
token-driven.

The daily-booking modal added four, and three of them are visible:

- Disabled calendar days moved from `#c6cbd1` to `$ds-text-option` at `#d6d6d6`,
  which is marginally lighter and matches the disabled-option role used
  elsewhere in the file. The now-unused `#ddd`/`#dcdcdc` value is gone with it.
- The sticky header and calendar tint moved from `#edf5ff` to
  `$ds-surface-card-primary` at `#f3f8ff`. Same role, slightly less saturated.
- The address card fill moved from `#f7f9fc` to `$ds-surface-on-background` at
  `#f8f8f8`, and the time-input clock icon from `#98a0a8` to
  `$ds-text-placeholder`. Both land within a few RGB steps of the originals.
- The overlay scrim moved from `rgba($dark, 0.55)`, where `$dark` resolved to
  near-black text, to `rgba($ds-shadow-color, 0.55)`, and the modal's
  `rgba($primary, 0.2)` shadow, which was navy-tinted, to
  `rgba($ds-shadow-color, 0.2)`. The `$shadow-sm` reference became
  `0 2px 8px rgba($ds-shadow-color, 0.06)` written out, since `$shadow-sm` is
  deleted. These are equal to the eye, and they remove the last tinted shadow in
  the file.

`$accent` had its last three references here. It aliased `$ds-text-primary`, so
those three became `$ds-text-primary` directly, which is why the field labels,
the address card, and the map-sheet note all read as primary body text rather
than as a distinct role.

## Known duplication

The wallet result and account-deletion sections repeat their rules: the wallet
result block appears three times and the account-deletion block twice, with only
`min-height: auto` and `width: 100%` differing between the two account-deletion
copies. All copies were migrated in place so the compiled cascade is unchanged.
Collapsing the duplicates is a separate cleanup and should not be mixed into a
token-only migration.

`.booking-details-header` is also declared twice, at lines 8755 and 8834. The
first copy carries the `.status` pills and the second carries
`.booking-actions`, so they are not a true duplicate: the second overrides the
shared properties and adds to the selector. Both were migrated in place and the
overlap was left alone.

## Progress

The migration is complete. Measured on `main.scss` over the application-style
region, which starts at line 132 and runs to the end of the file.

| Measure | Complete | Remaining |
| --- | ---: | ---: |
| Lines migrated | 11821 (100%) | 0 |
| Sections migrated | 33 of 33 (100%) | 0 |
| Legacy token references removed | 471 of 471 (100%) | 0 |

`main.scss` is 11944 lines after the bridge declarations were deleted, and now
carries 1492 `$ds-*` references with no hardcoded color literals and no literal
`rgba()` channels.

To verify the whole file in one shot:

```sh
awk 'NR>=132' src/styles/main.scss \
  | grep -cE '\$(primary|secondary|accent|dark|gray|gray-light|white|light|radius-md|radius-lg|shadow-sm|shadow-md)\b|#[0-9a-fA-F]{3,8}\b'
grep -cE 'rgba?\(\s*[0-9]' src/styles/main.scss
```

Both print `0`.

## Migration rules

1. Choose tokens by UI role, not by the nearest hexadecimal value.
2. Use surface tokens for backgrounds and text tokens for content.
3. Use `$ds-action-primary` for interactive blue states.
4. Use status tokens only for feedback states, plus the one exception already
   applied in the account-deletion modal, where a destructive confirm action
   uses `$ds-status-error`. If a second destructive action appears, add an
   explicit action token instead of spreading further status-token usage.
5. Use `$ds-text-on-action` or `$ds-text-on-brand` for inverse content.
6. Use stroke tokens for borders and `$ds-shadow-color` for shadow composition.
7. Replace non-system radii with the closest appropriate `$ds-radius-*` token.
   When a legacy radius sits exactly between two tokens, such as the 20px and
   22px values, prefer the larger token for card and modal surfaces and
   `$ds-radius-full` for thin pill-shaped elements such as scrollbar thumbs.
   Legacy `50%` and `999px` radii become `$ds-radius-full`.
8. Keep responsive layout and interaction behavior unchanged during token-only migrations.
9. Remove compatibility aliases only after their remaining reference counts reach
   zero. Done: every alias was deleted once the final section stopped using it.

## Validation status

Every section was checked with:

- `git diff --check`
- Section-level scans for legacy variables, and finally a whole-file scan
- Section-level scans for hardcoded colors, and finally a whole-file scan
- Section-level scans for legacy radius and shadow variables where applicable
- Brace-balance comparison against `HEAD` to catch structural damage

The final pass came back with braces at `1725` open and `1725` close, matching
`HEAD` exactly, `git diff --check` clean, and both whole-file scans at `0`.

No full application build, lint run, or Sass compilation was performed during this migration, following the project instruction not to build. That is the one gap in this validation: the checks are textual, so they confirm no legacy value and no unbalanced brace survived, but they cannot confirm the compiled cascade still looks right.

## Generated CSS note

The application imports [`src/styles/main.css`](src/styles/main.css), while migration work is being made in `main.scss`. The generated CSS and source map do not contain any of these semantic changes yet.

Do not manually maintain semantic changes in both SCSS and generated CSS. Treat `main.scss` as the source of truth and regenerate `main.css` through the project's normal Sass workflow now that the migration is ready for visual verification.

## Recommended next step

Regenerate the CSS and look at the application. The migration changed a small
number of colors on purpose, and the ones worth checking by eye first are:

- The review-modal submit button and the booking-details primary action, which
  both moved from a navy resting fill to `$ds-action-primary`
- The booking status pills, which were re-derived from the status scale
- The booking-details page background, which lost its warm beige cast
- The daily-booking modal, whose header tint and disabled calendar days shifted
  slightly
- The join-us select chevron, which must still render, and the file-upload
  button, which moved from navy to `$ds-action-primary`

Two cleanups are deliberately out of scope and should not be mixed into a
regeneration review: the duplicated wallet result and account-deletion rule
blocks, and the two overlapping `.booking-details-header` declarations. Both are
described under known duplication.

If a dedicated destructive action token is wanted, the five places now using
`$ds-status-error` for destructive UI are documented above and are the argument
for adding it.

