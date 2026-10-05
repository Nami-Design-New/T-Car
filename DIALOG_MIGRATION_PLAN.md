# Dialog Module Implementation and Migration Plan

Status: in progress — the shared Dialog foundation plus the CountryModal, WalletAmountModal, and BankSelectModal pilots are implemented; other dialog migrations remain planned.

## 1. Purpose

The application currently implements dialogs in several different ways. This plan introduces one reusable dialog module with a small interface and migrates every dialog-like surface to it without changing business behavior.

The intended outcome is:

- one accessible and consistent dialog shell;
- simple domain-dialog implementations;
- one place to fix focus, stacking, scrolling, animation, and responsive behavior;
- incremental migration with a working application after every phase;
- removal of duplicate and unused dialog implementations.

## 2. Architectural decision

Create a deep `Dialog` module at the seam between domain content and browser dialog behavior.

Callers should only need to understand:

- whether the dialog is open;
- how it closes;
- its size or mobile presentation;
- its title/description and composed content.

The module implementation should hide:

- portal mounting and server-rendering safety;
- `role="dialog"`, `aria-modal`, title and description IDs;
- focus trapping, initial focus, and focus restoration;
- Escape handling and backdrop dismissal;
- body scroll locking;
- nested-dialog stacking and topmost-dialog behavior;
- animation and reduced-motion behavior;
- desktop centering, mobile bottom-sheet behavior, and safe-area spacing.

### Recommended implementation adapter

Use `@radix-ui/react-dialog` inside the module implementation, but do not expose Radix-specific props or imports to callers.

Reasons:

- focus trapping and restoration are difficult to implement correctly by hand;
- the application has nested flows such as booking dialog → map dialog;
- Radix supplies portal and dismissable-layer behavior;
- wrapping it keeps the external interface stable if the adapter is replaced later.

Pin and review the dependency version during implementation. Do not add the dependency as part of this planning change.

React-Bootstrap should not become the shared seam. It is currently used only by `AuthModal`, while the rest of the application uses custom markup. After `AuthModal` is migrated, review whether `react-bootstrap` can be removed. The `bootstrap` CSS dependency is a separate decision because utility classes are used elsewhere.

## 3. Goals and non-goals

### Goals

- Standardize controlled state on `open` and `onClose`.
- Make the common path require minimal configuration.
- Preserve existing domain props and user flows during migration.
- Support RTL and LTR without domain-level direction logic.
- Support centered dialogs, mobile sheets, large forms, and full-screen map dialogs.
- Make destructive confirmation explicit.
- Make stacked dialogs safe and predictable.
- Consolidate duplicate review dialogs.
- Remove dead dialog files after verification.
- Keep SCSS as the styling source of truth.

### Non-goals

- Do not redesign every dialog during the shell migration.
- Do not rewrite booking, authentication, payment, OTP, or map business logic.
- Do not introduce a global dialog store unless a real cross-route use case appears.
- Do not migrate non-modal popovers such as `DateTimePicker` into the dialog module.
- Do not combine the migration with a broad copywriting or localization rewrite.

## 4. Current-state audit

The audit found 26 dialog-related locations: 25 files named as modals plus one inline branches dialog. `EditDailyBookingModal` is an adapter over `BookingDailyModal` and does not render an independent shell.

Current implementations include:

- custom overlays rendered through `createPortal`;
- custom overlays rendered in place;
- one React-Bootstrap modal;
- one inline dialog with explicit dialog semantics;
- duplicated review-dialog files;
- repeated scroll-lock, mounted-state, Escape, and backdrop-click logic.

### Main risks in the current implementation

1. Most custom dialogs do not declare `role="dialog"` or `aria-modal="true"`.
2. Focus is generally not trapped or restored to the triggering control.
3. Body scroll locking is duplicated and not stack-safe. Closing one nested dialog can unlock the page while another dialog remains open.
4. Portal behavior is inconsistent, so dialogs can inherit unexpected stacking or clipping contexts.
5. Escape and backdrop behavior varies without a documented reason.
6. Several close buttons have labels, but title and description relationships are usually missing.
7. Multiple dialog families duplicate layout, close buttons, headers, footers, and responsive sheet behavior.
8. `SuccessModal` and `FailedModal` mix shell behavior, timers, navigation, status presentation, and destructive confirmation.
9. `MapLocationModal` can be opened over a booking dialog, which requires reliable nested-layer behavior.
10. Two `ReviewsModal` files are identical.

