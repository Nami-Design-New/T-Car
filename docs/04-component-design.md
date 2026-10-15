# 4. Component design: reusable and feature components, built the Radix way

> **Status (2026-09-30):** tier 1 started. Built on Radix in `shared/ui/`, each
> tested: `Dialog`, `ConfirmDialog`, `ResultDialog`, `Tabs`, `Accordion`,
> `RadioCards`, `Menu`, plus `Button` (`loading`, `asChild`), `Price`,
> `EmptyState`, `ErrorState`, `Skeleton`. Step 1 (dialogs) is in progress:
> three dialogs migrated, the rest remain. Steps 5 to 9 not started. Component
> styles `@use` `styles/tokens/_tokens.scss`, so `main.css` is not recompiled.

> **Scope note.** "Radix method" here means the approach behind
> [Radix Primitives](https://www.radix-ui.com/primitives). Behavior and
> accessibility come from **headless, unstyled primitives**. Our own components
> wrap them with T-Car styling and expose a **compound component** API
> (`<Tabs.Root> <Tabs.List> <Tabs.Trigger> <Tabs.Content>`). They support
> `asChild` composition and are styled through `data-state` attributes. This
> matches [`DIALOG_MIGRATION_PLAN.md`](../DIALOG_MIGRATION_PLAN.md), which
> already recommends `@radix-ui/react-dialog` behind our own `Dialog` module.

## 4.1 Current state

| # | Finding | Evidence |
| - | ------- | -------- |
| C1 | **Every dialog is hand-built.** 23 dialog files plus `FailedModal` and `SuccessModal` each repeat the portal, `body.style.overflow`, overlay, and close logic. Only 7 handle Escape, **none** set `role="dialog"`, none trap focus, and `AuthModal` uses react-bootstrap instead. | `components/modals/*` |
| C2 | **Boolean-prop "god" components.** `FailedModal` is a failure notice, a confirmation, and an auto-closing toast, depending on `showButtons`, `onDone`, and `autoCloseDuration`. `SuccessModal` has `appearButton`, `autoRedirect`, `redirectTo`, and `onDone`. | `common/FailedModal.tsx`, `common/SuccessModal.tsx` |
| C3 | **The same pattern is rebuilt again and again.** Tabs: `AccountSidebar`, `BookingsTabs`, `InsuranceOptions`, `RentalTabs`. Dropdowns: `UserMenu`, `LanguageSwitcher`, booking actions. Radio cards: `PaymentMethodModal`, `PickupTypeModal`, `BankSelectModal`. Accordions: `FAQ`, `WarrantiesList`. Each has its own markup, classes, and keyboard behavior, or none at all. | — |
| C4 | **Duplicates.** `account/BookingsTab` ≡ `bookings/BookingsTab`; `CarFilters` ≈ `CityFilters`; `BookingModal` ≈ `BookingDailyModal` ≈ `EditDailyBookingModal` (three calendars); `DateTimePicker` is a fourth calendar. Four empty states and three copies of `<Lottie animationData={non_data}>`. | — |
| C5 | **No price primitive.** The "amount + SAR icon" pair is re-implemented in `CarCard`, `CarBookingCard`, `WalletTab` (`Amount`), and the booking sidebar. Other places use `formatCurrency`, which prints **USD** by default. | `utils/index.ts:formatCurrency` |
| C6 | **Shared components know domain words.** `FailedModal` defaults to top-up text. `BookingsEmptyState` links to `/cities`. | — |
| C7 | **Inconsistent file names.** `Editphonemodal`, `Bookingreviewmodal`, and `Verifyphonemodal` next to `BookingDailyModal`. Folders with `index.tsx` next to flat files. | `components/modals/` |
| C8 | **One 12,733-line SCSS file**, compiled into a committed 22,127-line `main.css`, kept in sync by a script that splices blocks by selector text. | `styles/main.scss`, `scripts/sync-office-css.mjs` |

## 4.2 Component tiers

```
Tier 0  Primitives        @radix-ui/*: behavior + a11y, unstyled.        Never imported by features.
Tier 1  shared/ui         Styled, domain-free, reusable everywhere.       Wraps tier 0.
Tier 2  feature/components  Domain components: CarCard, BookingCard.    Reusable inside the feature.
Tier 3  feature flows     Orchestrate state + actions: WalletPanel,       One per use case.
                          BookingCheckout, RentalSearch.
Tier 4  app routes        page.tsx composes tiers 2–3.
```

### Is it reusable? Decision rule

```
Does it mention a domain concept (car, booking, wallet, IBAN, showroom)?
├─ Yes → Tier 2/3 in that feature. Used by 2+ features? → export it through the feature's index.ts.
└─ No  → Is it used (or clearly going to be used) in 2+ places?
         ├─ Yes → Tier 1 shared/ui
         └─ No  → keep it local to the component that uses it (same file or folder). Promote it later.
```

Do not build a reusable component in advance "just in case". Promote a
component on its **second** real use, and not before.

### Tier 0: which Radix primitives

| Primitive | Replaces |
| --------- | -------- |
| `@radix-ui/react-dialog` | all 23 dialogs, `FailedModal`, `SuccessModal`, the branches sheet in `StationAndAirportInfo`, the mobile `FilterPanel` drawer, react-bootstrap `Modal` |
| `@radix-ui/react-tabs` | `BookingsTabs` (see [doc 5](05-performance-and-routing.md): driven by the URL), `InsuranceOptions`, the auth steps, if they are ever shown as tabs |
| `@radix-ui/react-radio-group` | `PaymentMethodModal`, `PickupTypeModal`, `BankSelectModal`, the insurance option choice, sort options |
| `@radix-ui/react-accordion` | `FAQ`, `WarrantiesList` (or native `<details>` when no animation is needed) |
| `@radix-ui/react-dropdown-menu` | `UserMenu`, booking actions menu, `LanguageSwitcher` |
| `@radix-ui/react-checkbox` | `CheckboxGroup` items, terms agreement |
| `@radix-ui/react-slider` | `PriceRangeSlider` (two thumbs, RTL, keyboard) |
| `@radix-ui/react-toggle-group` | filter chips (brand, car type), `AddonsGrid` |
| `@radix-ui/react-popover` | `DateTimePicker` panel |
| `@radix-ui/react-slot` | `asChild` on `Button` (for example `<Button asChild><Link/></Button>`) |
| `@radix-ui/react-visually-hidden` | hidden dialog titles, icon-button labels |

Install each primitive package only when its first tier-1 wrapper is built.
Radix handles RTL through its `DirectionProvider`, so set it once in the layout
from `getDirection(locale)`.

### Tier 1: the `shared/ui` inventory

| Component | API sketch | Replaces |
| --------- | ---------- | -------- |
| `Button` | `variant: primary \| secondary \| outline \| ghost \| danger`, `size`, `loading`, `asChild` | `common/Button` plus ~15 ad-hoc button classes (`wallet_topup_submit`, `auth_btn`, `save_btn`, `car-booking-card-btn`…) |
| `IconButton` | requires `aria-label` | back links, close buttons, bank edit and delete |
| `Dialog` | `Dialog.Root / Content / Header / Title / Description / Body / Footer / Close`, `size`, `presentation: 'center' \| 'sheet' \| 'fullscreen'` | see the dialog plan |
| `ConfirmDialog` | `title, description, confirmLabel, tone: 'danger' \| 'default', pending, onConfirm, onCancel` | `FailedModal` with `showButtons`, `CancelBookingModal` shell |
| `ResultDialog` | `status: 'success' \| 'error', title, description, action?, autoCloseMs?` | `SuccessModal`, `FailedModal` as a notice |
| `Tabs` | `Tabs.Root / List / Trigger / Content` + `Tabs.LinkList` (a variant whose triggers are links) | `BookingsTabs`, `InsuranceOptions` |
| `RadioCards` | `RadioCards.Root value onValueChange` / `RadioCards.Item value icon title description` | payment method, pickup type, bank select, insurance |
| `Accordion` | `Accordion.Root type=single / Item / Trigger / Content` | `FAQ`, `WarrantiesList` |
| `Menu` | `Menu.Root / Trigger / Content / Item / Separator` | `UserMenu`, booking actions, language switcher |
| `Field`, `TextField`, `SelectField`, `TextareaField`, `PhoneField` | `label, hint, error, required`; wires `id`, `aria-invalid`, `aria-describedby` | `FormInput`, `FormSelect`, `FormTextarea`, and the hand-built inputs in `ProfileTab` |
| `CheckboxGroup`, `ChipGroup`, `RangeSlider` | generic, with no filter wording | `filters/*` |
| `DatePicker`, `DateRangeCalendar` | a single calendar engine | `DateTimePicker` and the three calendars inside the booking dialogs |
| `Price` | `amount, currency='SAR', size, strike?` renders the number with the SAR icon | `Amount`, `car-card__price`, `formatCurrency` USD calls |
| `Rating` | `value, count?, size`, read-only or input | star rows in 4 places |
| `Badge` | `tone: neutral \| info \| success \| warning \| danger` | booking status chips, pickup badge |
| `Card`, `SectionTitle`, `PageHeader` (title + back) | layout pieces | `SectionTitle`, `car-page__heading`, booking header back link |
| `Carousel` | CSS scroll-snap track driven by `useCarouselRail` | `CarsRail` and `Cities` tracks, Swiper in `CarOfficeRow`, `Partners`, `Hero` |
| `EmptyState`, `ErrorState`, `Skeleton`, `Spinner` | see [doc 6](06-ui-states.md) | 4 empty states, `Loader` inline |
| `Illustration` | `name: 'empty' \| 'success' \| 'error'`, lazy Lottie | 3 direct Lottie imports |

### Tier 2 and tier 3: feature components (not reusable across the app)

These may use tier 1 freely and may be reused **inside** their feature. Examples:

| Feature | Tier 2 (presentational, domain) | Tier 3 (flow, owns state and actions) |
| ------- | ------------------------------- | ------------------------------------ |
| `cars` | `CarCard`, `OfficeRow`, `CarFiltersPanel` (one component; config decides which groups show, which replaces `CityFilters`) | `CarListing` (reads the URL, renders rows or a grid) |
| `car-details` | `CarGallery`, `CarQuickInfo`, `WarrantiesList`, `ReviewsSummary`, `PickupPointInfo` | — |
| `booking` | `BookingSummary`, `PriceBreakdown` (shared with `my-bookings` through its index) | `BookingCheckout` (dates → confirm → payment → result) |
| `my-bookings` | `BookingCard`, `BookingStatusBadge`, `BookingCountdown` | `BookingActions` (edit, extend, cancel, review) |
| `wallet` | `BalanceCard`, `TransactionList`, `AmountDialog` | `WalletPanel` (the current `WalletSection` state machine) |
| `bank-accounts` | `BankAccountList`, `BankAccountFormDialog`, `BankSelectDialog` | `BankAccountsPanel` |
| `rental-search` | `RentalTypePicker`, `BranchList`, `AirportList`, `StationList`, `CountryList`, `MapPicker` | `RentalSearch` (the hero flow as one `useReducer` state machine instead of 12 `useState`s) |

`AirportModal`, `BranchModal`, `StationModal`, and `CountryModal` share one
shape: a searchable list in a sheet. Build it once as a tier 2
`LocationListDialog<T>` inside `rental-search`, not in `shared/ui`, since it is
used only there.

## 4.3 API conventions (the Radix style)

1. **Compound components for anything with parts.** Use
   `<Dialog.Root><Dialog.Content><Dialog.Title/>…`, not
   `<Dialog title="" footer={} showClose />`. Parts share state through context.
2. **Controlled or uncontrolled.** Support `value` / `defaultValue` /
   `onValueChange` (tabs, radio, accordion) and `open` / `defaultOpen` plus the
   dialog plan's `onClose`. Our `Dialog` maps `onClose` onto Radix's
   `onOpenChange` internally. The dialog plan's naming is kept so the two plans
   agree.
3. **`asChild` over wrapper props.** `<Button asChild><Link href="/cars">…</Link></Button>`
   instead of adding `href` to `Button`.
4. **Variants as a closed union.** Use `variant` and `size` string unions, never
   boolean combinations (`isPrimary`, `isOutline`). One component should not
   need more than two or three visual props. Past that point it is probably two
   components.
5. **Style state through data attributes.** Radix sets `data-state="open"`,
   `data-state="active"`, `data-state="checked"`, and `data-disabled`. Write
   SCSS against those, not against custom `active` or `selected` classes:

   ```scss
   .tabs__trigger {
     color: $ds-text-subtle;
     &[data-state='active'] { color: $ds-action-primary; border-color: $ds-action-primary; }
     &[data-disabled] { color: $ds-text-disabled; }
   }
   ```

6. **Forward refs and spread the rest.** Every tier 1 component forwards its ref
   and spreads `...rest` onto the root element, so `aria-*`, `data-*`, and
   `className` always work.
7. **No domain text in tier 1.** Labels and default copy come from props or from
   a generic `ui.*` message namespace (for example `ui.close`, `ui.retry`).
8. **Accessibility is part of the component**, not the caller's job: labels,
   focus management, keyboard, and `aria-live` for results.

### Example: RadioCards (payment method)

```tsx
// shared/ui/RadioCards.tsx
'use client';
import * as RadioGroup from '@radix-ui/react-radio-group';

export const Root = ({ className, ...props }: RadioGroup.RadioGroupProps) => (
  <RadioGroup.Root className={cn('radio-cards', className)} {...props} />
);

export function Item({ value, icon, title, description, disabled }: ItemProps) {
  return (
    <RadioGroup.Item value={value} disabled={disabled} className="radio-cards__item">
      {icon && <span className="radio-cards__icon">{icon}</span>}
      <span className="radio-cards__text">
        <span className="radio-cards__title">{title}</span>
        {description && <span className="radio-cards__desc">{description}</span>}
      </span>
      <RadioGroup.Indicator className="radio-cards__indicator" />
    </RadioGroup.Item>
  );
}
```

```tsx
// features/booking/components/PaymentMethodDialog.tsx (tier 2)
<RadioCards.Root value={method} onValueChange={setMethod} aria-label={t('payment.method')}>
  <RadioCards.Item value="wallet" icon={<WalletIcon />} title={t('payment.wallet')}
                   description={<Price amount={balance} />} disabled={balance < total} />
  <RadioCards.Item value="visa"   icon={<CardIcon />}   title={t('payment.card')} />
  <RadioCards.Item value="tabby"  icon={<TabbyLogo />}  title="Tabby" />
  <RadioCards.Item value="tamara" icon={<TamaraLogo />} title="Tamara" />
</RadioCards.Root>
```

This gives arrow-key navigation, a single tab stop, correct `role="radio"`, and
RTL behavior, none of which the current `<input type="radio">` and `selected`
class markup provides.

## 4.4 File and naming conventions

```
shared/ui/
  Button/Button.tsx  Button.scss  Button.test.tsx  index.ts
  Dialog/Dialog.tsx  Dialog.scss  Dialog.test.tsx  index.ts
  Form/FormInput.tsx  FormSelect.tsx  FormTextarea.tsx  Form.scss  Form.test.tsx  index.ts
features/wallet/components/
  BalanceCard.tsx
  AmountDialog.tsx
```

- PascalCase file names that match the component (`EditPhoneDialog.tsx`, not
  `Editphonemodal.tsx`).
- Suffix `Dialog` for anything built on `Dialog` (drop the `Modal` name, which
  matches the dialog plan). Use `Panel` for the tier 3 container of an account
  section and `Flow` for multi-step orchestrators.
- One exported component per file. Small private subcomponents can stay in the
  same file.
- Named exports in `shared/ui`, default exports for pages only.
- **`shared/ui` folder pattern** (as built, 2026-10-04): one folder per component
  with `<Name>.tsx`, `<Name>.scss` (only if styled; starts with
  `@use 'tokens/tokens' as *;`), `<Name>.test.tsx`, and `index.ts` exporting the
  component and its props type (`export type { Props as <Name>Props }`). Closely
  related components that share styles share a folder (`Form/`, `Skeleton/`).
  Compound components (`Accordion`, `Menu`, `RadioCards`, `Tabs`: an object of
  Radix parts) export only the object; their parts are typed by Radix.
- **No root `shared/ui/index.ts`.** Each component imports its own SCSS, so a
  barrel would pull every component's CSS and JS into any importer. Import
  `@/shared/ui/<Name>`.

## 4.5 Styling

> The migration plan for this section (switching from the committed `main.css`
> to the SCSS sources, trimming Bootstrap, splitting `main.scss`) is
> [doc 8](08-styles-and-scss.md).

Class names stay global and BEM-like (`car-card__media`), as the codebase does
today, but the **source** is split:

```
styles/
  tokens/_colors.scss _spacing.scss _radius.scss _typography.scss   (from DESIGN_SYSTEM_MIGRATION)
  base/_reset.scss _typography.scss _layout.scss                    (container-tcar, section…)
  vendor/_bootstrap.scss                                            (only the partials we use)
  main.scss                                                         (@use the above + ui + features)
shared/ui/Button/Button.scss                                        (@use 'tokens' as *)
features/cars/components/CarCard.scss
```

- **Import `main.scss` directly** in the layout instead of the committed
  `main.css`. Next compiles Sass itself. Pin the exact `sass` version in
  `package.json` (for example `"sass": "1.105.0"`) so output stays stable. Then
  delete `main.css`, `main.css.map`, and `scripts/sync-office-css.mjs`. The
  sync script exists only because the compiled file is committed.
- Replace `@import` with `@use` / `@forward` as each partial is split out. That
  also removes the need for most of the `silenceDeprecations` list in
  `next.config.mjs`.
- Bootstrap: `main.scss` line 1 imports **all** of Bootstrap. Import only what
  is used (grid, utilities, reboot). Audit with a class search (`d-flex`,
  `gap-3`, `w-100`, `container`, `btn` are the common ones) before cutting.
- CSS Modules remain an option per component later. They are not required for
  this plan, and switching would touch every `className`.

## 4.6 Migration steps

1. **Dialog module first**, exactly as in
   [`DIALOG_MIGRATION_PLAN.md`](../DIALOG_MIGRATION_PLAN.md). It touches the
   most files and fixes the biggest accessibility gap. `ConfirmDialog` and
   `ResultDialog` replace `FailedModal` and `SuccessModal` in the same step.
2. **`Button`** (with `loading` and `asChild`), **`Price`**, **`Field`**, and
   **`EmptyState`/`ErrorState`/`Skeleton`**: small components with a large
   reach. Replace usages feature by feature, not all in one PR.
3. **`RadioCards`**: payment method, pickup type, bank select.
4. **`Tabs`**, **`Accordion`**, **`Menu`**: insurance tabs, FAQ, warranties,
   user menu, language switcher, booking actions. Delete `useClickOutside`
   once the menus no longer need it.
5. **Calendar consolidation:** build one `DateRangeCalendar`, then remove the
   three calendars inside `BookingModal`, `BookingDailyModal`, and
   `EditDailyBookingModal`, plus the one in `DateTimePicker`. `BookingModal` is
   already unused.
6. **Filters:** merge `CarFilters` and `CityFilters` into one `CarFiltersPanel`
   driven by a config and the URL (see [doc 5](05-performance-and-routing.md)).
   Rebuild `PriceRangeSlider` on the Radix slider.
7. **Carousel:** a single `Carousel` on `useCarouselRail`, then remove Swiper.
8. **Styles:** split `main.scss` alongside each component's migration, and
   switch the layout to import SCSS in the first styling PR.
9. **Remove** `react-bootstrap` after `AuthModal` moves to `Dialog`. Done (2026-10-05).

For every replaced component, check the same things: keyboard only (Tab,
arrows, Escape), a screen reader label, RTL and LTR, a 360px viewport, and no
visual regression against the current screen.
