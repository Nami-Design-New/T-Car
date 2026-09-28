# Wallet Implementation Plan

Status: phases 1–4 implemented on mock data. Phases 5 and 6 are not started.

## Progress

| Phase | State | Notes |
| ----- | ----- | ----- |
| 1 — Types and data layer | Done | `WalletSummary`, `BankAccount`, `withdraw` type; `WalletTransaction.date` replaced by an ISO `createdAt`, and the unused `title` removed. Mocks live in `src/data/wallet.ts`; `src/services/wallet.service.ts` works on an in-memory copy of them |
| 2 — Wallet tab UI | Done | New balance card, breakdown, history rows, and empty state. `formatAmount` and `formatTransactionDate` added to `utils` |
| 3 — Top-up hardening | Done | `WalletTopUpModal` became `WalletAmountModal` (min/max, validation, loading). The unused `SuccessModal` `variant` prop was removed |
| 4 — Withdraw flow | Done | `BankSelectModal`, then the amount step, then the result. `WalletSection` owns the flow; `useWallet()` owns the data |
| 5 — Wallet as payment method | Not started | |
| 6 — Mobile screen | Not needed yet | On mobile the account sidebar turns into a horizontal tab bar, so no back button is needed |

Defaults used for the open questions in section 5 (revisit when product answers):

- Withdraw has an amount step: min 10 SAR, max equal to the withdrawable balance.
- There is no add-bank-account screen. With no accounts, the sheet shows an empty message.
- Top-up goes straight to the result, with no payment gateway.
- Top-ups count as withdrawable balance.
- Amounts show no `+`/`-` sign; the row tint shows the direction.
- The mock service rejects top-ups above 10,000 SAR so the failure state can be tested.

The compiled CSS is updated with `npm run css:sync-office`. The script now splices a list of blocks: office rows, wallet sheets, and wallet panel.

## 1. Target design

The design has one wallet screen and four bottom sheets.

### Wallet screen (`المحفظة`)

- Header with the title `المحفظة` and a back button (mobile).
- Balance card:
  - `اجمالي الرصيد` label with icon and the total balance (`2,500` + SAR icon).
  - Two actions side by side: `إضافة رصيد` (primary, filled) and `اسحب رصيد` (outline).
  - Breakdown row with two figures:
    - `رصيد قابل للسحب` — withdrawable balance (`15,000`).
    - `رصيد غير قابل للسحب` — non-withdrawable balance (`5,000`).
- `سجل الرصيد` — transaction history. Each row shows the type, date/time, amount with the SAR icon, and the `#reference`. There are four row types, each with its own tint:

  | Type       | Label     | Row tint |
  | ---------- | --------- | -------- |
  | `topup`    | شحن       | blue     |
  | `refund`   | استرداد   | neutral  |
  | `payment`  | دفع       | red      |
  | `withdraw` | سحب       | green    |

### Sheets

1. **Top-up** (`اشحن المحفظة`): amount input with the SAR icon, the hint `الحد الأدنى 10 ريال`, and a `شحن` submit button.
2. **Top-up success** (`تمت الشحن بنجاح`): green success state.
3. **Top-up failure** (`فشل في عملية الشحن`): red error state.
4. **Bank selection** (`اختر البنك`): list of the user's saved bank accounts (bank logo, bank name, masked account number). This starts the withdraw flow.

### Flows

```
Top-up:    إضافة رصيد → اشحن المحفظة → success | failure → back to wallet (list refreshed)
Withdraw:  اسحب رصيد → اختر البنك → [amount step — see open questions] → success | failure
```

## 2. Current state

| Area | File | State | Gap against the design |
| ---- | ---- | ----- | ---------------------- |
| Wallet tab | [WalletTab.tsx](src/components/account/WalletTab.tsx) | Exists | Single `شحن الرصيد` button; no withdraw button; no withdrawable/non-withdrawable breakdown; label is `رصيدك` instead of `اجمالي الرصيد`; no `withdraw` row type; row layout differs (reference and date are joined on one line) |
| Balance formatting | [utils/index.ts](src/utils/index.ts) | Bug | `formatCurrency` defaults to `en-US`/`USD`, so the balance renders as `$2,500.00` next to the SAR icon. The design shows `2,500` |
| Top-up sheet | [WalletTopUpModal.tsx](src/components/modals/WalletTopUpModal.tsx) | Exists, matches design | The `min` attribute is `1` while the hint says 10 SAR, so validation and copy disagree; no loading state or submit-disabled state |
| Success state | [SuccessModal.tsx](src/components/common/SuccessModal.tsx) | Exists | `variant="wallet-topup"` is accepted but never used in the markup |
| Failure state | [FailedModal.tsx](src/components/common/FailedModal.tsx) | Exists | Default title is hard-coded to the top-up failure, so withdraw needs an explicit `title` |
| Bank selection sheet | — | Missing | New component needed |
| Withdraw flow | — | Missing | No state, handler, or result handling |
| Types | [types/car.ts](src/types/car.ts) | Partial | `WalletTransaction['type']` lacks `withdraw`; no balance summary or bank account types |
| Data | [account/page.tsx](src/app/[locale]/account/page.tsx) | Mock only | Balance (`2500`) and transactions are inline mocks; the top-up result is faked with `amount >= 10`; there is no wallet service |
| Payment modal | [PaymentMethodModal.tsx](src/components/modals/PaymentMethodModal.tsx) | Hard-coded | Wallet balance is a literal `500` |
| Low balance | [InsufficientBalanceModal.tsx](src/components/modals/InsufficientBalanceModal.tsx) | Unused | Not imported anywhere; it was meant for "pay with wallet, balance too low" |
| Assets | `src/assets` | Partial | Missing the icons for total, withdrawable, and non-withdrawable balance, and bank logos |