## 5. Inventory and intended disposition

| Current module/location                            | Current role                                             |  Referenced now | Intended disposition                                                         |
| -------------------------------------------------- | -------------------------------------------------------- | --------------: | ---------------------------------------------------------------------------- |
| `components/auth/AuthModal.tsx`                    | Multi-step login/OTP/register flow using React-Bootstrap |             Yes | Migrate late; keep step state in the domain module                           |
| `components/common/SuccessModal.tsx`               | Success state, optional timer and redirect               |             Yes | Rebuild as a `StatusDialog` adapter over `Dialog`                            |
| `components/common/FailedModal.tsx`                | Error state and delete-account confirmation              |             Yes | Split responsibilities into `StatusDialog` and `AlertDialog`                 |
| `components/modals/WalletTopUpModal.tsx`           | Wallet amount form                                       |             Yes | Migrate to standard form dialog/mobile sheet                                 |
| `components/modals/Editphonemodal.tsx`             | Phone editing form                                       |             Yes | Rename and migrate to standard form dialog                                   |
| `components/modals/Verifyphonemodal.tsx`           | OTP verification and nested success state                |             Yes | Rename and migrate after status-dialog support                               |
| `components/modals/LicenseModal.tsx`               | License upload form                                      |             Yes | Migrate to standard form dialog                                              |
| `components/modals/PaymentMethodModal.tsx`         | Payment selection                                        |             Yes | Migrate to standard selection dialog/mobile sheet                            |
| `components/modals/InsufficientBalanceModal.tsx`   | Low-balance alert                                        | No import found | Verify with product; remove if unused, otherwise migrate to `AlertDialog`    |
| `components/modals/PickupTypeModal.tsx`            | Pickup mode selection                                    |             Yes | Migrate with the selection-dialog wave                                       |
| `components/modals/CountryModal.tsx`               | Searchable country selection                             |             Yes | Pilot migration candidate                                                    |
| `components/modals/BranchModal.tsx`                | Searchable branch selection                              |             Yes | Migrate with the selection-dialog wave                                       |
| `components/modals/AirportModal.tsx`               | Searchable airport selection                             |             Yes | Migrate with the selection-dialog wave                                       |
| `components/modals/StationModal.tsx`               | Searchable station selection                             |             Yes | Migrate with the selection-dialog wave                                       |
| `components/modals/MapLocationModal.tsx`           | Google Maps location selection                           |             Yes | Migrate as a large/full-screen dialog; validate nesting                      |
| `components/modals/BookingDailyModal.tsx`          | Daily booking form and nested map flow                   |             Yes | Migrate after the base module and map dialog are stable                      |
| `components/modals/EditDailyBookingModal.tsx`      | Thin edit-mode adapter for daily booking                 |             Yes | Keep temporarily; reassess after booking migration                           |
| `components/modals/BookingConfirmModal.tsx`        | Booking review/terms step                                |             Yes | Migrate as a large scrollable dialog                                         |
| `components/modals/BookingModal.tsx`               | Older booking form                                       | No import found | Verify and remove instead of migrating if obsolete                           |
| `components/modals/BookingMonthlyModal.tsx`        | Monthly booking form                                     | No import found | Confirm product roadmap; remove or migrate only if monthly booking will ship |
| `components/modals/ExtendDurationModal.tsx`        | Booking-duration editor                                  |             Yes | Migrate to standard form dialog                                              |
| `components/modals/CancelBookingModal.tsx`         | Destructive booking confirmation                         |             Yes | Migrate to `AlertDialog` with explicit destructive action                    |
| `components/modals/Bookingreviewmodal.tsx`         | Submit booking rating/review                             |             Yes | Rename and migrate to standard form dialog                                   |
| `components/modals/ReviewsModal.tsx`               | Read reviews                                             | No import found | Consolidate/delete after usage verification                                  |
| `components/car-details/ReviewsModal.tsx`          | Exact duplicate read-reviews dialog                      | No import found | Consolidate/delete after usage verification                                  |
| `components/car-details/StationAndAirportInfo.tsx` | Inline branch-list dialog                                |             Yes | Extract its dialog content and migrate to the shared shell                   |

### Explicitly outside this migration

