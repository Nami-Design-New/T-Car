# Profile API feature

Last updated: 2026-10-29
Base URL: `https://t-car.app/api/user` (provided by the user; live calls verified).
Status: six endpoint success paths observed; profile reads, edits, change-phone OTP, license upload, and deletion are integrated (P1-P7). Live mutation smoke checks remain pending for phone verification, license upload, and deletion.

Sources: Bruno `tcar/User Application/Setting/{profile,updateProfile,deleteAccount,addLicense,requestOtp,verifyOtp}.yml`, parent folder authentication, existing account/auth code, and live requests on 2026-10-28.

> `docs/api/` is ignored by Git, like [Auth-API.md](Auth-API.md). This file stays local. Tokens, customer values, and uploaded asset paths are omitted. The user authorized edits, a synthetic license upload, phone-change OTP testing, and deletion of the disposable account. No application API configuration was changed during documentation work.

## 1. Rules the integration follows

| # | Rule |
| - | ---- |
| R1 | Reuse the envelope-aware HTTP client. Observed successes: HTTP 200/body code 200. Observed validation errors: HTTP 200/body code 422, data null. Missing/revoked credentials on protected endpoints: HTTP 401/body code 401. HTTP 401 and 5xx take priority under the existing transport policy. |
| R2 | Show backend success and validation messages through `useNotify()`. Keep translated `errors.*` for other failures. Preserve inputs and keep dialogs open on validation failure. Observed errors contain a message, not a structured field-error map. |
| R3 | Use server-only `serverHttp` for authenticated account calls. It reads the token from the NextAuth JWT cookie and supplies `Authorization: Bearer ...`. Never accept an account ID or token from client input to select the customer. |
| R4 | Account OTP requests must use `otp_type: "change_phone"`. Existing login API methods use `login` and `publicServerHttp`; do not call those methods unchanged. |
| R5 | Account owns `features/account/api.ts` and its test mock `api.mock.ts`; only HTTP transport remains shared. Move first without behavior change, then integrate in fractions. Keep `index.ts` client-safe. |
| R6 | Upload actual file bytes using FormData. Let fetch generate multipart content type and boundary. Preserve shared authorization, locale, timeout, and error handling. |
| R7 | Distinguish observations from guarantees. One successful disposable-account deletion does not establish all deletion restrictions. PNG success does not establish every supported MIME type or maximum size. |

Headers: `Accept: application/json`, `Accept-Language: en | ar`, and bearer authorization. Set `Content-Type: application/json` for JSON requests only. Bruno inherits bearer auth for all six requests. Actual bearer enforcement for change-phone OTP remains partly untested: unauthenticated empty OTP requests reached validation, which does not prove a valid request can succeed without auth.

## 2. Endpoints

| Endpoint | Method | Body | Observed success data | Existing app caller |
| -------- | ------ | ---- | --------------------- | ------------------- |
| `/profile` | GET | none | `{ user: ProfileUserDto }` | `features/account/queries.ts:getProfile` |
| `/update-profile` | PUT | `name`, `email`, `birth_date` | `{ user: UpdatedProfileUserDto }`; license omitted | `saveProfileAction` |
| `/delete-account` | DELETE | none | `null` | `deleteAccountAction` |
| `/license` | POST | multipart file field `license` | `LicenseDto` | `uploadLicenseAction` |
| `/auth/request-otp` | POST | `phone`, `phone_code`, `otp_type: "change_phone"` | `null` | `sendPhoneCodeAction` (send/resend) |
| `/auth/verify-otp` | POST | same fields plus `otp` | `{ user: ProfileUserDto }`; no token | `verifyPhoneAction` |

All paths are relative to the new base URL. No account ID appears in these paths or request bodies.

## 3. Observed response shapes

### 3.1 `GET /profile`

HTTP 200/body code 200. `data` wraps the profile under `user`.

English message: `Profile retrieved successfully.`
Arabic message: `تم جلب الملف الشخصي بنجاح.`

Structural example (values redacted; placeholders indicate observed types):