All wallet copy is hard-coded Arabic, like the rest of the account area. This plan keeps that. Moving the account area to `next-intl` is a separate task.

## 3. Implementation plan

### Phase 1 — Types and data layer

1. In [types/car.ts](src/types/car.ts):
   - Add `'withdraw'` to `WalletTransaction['type']`.
   - Add a balance summary type:
     ```ts
     export interface WalletSummary {
       total: number;
       withdrawable: number;
       nonWithdrawable: number;
     }
     ```
   - Add a bank account type:
     ```ts
     export interface BankAccount {
       id: string;
       bankName: string;
       logo: StaticImageData | string;
       maskedNumber: string; // e.g. "45 67 89"
     }
     ```
2. Add `src/services/wallet.service.ts`, following the pattern in [cars.service.ts](src/services/cars.service.ts). It needs `getWallet()` (summary and transactions), `getBankAccounts()`, `topUp(amount)`, and `withdraw({ bankAccountId, amount })`. Until the backend endpoints exist, return mock data from `src/data/wallet.ts` so the page code does not change when the API is connected.
3. Move `MOCK_TRANSACTIONS` out of [account/page.tsx](src/app/[locale]/account/page.tsx) into `src/data/wallet.ts`. Add one row of each of the four types, plus mock bank accounts.

### Phase 2 — Wallet tab UI

1. Fix currency display. Add an amount formatter (for example `formatAmount(value)` → `Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })`) and use it with the SAR icon everywhere in the wallet. Do not change the defaults of `formatCurrency`, because other callers may rely on them.
2. Change the props of `WalletTab`:
   ```ts
   interface Props {
     summary: WalletSummary;
     transactions: WalletTransaction[];
     onTopUp: () => void;
     onWithdraw: () => void;
   }
   ```
3. Rebuild the balance card to match the design: the `اجمالي الرصيد` label, the total, the two action buttons (`إضافة رصيد` primary, `اسحب رصيد` outline), and the two-column breakdown.
   - Disable `اسحب رصيد` when `summary.withdrawable === 0`.
4. Rebuild the history rows: the label and date on one side; the amount with the SAR icon and the `#reference` on the other.
   - Add `withdraw: 'سحب'` to `TYPE_LABELS`.
   - Show amounts without the `+`/`-` sign; the row tint shows the direction. Confirm this with design.
5. Add an empty state for when there are no transactions. Reuse the `non_data.json` Lottie that other screens already use.
6. Update the `.account-panel .wallet_*` rules in [main.scss](src/styles/main.scss) (around line 8164):
   - Add styles for the button row, breakdown row, and `withdraw` row.
   - Retint the rows (`topup` blue, `refund` neutral, `payment` red, `withdraw` green) using the `$ds-*` tokens, following [DESIGN_SYSTEM_MIGRATION.md](DESIGN_SYSTEM_MIGRATION.md).
   - Run `npm run css:sync-office` if the compiled CSS must be updated.
7. Add the missing icons to `src/assets/icons`.

### Phase 3 — Top-up flow hardening

1. In [WalletTopUpModal.tsx](src/components/modals/WalletTopUpModal.tsx):
   - Add a `MIN_TOP_UP = 10` constant and use it for both `min` and the hint.
   - Disable the submit button while the value is below the minimum.
   - Accept a `loading` prop so the button can show progress while the request runs.
2. In [account/page.tsx](src/app/[locale]/account/page.tsx):
   - Replace the fake `amount >= 10` check with `await walletService.topUp(amount)`.
   - Show success or failure based on the result.
   - Refetch the wallet on success.
3. Remove the unused `variant` prop from `SuccessModal`, or implement it if the wallet success state needs different styling.

### Phase 4 — Withdraw flow (new)

1. Create `src/components/modals/BankSelectModal.tsx` (`اختر البنك`).
   - Copy the sheet structure of `WalletTopUpModal`: overlay, drag handle, header with close button, portal.
   - Props: `open`, `accounts: BankAccount[]`, `onClose`, `onSelect(account)`.
   - Render each account as a selectable card with the logo, bank name, and masked number, using radio semantics like `PaymentMethodModal`.
   - Add an empty state with an "add bank account" action if the product needs one (see open questions).