- `components/common/DateTimePicker.tsx`: anchored popover, not a modal dialog.
- `components/filters/FilterPanel.tsx`: responsive filter drawer; it may later share a lower-level overlay primitive, but should not be forced into the dialog interface now.
- Visual image overlays such as the `Why` section scrim.

## 6. Planned module structure

The names below describe the intended structure; they are not implemented yet.

```text
src/components/common/Dialog/
  Dialog.tsx
  DialogHeader.tsx
  DialogBody.tsx
  DialogFooter.tsx
  DialogClose.tsx
  DialogTitle.tsx
  DialogDescription.tsx
  dialog.types.ts
  index.ts

src/components/common/AlertDialog/
  AlertDialog.tsx
  index.ts

src/components/common/StatusDialog/
  StatusDialog.tsx
  index.ts

src/styles/components/
  _dialog.scss
```

`main.scss` remains the entry point and source of truth by importing `_dialog.scss`. Generated `main.css` must never be edited directly.

### Base `Dialog` interface

Keep the root interface small:

| Input             | Requirement                | Purpose                                             |
| ----------------- | -------------------------- | --------------------------------------------------- |
| `open`            | Required                   | Controlled visibility                               |
| `onClose`         | Required                   | Single close request callback                       |
| `children`        | Required                   | Composed domain content                             |
| `size`            | Optional; default `md`     | `sm`, `md`, `lg`, `xl`, or `fullscreen`             |
| `placement`       | Optional; default `center` | `center` or `bottom-sheet`                          |
| `closeOnEscape`   | Optional; default `true`   | Override only for blocking workflows                |
| `closeOnBackdrop` | Optional; default `true`   | Override only for blocking workflows                |
| `initialFocusRef` | Optional                   | Explicit first focus target when needed             |
| `className`       | Optional                   | Domain styling hook on the surface, not the overlay |

Use composed pieces for header, title, description, body, footer, and close. Avoid a root interface containing domain-specific options such as icons, confirm labels, prices, maps, timers, or payment variants.

Every dialog must include either a `Dialog.Title` or an explicit accessible label. `Dialog.Description` should automatically connect to the dialog surface when present.

### Specialized adapters

Build specialized adapters only where multiple real callers need the same behavior:

- `AlertDialog`: confirmation with primary, secondary, and destructive action variants.
- `StatusDialog`: success/error presentation with optional action and optional auto-close.

Do not immediately create a highly generic `SelectionDialog<T>`. First migrate at least two selection dialogs using the base module, identify the truly repeated structure, and only then extract a selection layout. This avoids a shallow generic interface full of render callbacks and filtering options.

## 7. Behavior contract

The shared module must enforce the following invariants.

### Accessibility

- Render `role="dialog"` and `aria-modal="true"` through the internal adapter.
- Associate title and description IDs automatically.
- Move focus into the dialog on open.
- Trap Tab and Shift+Tab within the topmost dialog.
- Restore focus to the trigger when the dialog closes.
- Ensure close buttons have localized accessible labels.
- Allow Escape only on the topmost dismissible dialog.
- Keep background content unavailable to assistive technology while a modal dialog is open.

### Interaction

- Backdrop dismissal occurs only when the backdrop itself is activated.
- Clicking or dragging inside the surface never dismisses it.
- Blocking forms can disable backdrop dismissal without disabling an explicit close action unless the product flow requires it.
- Destructive actions must be visually and semantically distinct.
- A busy submit state must prevent duplicate submission in the domain dialog, not in the base shell.

### Scroll and stacking

- Scroll lock must be reference-counted or provided by the adapter so nested dialogs cannot unlock the page prematurely.
- Each dialog must portal to `document.body`.
- Only the topmost layer handles Escape and outside interaction.
- Opening `MapLocationModal` over `BookingDailyModal` must preserve booking form state and return focus to the map trigger after closing.

### Responsive presentation

- Centered surfaces on desktop.
- Optional bottom-sheet presentation on small screens for selection, payment, wallet, and status dialogs.
- Full-screen or near-full-screen presentation for the map and long booking forms.
- Respect safe-area insets and mobile viewport height.
- Keep header and footer actions reachable while only the body scrolls for long dialogs.
- Disable nonessential animation under `prefers-reduced-motion`.

## 8. Styling plan

