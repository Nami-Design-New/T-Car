import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import {
  toOnboardingStep,
  type AuthGrant,
  type AuthUser,
  type RegistrationInput,
} from "./model";
import { authMock } from "./api.mock";

export interface AuthApi {
  /**
   * Sends a one-time login code to the phone (WhatsApp) and resolves with the
   * backend's message. `phone` is the normalized national number.
   */
  requestOtp(phone: PhoneFieldValue): Promise<string>;
  /**
   * Verifies the code and signs the customer in. A new number gets an account
   * and a token at once, with `onboardingStep: 'register'`. A wrong or expired
   * code is a `validation` AppError with the backend's message.
   */
  verifyOtp(phone: PhoneFieldValue, code: string): Promise<AuthGrant>;
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

/** `POST /auth/verify-otp` body. */
export interface VerifyOtpBody extends RequestOtpBody {
  otp: string;
}

/** `current_step`; `null` is seen for existing users (Auth-API.md Q3). */
export type OnboardingStepDto = "register" | "location" | "completed" | null;

/** The user in auth responses (Auth-API.md §4.2). Only the checked fields are read. */
export interface UserDto {
  id: number;
  name: string | null;
  phone: string;
  phone_code: string;
  email: string | null;
  birth_date: string | null;
  latitude: string | null;
  longitude: string | null;
  region: string | null;
  address_name: string | null;
  lang: string;
  balance: number;
  withdrawable_balance: number;
  non_withdrawable_balance: number;
  created_at: string;
}

/** `data` of a successful `POST /auth/verify-otp`. `token` is a bearer credential: server only. */
export interface VerifyOtpData {
  user: UserDto;
  token: string;
  new_user: boolean;
  current_step: OnboardingStepDto;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNullableString = (value: unknown) =>
  value === null || typeof value === "string";

/** Checks the fields sign-in reads; balances and profile details are ignored. */
function isUserDto(value: unknown): value is UserDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.phone === "string" &&
    typeof value.phone_code === "string" &&
    isNullableString(value.name) &&
    isNullableString(value.email)
  );
}

function isVerifyOtpData(value: unknown): value is VerifyOtpData {
  return (
    isRecord(value) &&
    isUserDto(value.user) &&
    typeof value.token === "string" &&
    value.token !== "" &&
    typeof value.new_user === "boolean" &&
    isNullableString(value.current_step)
  );
}

function toAuthUser(user: UserDto): AuthUser {
  return {
    id: String(user.id),
    name: user.name ?? "",
    phone: `${user.phone_code}${user.phone}`,
    email: user.email ?? undefined,
  };
}

/** The success message of a write whose `data` the app does not read. */
function messageOf(response: ApiEnvelope<unknown>): string {
  if (!isApiEnvelope(response)) throw new AppError("server");
  return response.message;
}

const httpAuthApi: Pick<AuthApi, "requestOtp" | "verifyOtp"> = {
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

  async verifyOtp({ countryCode, phone }, code) {
    const body: VerifyOtpBody = {
      phone,
      phone_code: countryCode,
      otp: code,
      otp_type: "login",
    };
    const response = await publicServerHttp.post<ApiEnvelope<unknown>>(
      "/auth/verify-otp",
      body,
    );
    if (!isApiEnvelope(response) || !isVerifyOtpData(response.data)) {
      // Never log the response: `data.token` grants API access.
      throw new AppError("server");
    }
    const { user, token, current_step } = response.data;
    return {
      accessToken: token,
      user: toAuthUser(user),
      onboardingStep: toOnboardingStep(current_step, Boolean(user.name)),
    };
  },
};

// Wired endpoint by endpoint (A4–A7 in docs/api/Auth-API.md): OTP request and
// verification are live; registration stays on the mock until A6. Once all
// are live the mock stays for tests only (no mock flag). Callers stay unchanged.
export const authApi: AuthApi = { ...authMock, ...httpAuthApi };
