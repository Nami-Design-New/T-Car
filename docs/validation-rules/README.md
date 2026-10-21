# T-Car validation rules: user application plan

Status: **Fraction 1 implemented and verified; Fraction 2 not started**. This
document maps the supplied workbook to the customer-facing user application
and divides the work into six fractions.

Source: [T-Car_Final_Validation_Rules.xlsx](./T-Car_Final_Validation_Rules.xlsx),
sheet `Validation Rules`.

## Scope decisions

- This plan covers the user application only. Driver and dashboard rules are
  ignored.
- The user application has no password or confirm-password flow. Those
  workbook rows are not applicable.
- The user application has no License Class or Insurance Policy fields. Those
  rows, including Deductible Percentage, are ignored.
- Full names may contain non-Latin characters. The applicable rule is a
  trimmed value with a 2–100 character bound; the implementation must not use
  an ASCII-only name regex.
- The phone API will provide country and storage context later. For now the
  frontend enforces the workbook's 8–15 digit length only.
- The user license upload remains required and keeps the currently implemented
  JPG/PNG and size checks.
- The frontend validates the IBAN syntax supplied by the workbook. Backend
  services remain authoritative for ownership, duplicates, bank availability,
  persistence, and other account controls.
- A workbook row is planned only when a user-facing field exists. Rows with no
  current user field are recorded as ignored, not invented as new inputs.
- Server authorization, ownership, availability, uniqueness, rate limits,
  file inspection, and persistence remain server rules.

## User-facing workbook map

| Workbook field | User surface | User-app treatment |
| --- | --- | --- |
| Full Name | Account profile and registration | Include. Trim and require 2–100 characters; allow Arabic and other non-Latin names. |
| Email | Account profile and registration | Include. Validate email syntax; uniqueness remains server-side. |
| Phone Number | Sign-in, registration, change-phone, verification | Include. Enforce 8–15 digits for now; obtain country and storage rules from the API later. |
| Image Upload | Account license upload | Include for the existing required upload field. Keep the implemented JPG/PNG and size checks; scanning and retention remain service concerns. |
| IBAN | Bank-account add/edit | Include. Normalize spaces/case and validate the Saudi 24-character syntax in the frontend; backend controls the other account checks. |
| Description / Notes / Comment | Existing user forms only | Include only where a current user form has this field. Apply 0–500 only after the owning form confirms its requiredness and moderation policy. |
| Address | User booking/rental forms | Include only where the current user form collects a map address. |
| City | User location/rental forms | Include only where the current user form collects a predefined city. |
| Country | User location/rental forms | Include only where the current user form collects a predefined country. |
| Rental Type | User rental search/booking | Include only when the current user form exposes the workbook values. |
| Pickup Method | User rental search/booking | Include only when the current user form exposes branch or delivery. |
| Airport / Station / Country | User rental search/booking | Include only when conditional on the selected rental and pickup method. |
| Pickup Date | User rental search/booking | Include when collected; require a valid date. |
| Pickup Time | User rental search/booking | Include when collected; working/delivery-hour availability stays server-side. |
| Return Date | User rental search/booking | Include when collected; require it to follow pickup date. |
| New Return Date | User booking edit | Include only if the current user edit form exposes it; booking availability remains server-side. |

## Ignored workbook rows

The following rows are not part of the current user validation plan because
they are driver/dashboard data, display-only or pricing rules, or have no
current user-facing field:

| Ignored rows |
| --- |
| Password; Confirm Password; License Class; Insurance Policy; Deductible Percentage; Account Number; Fuel Type; Doors; Price; Free KM; Extra KM Price; Percentage; Delay Hours; Subscription Duration; Discount Type; Discount Amount; Discount Percentage; Offer Date Type; Free Days; Private Delivery Range |

If a later user feature adds one of these fields, add it to that feature's
plan first. Do not implement it under account because it appears in the shared
workbook.

## Six implementation fractions

Each fraction is a separate implementation commit after the code, tests, and
verification are complete.

### Fraction 1: Profile identity

Scope: Full Name and Email in profile save and registration.

- Use one shared schema boundary for profile and registration.
- Trim Full Name and enforce 2–100 characters while accepting non-Latin
  scripts and spaces.
- Keep email syntax validation in the client and action; keep uniqueness and
  verification server-side.
- Test blank, one-character, 2/100/101-character, whitespace, Arabic/non-Latin,
  punctuation, and malformed-email cases.
- Add localized field errors and preserve values after a failed save.

Status: **implemented and verified**. Both profile and registration use the
approved Unicode-safe name rule and their server actions re-parse the same
payload.

### Fraction 2: Phone and verification