2. Add the amount step. The recommended approach is to generalize `WalletTopUpModal` into a `WalletAmountModal` with `title`, `submitLabel`, `min`, and `max` props:
   - Top-up: `اشحن المحفظة` / `شحن` / min 10.
   - Withdraw: `اسحب الرصيد` / `سحب` / max `summary.withdrawable`.

   This avoids a second, nearly identical sheet.
3. Keep the page state as one discriminated union instead of several booleans, so only one sheet can be open at a time:
   ```ts
   type WalletFlow =
     | { step: 'idle' }
     | { step: 'topup-amount' }
     | { step: 'withdraw-bank' }
     | { step: 'withdraw-amount'; account: BankAccount }
     | { step: 'result'; kind: 'topup' | 'withdraw'; ok: boolean };
   ```
4. Show results with `SuccessModal` and `FailedModal`, passing titles for each kind:
   - Top-up: `تمت الشحن بنجاح` / `فشل في عملية الشحن`.
   - Withdraw: `تم السحب بنجاح` / `فشل في عملية السحب`.
5. Once the flow works, move the wallet state out of the page into a `useWallet()` hook (`src/hooks/useWallet.ts`) that owns the summary, transactions, loading state, `topUp`, and `withdraw`. The account page is already large.

### Phase 5 — Wallet as a payment method

1. Pass the real wallet balance into [PaymentMethodModal.tsx](src/components/modals/PaymentMethodModal.tsx) instead of the literal `500`.
2. In [CarBookingCard.tsx](src/components/car-details/CarBookingCard.tsx) `handlePay`: if the chosen method is `wallet` and the balance is below the booking total, open `InsufficientBalanceModal`. Its `اشحن الآن` button opens the top-up sheet, which is where `useWallet()` pays off.
3. If the product does not want this, delete `InsufficientBalanceModal` as [DIALOG_MIGRATION_PLAN.md](DIALOG_MIGRATION_PLAN.md) proposes.

### Phase 6 — Mobile screen

The design is a mobile screen with its own header (`المحفظة` and a back button). Check how the account page shows tabs on mobile. If the sidebar collapses, add a wallet panel header with a back action that returns to the tab list. The sheets already use the bottom-sheet style (drag handle).

## 4. Relation to the dialog migration

[DIALOG_MIGRATION_PLAN.md](DIALOG_MIGRATION_PLAN.md) plans a shared `Dialog` module and lists `WalletTopUpModal`, `SuccessModal`, and `FailedModal` for migration. That module does not exist yet, so:

- Build `BankSelectModal` and `WalletAmountModal` with the same structure and class naming as the current sheets, and keep each sheet's content separate from its shell code (portal and scroll lock) so it moves to `Dialog` with little change.
- Add `BankSelectModal` to the inventory table in the dialog plan.
- If the `Dialog` module lands first, build the new sheets on it directly.

## 5. Open questions (product/design)

1. **Withdraw amount**: after choosing a bank, does the user enter an amount, or is the full withdrawable balance withdrawn? The design has no amount step for withdrawal.
2. **Adding a bank account**: where does the user add or manage bank accounts (IBAN entry)? `اختر البنك` only lists existing ones.
3. **Withdraw result copy**: is it confirmed as `تم السحب بنجاح` / `فشل في عملية السحب`? Is a withdrawal instant or "pending review"? If it is pending, it needs its own state and history label.
4. **Top-up payment**: does `شحن` send the user to a payment gateway (card, Apple Pay) before the result? If it does, the result sheet appears after the gateway redirect, not straight after submit.
5. **Non-withdrawable balance**: what makes up this balance (refunds, promo credit)? Should it have an info tooltip?
6. **History**: are pagination or filters needed? Should tapping a row open a booking or receipt?
7. **Amount sign**: should history amounts show `+` or `-`, or does the row color alone show direction?

## 6. Suggested delivery slices

1. Types, mock data, the wallet service, and the currency formatting fix.
2. Wallet tab redesign: balance card, breakdown, history rows, and styles.
3. Top-up flow wired to the service, with validation and loading state.
4. `BankSelectModal`, the amount step, and the withdraw flow with its results.
5. `useWallet()` extraction and wallet balance in the payment modal / insufficient balance.
6. Mobile header polish and removal of dead code (unused props and modals).

## 7. Definition of done

- The wallet tab matches the design in RTL, on desktop and mobile.
- The balance shows no `$` and no forced decimals.
- Top-up and withdraw both reach the success and failure states and then refresh the balance and history.
- Only one wallet sheet is open at a time. Closing any sheet returns to the wallet with the scroll lock released.
- The withdraw button is disabled when the withdrawable balance is 0, and a withdrawal cannot exceed it.
- No hard-coded balance remains in the payment modal.
- `npm run lint` and `npm run build` pass.