```json
{
  "data": {
    "user": {
      "id": "<number>",
      "name": "<string>",
      "phone": "<string>",
      "email": "<string>",
      "phone_code": "<string>",
      "birth_date": "<string>",
      "license": null,
      "latitude": "<string>",
      "longitude": "<string>",
      "region": "<string>",
      "address_name": "<string>",
      "lang": "<string>",
      "balance": "<number>",
      "withdrawable_balance": "<number>",
      "non_withdrawable_balance": "<number>",
      "created_at": "<string>"
    }
  },
  "message": "Profile retrieved successfully.",
  "code": 200
}
```

Before upload, `license` was null. After upload it was a LicenseDto object. Nullability of the other fields for incomplete accounts is not established by this completed account. Auth responses already permit some null fields; confirm profile behavior before narrowing guards. Exact date formatting was not separately recorded by the redacted probe.

### 3.2 `PUT /update-profile`

```json
{
  "name": "Example Customer",
  "email": "customer@example.com",
  "birth_date": "1995-06-15"
}
```

Observed success: HTTP 200/body code 200, `data: { user: ... }`, message `Profile updated successfully.`. The returned user has the profile fields listed above **except license**. Re-read `/profile` or preserve the existing license state; do not interpret this omission as a removed license.

| Probe | HTTP | Body code | Observed message / behavior |
| ----- | ---- | --------- | --------------------------- |
| Empty object | 200 | 422 | `The name field is required.` |
| Empty object, Arabic | 200 | 422 | `حقل الاسم مطلوب.` |
| Name of one character | 200 | 422 | `The name field must be at least 2 characters.` |
| Name of 101 characters | 200 | 422 | `The name field must not be greater than 100 characters.` |
| Invalid email | 200 | 422 | `The email address must be a valid email address.` |
| Birth date `2020-01-01` | 200 | 200 | Accepted, despite being under 18 on the test date |
| Valid name edit | 200 | 200 | Updated profile returned; subsequent GET succeeded |

Original profile fields were restored after successful mutation probes. **Do not copy the 18-year registration rule into profile editing as an established backend requirement.** `/complete-profile` and `/update-profile` behaved differently in the recorded tests. Missing email/birth date, uniqueness, partial updates, and future dates remain untested.

### 3.3 `DELETE /delete-account`

No request body. Confirm the user's intention in the UI before calling it.

Observed success:

```json
{
  "data": null,
  "message": "Account deleted successfully.",
  "code": 200
}
```

HTTP 200. Immediately afterward, GET `/profile` with the same token returned HTTP 401/body code 401 and `Unauthorized. Please log in.`. Clear the local NextAuth session after successful deletion. Do not treat 401 as proof that deletion succeeded.

Active bookings, balances, pending withdrawals, soft deletion, reversibility, and other-session revocation were not tested. The current mock rejects the seeded account with active bookings; that is a mock rule, not a confirmed backend contract.

### 3.4 `POST /license`

Multipart body uses the field `license`. A synthetic 1?1 PNG named `api-contract-test.png` was accepted; this was a test fixture, not a customer's document.

HTTP 200/body code 200, message `License saved successfully.`:

```json
{
  "data": {
    "id": "<number>",
    "user_id": "<number>",
    "license": "<string>",
    "created_at": "<string>"
  },
  "message": "License saved successfully.",
  "code": 200
}
```

The following profile read returned this object under `data.user.license`. No approval/review state appeared in the observed object. File reference is a string; absolute URL versus relative-path handling still needs confirmation.

Missing file: HTTP 200/body code 422/data null. English: `The license file is required.` Arabic: `صورة الرخصة مطلوبة.` JPEG support, maximum bytes, invalid content, empty files, replacement behavior, and review policy were not tested. The existing frontend allows JPEG/PNG up to 5 MiB; these are frontend rules pending backend confirmation.

Implementation gaps:

- The shared client supports FormData without setting a JSON content type, and `AccountApi.uploadLicense` accepts a real `File`.
- The Server Action size limit is 16 MB, leaving room for multipart framing beyond the UI's 15 MiB file limit.

### 3.5 `POST /auth/request-otp` (change phone)

Synthetic request example:

```json
{
  "phone": "500000001",
  "phone_code": "+966",
  "otp_type": "change_phone"
}
```

For the user-designated number, the authenticated request returned HTTP 200, `{ data: null, message: "OTP has been sent successfully.", code: 200 }`.

| Probe | HTTP | Body code | Message |
| ----- | ---- | --------- | ------- |
| Missing number, English | 200 | 422 | `The phone number is required.` |
| Missing number, Arabic | 200 | 422 | `رقم الجوال مطلوب.` |
| Seven national digits | 200 | 422 | `The phone number must be 8 to 15 digits only.` |
| Sixteen national digits | 200 | 422 | `The phone number must be 8 to 15 digits only.` |

Send and resend use the same collection request; resend throttling was not tested. Existing-number conflicts, normalization of leading zeros, delivery channel, expiry, and attempt limits remain unconfirmed. The collection includes comments after JSON; send only the JSON object from the application.

### 3.6 `POST /auth/verify-otp` (change phone)

```json
{
  "phone": "500000001",
  "phone_code": "+966",
  "otp": "1234",
  "otp_type": "change_phone"
}
```

The actual probe used the user-designated number and the code supplied by the user. Success returned HTTP 200/body code 200, `data: { user: ProfileUserDto }`, and the message `Profile retrieved successfully.`. There was **no token, new_user, or current_step** in the observed response.

A follow-up GET using the original bearer token succeeded and confirmed that `phone` and `phone_code` matched the requested new number. Thus this observed phone change did not require token replacement or a new login. Do not use the login grant response mapper for this endpoint.

Missing number: HTTP 200/body code 422 with the same localized messages as request-OTP. Number provided but missing OTP: HTTP 200/body code 422, `The verification code is required.`. Wrong/expired codes, reused codes, and duplicate numbers were not tested. Success with the user-provided `1234` does not establish a universal bypass code.

### 3.7 Missing credentials and common errors

GET `/profile`, PUT `/update-profile`, POST `/license`, and DELETE `/delete-account` without bearer credentials all returned HTTP 401:

```json
{
  "data": null,
  "message": "Unauthorized. Please log in.",
  "code": 401
}
```

Unauthenticated OTP requests with empty bodies returned validation (`phone required`), not 401. Their checks may occur in a different order. Authenticated `change_phone` success was verified; valid unauthenticated phone-change requests were not sent.

All observed 422 errors had `data: null`, `message`, and `code`, without an `errors` map. 5xx, timeouts, rate limits, and successful Arabic mutation messages were not probed.

## 4. DTOs, mapping, and integration gaps

### 4.1 Request DTOs

```ts
interface UpdateProfileBody {
  name: string;
  email: string;
  birth_date: string;
}
interface ChangePhoneRequestBody {
  phone: string;
  phone_code: string;
  otp_type: 'change_phone';
}
interface ChangePhoneVerifyBody extends ChangePhoneRequestBody {
  otp: string;
}
interface LicenseDto {
  id: number;
  user_id: number;
  license: string;
  created_at: string;
}
// Upload body: FormData containing a real File under 'license'.
// Profile and phone verification: ApiEnvelope<{ user: ProfileUserDto }>.
// Update: user response without license; use a distinct DTO/guard.
// Request OTP and deletion: ApiEnvelope<null>.
// License upload: ApiEnvelope<LicenseDto>.
```

Create profile DTOs and runtime guards in the account feature using section 3.1. Confirm nullability before treating one observed account as the complete schema. Do not reuse auth's narrow user guard for additional profile fields that it does not validate.

### 4.2 UI mapping

| Domain field | Wire field | Mapping |
| ------------ | ---------- | ------- |
| `fullName` | `user.name` | Direct after nullability handling is agreed |
| `email` | `user.email` | Direct after nullability handling is agreed |
| `birthDate` | `user.birth_date` | Confirm/normalize to input's YYYY-MM-DD format |
| `phone` | `user.phone_code`, `user.phone` | Keep separate during OTP forms; combine for display |
| `licenseUploaded` | `user.license` | Null means absent; object means a stored upload, not proven approval |

