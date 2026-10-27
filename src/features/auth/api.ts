import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import type { AuthGrant, RegistrationInput } from "./model";
import { authMock } from "./api.mock";

export interface AuthApi {
  /**
   * Sends a one-time login code to the phone (WhatsApp) and resolves with the
   * backend's message. `phone` is the normalized national number.
   */
  requestOtp(phone: PhoneFieldValue): Promise<string>;
  /**
   * Signs an existing customer in. Throws a `validation` AppError with code
   * `auth.invalidCode` for a wrong code, and a `conflict` AppError with code
   * `auth.registrationRequired` when the phone has no account yet.
   */
  verifyOtp(phone: string, code: string): Promise<AuthGrant>;
  /** Creates the account for a verified phone and signs it in. */
  register(input: RegistrationInput): Promise<AuthGrant>;
}

/** `login` signs in or creates the account; `change_phone` verifies a new number. */
export type OtpType = "login" | "change_phone";

/** `POST /auth/request-otp` body (docs/api/Auth-API.md §4.2). */
export interface RequestOtpBody {
  /** National digits, e.g. "544444442". */
  phone: string;
  /** "+966"; one of `GET /countries`. */
  phone_code: string;
  otp_type: OtpType;
}

/** The success message of a write whose `data` the app does not read. */
function messageOf(response: ApiEnvelope<unknown>): string {
  if (!isApiEnvelope(response)) throw new AppError("server");
  return response.message;
}

const httpAuthApi: Pick<AuthApi, "requestOtp"> = {
  async requestOtp({ countryCode, phone }) {
    const body: RequestOtpBody = {
      phone,
      phone_code: countryCode,
      otp_type: "login",
    };
    return messageOf(
      await publicServerHttp.post<ApiEnvelope<unknown>>(
        "/auth/request-otp",
        body,
      ),
    );
  },
};

// Wired endpoint by endpoint (A4–A7 in docs/api/Auth-API.md): OTP request is
// live; verification and registration stay on the mock until A5 / A6. Once all
// are live the mock stays for tests only (no mock flag). Callers stay unchanged.
export const authApi: AuthApi = { ...authMock, ...httpAuthApi };