1. Create semantic base selectors such as dialog backdrop, surface, header, body, footer, title, description, and close control.
2. Define size and placement modifiers in the shared SCSS partial.
3. Use existing design tokens for color, radius, spacing, shadow, and actions.
4. Preserve existing domain classes inside dialog bodies during the first migration pass.
5. Keep legacy `.modal_overlay` and old surface selectors until their final consumer is migrated.
6. Remove inline dialog layout styles, especially from `BookingMonthlyModal`, if that module is retained.
7. Remove legacy selectors only after repository-wide searches confirm zero call sites.
8. ~~Establish a canonical SCSS build command.~~ Done (2026-10-04): Next compiles `main.scss` directly; `css:sync-office` was removed ([docs/08](docs/08-styles-and-scss.md)).
9. ~~Decide whether `main.css.map` remains committed.~~ Done: `main.css` and `main.css.map` were deleted and are ignored.

## 9. State ownership and flow rules

- Feature modules continue to own their workflow state.
- The base `Dialog` module must not know about booking steps, OTP steps, payment methods, map fields, or redirects.
- Preserve existing domain interfaces during the shell migration so parent call sites do not all change at once.
- Rename `Modal` files to `Dialog` only after behavior is migrated; keep temporary re-export aliases if needed to split the rename from the behavior change.
- Prefer one state machine value for multi-step flows instead of multiple booleans when only one dialog should be active.

### Flows that require integration coverage

- Home search: country → pickup type → branch or map; airport/station → map.
- Car booking: booking details → confirmation → payment → success.
- Booking editing: edit booking → success.
- Account phone: edit phone → OTP verification → success.
- Wallet: top-up → success or failure.
- Booking details: extend, edit, cancel, and review.
- Authentication: login → OTP → register → success.

## 10. Phased implementation plan

### Phase 0 — Baseline and dead-code verification

- Capture desktop/mobile screenshots and keyboard behavior for each referenced dialog family.
- Record current close behavior: close button, Escape, and backdrop.
- Confirm whether the five unreferenced candidates are intentionally dormant:
  - `BookingModal.tsx`;
  - `BookingMonthlyModal.tsx`;
  - `InsufficientBalanceModal.tsx`;
  - both `ReviewsModal.tsx` files.
- Delete confirmed dead files in a separate change before migration.
- Add a dialog migration checklist to pull requests.

Exit condition: every retained dialog has an owner, expected behavior, and reference screenshot.

### Phase 1 — Build the shared module

- Add the approved dialog dependency.
- Implement the base `Dialog` module and its composed pieces.
- Add the shared SCSS partial and canonical stylesheet build command.
- Add unit tests for the behavior contract.
- Document one minimal usage example beside the module.

Exit condition: the module passes accessibility, focus, dismissal, scroll-lock, nested-layer, RTL, and responsive tests without migrating production dialogs yet.

### Phase 2 — Pilot and selection dialogs

- Pilot with `CountryModal` because it is small and currently renders without a portal.
- Pilot a second implementation style with `WalletTopUpModal`, which currently owns portal and scroll-lock code.
- Migrate `PickupTypeModal`, `BranchModal`, `AirportModal`, and `StationModal`.
- Extract and migrate the inline branches dialog from `StationAndAirportInfo`.
- After at least two selection migrations, decide whether a small shared selection layout earns its interface.

Exit condition: the Home search chain works with keyboard, pointer, RTL, and mobile bottom-sheet presentation.

### Phase 3 — Account, payment, and status dialogs

- Migrate `LicenseModal`, `EditPhoneModal`, `PaymentMethodModal`, and retained low-balance behavior.
- Build `StatusDialog` from the repeated success/failure presentation.
- Split `FailedModal` destructive confirmation into `AlertDialog`.
- Migrate `SuccessModal` behavior while preserving redirect and auto-close semantics.
- Migrate `VerifyPhoneModal` after `StatusDialog` is available.

Exit condition: phone, wallet, upload, payment, success, error, and destructive confirmation flows work without nested scroll/focus regressions.

### Phase 4 — Booking utility dialogs

- Migrate `ExtendDurationModal`.
- Migrate `CancelBookingModal` to `AlertDialog`.
- Rename and migrate `Bookingreviewmodal`.
- Consolidate the read-only reviews implementation if product confirms it is needed.
- Migrate `MapLocationModal` and validate geolocation permission, autocomplete, loading, and error states.