The current phone-change form preserves `{ countryCode, phone }` through send and resend and shares the login validation: 8-15 national digits after leading-zero removal, with distinct minimum/maximum messages. The legacy edit modal still uses a combined string. P5 sends the structured number to the live verification endpoint and uses its returned phone.

Account profile editing shares the registration schema and its specific name-length messages.

### 4.3 Session and persisted data

The NextAuth session exposes ID, name, phone, email, and onboarding step. Fetch birth date and license state from `/profile`.

- After profile edit, update session name/email from the backend result using the existing server helper, and refresh the profile read. Avoid dropping license because update responses omit it.
- After verified phone change, P5 updates session phone from the confirmed returned user and refreshes the profile. No token rotation was observed.
- After upload, refresh license state from the response or profile query. Do not claim review approval based on file presence.
- After successful deletion, sign out locally and leave protected routes. Backend revocation of the supplied token was observed.

`features/account/api.ts` owns the account contract. The server query now reads
the live profile and maps its `data.user` payload to `UserProfile`; phone OTP
requests, verification, and license uploads are live; deletion still uses its mock.
`saveProfileAction` sends only the three editable fields. Delete action results
still need their live endpoint mapping and backend messages carried through
`ActionResult` for toasts.

## 5. Proposed fractions and progress

Documentation and live contract probes are complete for successful calls. Integration is on `feature/profile-api-integration`; one fraction per local commit, with explicit approval each time.

| # | Fraction | Done when | Status |
| - | -------- | --------- | ------ |
| P0 | Inspect contracts | Requests and success/error observations recorded; remaining gaps explicit | Six success paths verified; edge cases remain |
| P1 | Move account API/mock | Feature-owned files; existing callers updated without behavior change | Complete (2026-10-28) |
| P2 | Read profile | Guard and map real profile; handle 401 and errors | Complete (2026-10-28) |
| P3 | Edit profile | PUT editable fields; preserve license; update session and localized messages | Committed in c4a6d5a; authenticated same-values edit and app form verified; license preserved (2026-10-29) |
| P4 | Send/resend phone OTP | Structured number and authenticated change_phone request | Committed in 1f1f0aa; authenticated backend and app OTP request verified; P5 verification unavailable (2026-10-29) |
| P5 | Verify phone | Map user response; update profile/session phone only after success | Implemented; production build and authenticated profile read passed; live OTP verification pending |
| P6 | Upload license | Multipart transport, real file bytes, limits, refreshed stored-upload state | Implemented; focused tests, typecheck, lint, build, and profile-route smoke passed; live upload smoke pending |
| P7 | Delete account | Confirmation, error handling, backend deletion then local sign-out | Implemented; focused tests, typecheck, lint, build, and profile-route smoke passed; live deletion smoke pending |
| P8 | Status documentation | README reflects integrated operations and remaining gaps | Complete (2026-10-29); remaining live mutation smoke checks recorded |

Follow repository checks: typecheck, lint, focused tests, build, production server page checks, and stop the server afterward. Account mutations need disposable test data. The token used for this inspection is now invalid after the approved deletion.

## 6. Product decisions and remaining questions

Decisions supplied by the user on 2026-10-28. The live backend is the contract;
mock behavior must not be used to invent backend requirements. The observations
in section 3 remain a record of the actual responses; the additional frontend
rules below describe the intended application behavior.

- Reuse the app's existing response/error handling and backend-message toasts.
  The backend will correct its message text later.
- Require full name, email, and birth date. Send dates as `YYYY-MM-DD`, as in
  Bruno. This requirement concerns editable fields; it does not make the observed
  null license or every additional profile response field non-null.
- Profile editing uses the registration form's design, flow, and validation:
  name length 2-100 with specific messages, valid required email, and a valid
  birth date with minimum age 18. Validate again in the Server Action. This is an
  application requirement even though the probed update endpoint accepted an
  under-18 date. Reuse the registration rules rather than letting them diverge.
- Display the stored license in the license modal. Use the same modal to select
  and upload a replacement. Additional backend file-type/size constraints will
  be supplied later (Q5); do not claim the existing frontend limits are confirmed
  backend requirements.
