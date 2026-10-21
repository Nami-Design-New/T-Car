# 9. Form control and validation

> **Status (2026-10-18):** fractions 1 (auth sign-in and registration), 2
> (profile save, change/verify phone), 3 (license upload), 4 (wallet top-up / withdrawal), and 5 (bank-account add / edit) are implemented;
> `zod` and `@hookform/resolvers` are installed. License images must declare
> JPG or PNG and be no larger than 5 MB; the same schema runs in the client and
> Server Action. Wallet amounts use the flow-provided minimum and maximum; the top-up maximum is the current mock contract and withdrawal rechecks the current withdrawable balance. Shared rules live in
> `shared/lib/validation.ts`. Progress and the
> assumptions still open are in the [migration status](README.md#what-remains).
> Every migrated form renders its fields with the shared controls
> (`shared/ui/Form`, `PhoneField`, `OtpInput`), which take a translated `error`
> and wire `aria-invalid` / `aria-describedby`; other forms move over in their
> own fractions.

## 9.1 Policy

Use **React Hook Form (RHF)** and **Zod** for every form that accepts
user-entered data and submits a mutation, registration, or message. RHF owns
client state and accessible feedback; Zod defines the typed payload. The Server
Action parses the same schema before calling a service. Client validation is
never a security boundary.

Do not use RHF merely because a control is interactive. URL filters, search
boxes, option pickers, and button-only confirmations have a smaller validation
need and are deliberately excluded below.

- Keep `react-hook-form` (currently `^7.53.0`). Add compatible `zod` and
  `@hookform/resolvers`, plus the lockfile, with the first approved code
  fraction.
- Put a schema in `features/<feature>/validation.ts`, beside the model and
  actions. It is client safe: no React, I/O, translated messages, API response
  types, or server-only adapters. Export `z.infer<typeof schema>` if needed.
- Do not create a global schema catalogue. Promote a domain-free refinement,
  such as normalized E.164 phone input, only after a second feature needs it.

## 9.2 Standard contract

1. One Zod object schema defines a submitted payload. Normalize only predictable
   presentation input (trim text; normalize IBAN casing) before parsing.
2. The client uses `useForm({ resolver: zodResolver(schema), mode: 'onBlur',
   reValidateMode: 'onChange' })`. Use `register` for native controls and
   `Controller` only for controlled PhoneField, RadioCards, calendar, or map
   widgets.
3. The Server Action calls `schema.safeParse(input)` before service access.
   A parse failure returns validation `AppError` / `ActionResult` field-error
   keys; it never trusts a successful client parse.
4. The client maps returned field errors with RHF `setError`. A non-field
   error (availability changed, insufficient balance, rate limit, or network
   failure) is inline. A failed dialog remains open with its input.
5. Zod messages never appear directly to users. Map issues to `errors.*` keys
   in both locale files. The existing `fieldErrors` contract carries those
   keys over the Server Action; see [doc 3](03-error-handling.md#4-forms).

Submit buttons use the shared `Button`, with `loading` while the action is
pending (spinner, `disabled`, `aria-busy`); a submit that needs complete input
(such as the OTP) also passes `disabled`.

Shared controls must receive `required`, `aria-invalid`,
`aria-describedby`, and an error id. Native attributes (`type="email"`,
`min`, `max`, `accept`, `required`) remain progressive enhancement, not
the authoritative rule.

## 9.3 Inventory

| Surface | Decision | Validation and authority |
| --- | --- | --- |
| Auth sign-in (phone, OTP) | RHF + Zod | Normalized supported phone and exact OTP digits/length on client and action. Account, code, session, and resend rate limit are server rules. |
| Auth registration | RHF + Zod | Trimmed name, email syntax, birth date, and accepted terms. Legal minimum age and country eligibility require product/legal confirmation. |
| Profile save; change/verify phone | RHF + Zod | Profile, phone, and OTP rules above. Preserve server-managed fields; verification and uniqueness stay server-side. |
| License upload | RHF + Zod | File selected, declared type, and documented size. The action rechecks size and actual content/type; scanning, retention, and limits need a security/product contract. |
| Wallet top-up / withdrawal | RHF + Zod | Finite amount with flow-provided min/max. Balance, daily limits, and sufficient funds are server rules that can change after opening. |
| Bank-account add/edit | RHF + Zod | Chosen bank id and normalized Saudi IBAN syntax/length. Ownership, duplicates, supported banks, and checksum policy stay server-defined; do not invent a checksum rule. |
| Contact message | RHF + Zod | Name, email, supplied reason enum, message; optional booking number constrained when present. Product must set lengths, abuse controls, and rate limits. |
| Join-us dialog | No validation implementation yet | It prevents submission and has no action. Add RHF/Zod only with an approved write contract, recipient, retention policy, success state, and field limits. |
| Daily booking create/edit | RHF + Zod when submitted | Valid ordered, non-past date range; known time slot; bounded notes; pickup/drop-off only after product decides whether they are mandatory. Availability, price, duration, and service area are server rules. |
| Booking terms and payment | RHF + Zod checkout step | Terms must be true before payment; one known payment method required. Provider eligibility, wallet balance, and payment result are server/provider rules. Never collect card data without an approved provider contract. |
| Booking review | RHF + Zod | Rating integer 1-5; optional bounded review. Completion/one-review eligibility is server authorization. |
| Booking extend/edit/cancel | Schema only for entered values | Date/range follows booking rules. A button-only cancellation has no RHF form; action enforces authorization, cutoff, and fees. |
| Car/city filters, range, sort, hero search | URL parsing, not RHF | Parse known enums, finite prices, `min <= max`, and bounded trimmed query before navigation and in server queries. Ignore/default invalid state rather than showing field errors. |
| Rental-search option and map pickers | Controlled selection, not RHF | Selection id must be displayed; coordinates finite. Validate availability and serviceability when the server consumes it. |
| Delete-account/bank, confirmations, notification toggles | No form validation | No user-entered field. Require explicit confirmation and pending state; Server Actions authorize and handle conflicts. |

## 9.4 Decisions still required

Do not encode these rules from mock behavior. Agree and document the feature
service contract first: rental age and valid birth-date range; supported phone
countries and stored canonical format; license inspection, scanning, and
retention; IBAN verification level; length/moderation/rate limits for messages,
notes, and reviews; booking address/service-area, availability, duration, and
terms-version policies; and payment-provider eligibility.

## 9.5 Delivery criteria

Each feature fraction needs schema boundary and normalization tests; component
tests for blur feedback, error association, keyboard submission, pending state,
and preserved values after failure; action tests rejecting malformed input
without the browser; `errors.*` entries in both locales; and LTR, RTL, and
keyboard-only smoke coverage. Start with auth, then profile/phone, wallet, bank
accounts, contact, booking, and reviews.