Exit condition: booking-detail actions and the standalone map dialog meet the shared behavior contract.

### Phase 5 — Complex booking flow

- Migrate `BookingDailyModal` using a large/full-screen responsive size.
- Verify nested map behavior before changing `BookingConfirmModal`.
- Migrate `BookingConfirmModal` with a fixed header/footer and scrollable body.
- Retain `EditDailyBookingModal` as a compatibility adapter during the wave.
- If monthly booking is retained, migrate it only after the daily flow is stable.
- Reassess whether `EditDailyBookingModal` still provides useful leverage; remove it if it only forwards props with no meaningful invariant.

Exit condition: dates → map → confirmation → payment → success and edit-booking flows pass integration tests.

### Phase 6 — Authentication and final cleanup

- Replace the React-Bootstrap shell inside `AuthModal` while preserving its step state.
- Remove direct React-Bootstrap dialog usage.
- Review whether the `react-bootstrap` dependency can be removed. (Removed 2026-10-05: nothing imported it.)
- Remove remaining `createPortal`, body-overflow effects, Escape listeners, and overlay click handlers from domain dialogs.
- Remove unused `.modal_overlay` and legacy surface styles.
- Normalize filenames and exported names from inconsistent `*modal` casing to `*Dialog`.
- Update project documentation and the migration inventory.

Exit condition: repository searches find no legacy dialog shell implementation outside the shared module.

## 11. Verification strategy

### Base module tests

- Closed dialogs render no interactive surface.
- Open dialogs render in a portal.
- Title and description relationships are valid.
- Focus enters the dialog and cycles within it.
- Focus returns to the opener.
- Escape closes only when enabled.
- Backdrop interaction closes only when enabled.
- Surface interaction never closes the dialog.
- Scroll remains locked until the last stacked dialog closes.
- Only the topmost nested dialog responds to Escape.
- Reduced-motion mode removes nonessential animation.

### Per-dialog checks

- Required fields and disabled actions behave exactly as before.
- Submitting fires once.
- Close behavior matches the baseline unless an accessibility defect is intentionally fixed.
- Long content remains scrollable with visible actions.
- Arabic RTL and English LTR layouts are both verified.
- Mobile widths are tested with the on-screen keyboard where forms are involved.

### Integration checks

- Home selection flow.
- Booking and editing flows.
- Wallet result flow.
- Phone verification flow.
- Authentication flow.
- Nested booking/map flow.

Recommended tooling during implementation:

- React Testing Library and `user-event` for interaction behavior;
- `axe` integration for automated accessibility checks;
- Playwright for keyboard, focus, nested dialog, and responsive flow coverage;
- visual regression screenshots for desktop and mobile.

## 12. Migration rules

1. Migrate behavior first; rename files afterward.
2. Keep each migration wave small enough to review and revert independently.
3. Do not edit generated `main.css` by hand.
4. Do not add domain-specific props to the base dialog interface.
5. Do not move form state into the shared shell.
6. Do not retain duplicate close, portal, scroll-lock, or Escape logic in migrated domain dialogs.
7. Do not migrate confirmed dead code.
8. Add tests before removing legacy behavior.
9. Complete one flow end-to-end before starting another complex flow.
10. Remove legacy SCSS only after the last caller is migrated.

## 13. Definition of done

- All retained dialogs use the shared `Dialog` module.
- No domain dialog imports `createPortal` directly.
- No domain dialog writes `document.body.style.overflow`.
- No domain dialog registers its own Escape listener.
- No duplicate review-dialog implementation remains.
- Every dialog has an accessible title or label.
- Focus trap and focus restoration work for every dialog.
- Nested dialog flows keep correct focus and scroll state.
- RTL, LTR, desktop, and mobile behaviors are verified.
- Legacy `.modal_overlay` and obsolete dialog SCSS are removed.
- SCSS has a single documented build path to generated CSS.
- Dead dialog modules and unused dependencies are removed.

## 14. Suggested delivery slices

1. Foundation: dependency, shared module, SCSS pipeline, and tests.
2. Selection dialogs and Home flow.
3. Account/payment/status dialogs.
4. Booking utility dialogs and map.
5. Complex booking flow.
6. Authentication, renames, dependency cleanup, and legacy-style removal.

Each slice should include its own behavior tests, screenshots, and updated checklist entries.