- Phone-change and OTP dialogs follow the login/registration design. Send OTP,
  then allow resend after 30 seconds. The UI timer does not establish the
  backend's expiry or rate-limit policy; show backend rejections normally.
- Phone verification does not rotate the token. Keep the existing session and
  update its phone from the verified backend user response.
- Verify only the new phone number; do not add an old-number verification step.
- Keep the account-deletion confirmation, then call the backend. Add no frontend
  eligibility restrictions for bookings or balances; handle the backend response.
- Remove leading zeros for now, matching login/registration (`0544444442` becomes
  `544444442`). Apply the same normalization to send, resend, and verification.

These decisions guide the remaining fractions; license and deletion writes remain on their mocks.

| # | Question | Evidence / remaining work |
| - | -------- | ------------------------- |
| Q1 | Response shapes and status codes? | Use the app's existing transport and error handling. Six success paths recorded. |
| Q2 | Required fields and date format? | User confirmed required editable fields and Bruno's YYYY-MM-DD format. License remains nullable as observed. |
| Q3 | Profile validation? | User requires the registration design/flow and same validation, including age 18, even though the update endpoint accepted an under-18 value. |
| Q4 | Existing license and replacement? | Show the existing license in the upload modal and replace it through that same modal. Review status is not inferred from upload presence. |
| Q5 | License types and size limits? | Deferred by the user; additional backend constraints will be supplied later. |
| Q6 | Does changing phone require an OTP on the old number too? | Resolved: verify the new number only. Use the authenticated account flow; no old-number verification step. |
| Q7 | OTP flow and resend? | User specifies login/registration design and a 30-second resend cooldown. Backend expiry, attempt limits, and duplicate-number errors remain backend-managed. |
| Q8 | Token rotation after phone change? | User confirms no rotation; consistent with the live probe. Update the session phone while keeping its token. |
| Q9 | Who decides account-deletion eligibility? | Resolved: the backend response decides. Add no frontend eligibility restrictions or mock-derived rules. Keep confirmation and handle success/failure normally. |
| Q10 | Messages? | Display backend messages using the existing app convention. Backend will correct the text later. |
| Q11 | Preserve or strip leading zeros? | Resolved: remove leading zeros for now, matching login/registration. Validate the normalized national number and use it consistently for send, resend, and verify. |

### Additional authenticated smoke evidence (2026-10-29)

The supplied token returned HTTP 200 / body code 200 for `/profile`; its
account had null name, email, and birth date, indicating an incomplete
profile. The current profile read guard expects strings for those fields;
an artificial completed session with this token returned a streamed error.
The normal sign-in flow does not start a session before profile completion.
No profile data was written. Empty update and phone OTP requests each
returned HTTP 200 / body code 422. One authenticated change-phone OTP
request to the user-designated test number returned HTTP 200 / body code
200, null data, and a message. Verification was not attempted. Successful
profile editing and an authenticated app flow remain to be checked with a
completed disposable profile.

## 7. Live probe history and side effects

Earlier attempts against `https://t-car.ahmedmostafa.online/api/user` failed during TLS negotiation in Python, Node, and Windows curl, before HTTP. The user then supplied `https://t-car.app/api/user`, where HTTPS and authentication succeeded. Those earlier failures did not establish anything about token validity.

On 2026-10-28, with the user's authorization:

1. Read profile in English and Arabic; recorded redacted field structure.
2. Checked missing-credential responses and missing-field validation.
3. Tested name length and email validation. The under-18 birth-date change succeeded and was restored. A valid name edit succeeded and original profile fields were restored.
4. Uploaded a synthetic one-pixel PNG and confirmed the profile's license object. The fixture remained attached until account deletion; storage-file cleanup after deletion was not verified.
5. Requested a phone-change OTP for the number supplied by the user, verified the user-supplied code, and confirmed the changed phone using the original token.
6. Deleted the disposable account last. The backend reported success, and the same token subsequently received 401 from `/profile`.

No bearer tokens, customer values, or file references are stored in this document. Further authenticated probes require a fresh disposable account/token.