Scope: Phone Number in sign-in, registration, change-phone, and OTP flows.

- The approved interim rule is 8–15 digits only. The API will provide country,
  separators, canonical storage, and normalization rules later.
- Keep OTP length, expiry, resend limits, and account ownership server-side.
- Test minimum/maximum boundaries, separators, letters, empty input, resend, and
  action rejection.

Exit criteria: every user phone entry point uses one shared 8–15 digit rule
without inventing country or storage behavior before the API contract exists.

### Fraction 3: License image upload

Scope: the existing user license upload field only.

- Keep the required declared JPG/PNG and currently implemented size limit.
- Do not add License Class, Insurance Policy, or Deductible Percentage fields.
- Define actual image inspection, malware scanning, retention, replacement, and
  deletion at the service boundary.
- Test no file, invalid type, size boundaries, and a failed submit that keeps
  the dialog open with the selected file.

Exit criteria: the user upload is required, the frontend/action agree on its
JPG/PNG and size checks, and backend security controls remain authoritative.

### Fraction 4: Bank-account IBAN

Scope: IBAN in the user bank-account add/edit form.

- Validate the IBAN in the frontend: trim/remove spaces, uppercase, require the
  `SA` prefix, allowed characters, and exactly 24 characters.
- Do not add Account Number because there is no current user field for it.
- Keep bank availability, ownership, duplicate detection, persistence, and any
  additional account checks server-side.
- Test spaces/case normalization, wrong prefix, 23/25 characters, invalid
  characters, missing bank, and failed action responses.

Exit criteria: the user bank-account form has one approved IBAN payload and
never treats backend ownership or checksum failures as client success.

### Fraction 5: User booking and location fields

Scope: only the workbook fields that are present in current user booking,
rental-search, contact, or booking-edit forms.

- Apply the 0–500 bound to Notes/Comment only where that field exists and after
  its form confirms the requiredness and moderation policy.
- Validate map Address and predefined City/Country selections only when those
  controls exist in the user flow.
- Validate Rental Type, Pickup Method, conditional Airport/Station/Country,
  Pickup Date/Time, Return Date, and New Return Date only in forms that expose
  them.
- Keep availability, service area, working hours, booking conflicts, duration,
  and authorization server-side.
- Do not create controls merely because a row exists in the shared workbook.

Exit criteria: each existing user form owns its schema and action boundary;
absent workbook rows remain ignored.

### Fraction 6: User-only enforcement and inventory closure

Scope: shared delivery rules and final workbook reconciliation.

- Keep each schema in the owning user feature and re-parse every write in its
  Server Action or service boundary.
- Use localized `errors.*` keys, map field errors back to RHF, and keep failed
  forms open with their values.
- Mark every non-user, absent, or display-only workbook row as ignored rather
  than implementing it in account.
- Run typecheck, lint, build, focused tests, production smoke, and the status
  document update for each later fraction.

Exit criteria: every workbook row is implemented by an existing user field or
explicitly ignored. No driver/dashboard rule is introduced into the user app.

## Decisions recorded

1. Phone validation is temporarily length-only: 8–15 digits. Country support,
   separators, canonical storage, and normalization will come from the API.
2. The 2–100 full-name rule applies to registration and profile editing, and
   accepts non-Latin names.
3. License upload remains required with the currently implemented JPG/PNG and
   size checks. License Class, Insurance Policy, and Deductible Percentage stay
   excluded.
4. IBAN syntax is validated in the frontend. Backend services own the other
   bank-account checks and persistence.

## Decision 4: choosing optional user booking fields

The workbook includes fields that may belong to user booking or rental-search
forms but are not account fields. Before adding them, review each current user
screen and answer:

| Question | Decision to make |
| --- | --- |
| Does the screen render the field? | If no, keep the workbook row ignored. |
| Is the value typed, selected, or derived? | Validate typed input locally; validate selected IDs against server-owned options; do not validate display-only values as form input. |
| Is it always required? | Define the requiredness by rental type and pickup method instead of using a global required flag. |
| Is there a business dependency? | Keep availability, service area, working hours, booking conflicts, price, and authorization on the backend. |
| Does the field have a product limit? | Record the limit and error key before adding the schema. Do not invent a value for `Values` or `T-Car source`. |

Candidates for this review are Notes/Comment, Address, City, Country, Rental
Type, Pickup Method, Airport/Station/Country, Pickup Date/Time, Return Date,
and New Return Date. This review decides ownership and requiredness; it does
not add any new user controls.

## Related documentation

- [Form control and validation](../09-form-validation.md)
- [Migration status](../README.md#migration-status)
- [Account routes flow](../account-routes-flow.md)
