import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import {
  publicServerHttp,
  serverHttp,
  tokenServerHttp,
} from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import {
  toOnboardingStep,
  type AuthGrant,
  type AssignLocationInput,
  type AuthUser,
  type CompleteProfileInput,
  type ProfileStepResult,
} from "./model";

export interface AuthApi {
  /**
   * Sends a one-time login code to the phone (WhatsApp) and resolves with the
   * backend's message. `phone` is the normalized national number.
   */
  requestOtp(phone: PhoneFieldValue): Promise<string>;
  /**
   * Verifies the code and returns the customer's token. A new number gets an
   * account and a token at once, with `onboardingStep: 'register'`. A wrong or expired
   * code is a `validation` AppError with the backend's message.
   */
  verifyOtp(phone: PhoneFieldValue, code: string): Promise<AuthGrant>;
  /**
   * Saves the new customer's profile with the token issued at verification
   * (there is no session until this succeeds). A 422 carries the backend's
   * message; a revoked token is `unauthorized`.
   */
  completeProfile(
    input: CompleteProfileInput,
    accessToken: string,
  ): Promise<ProfileStepResult>;
  /** Saves the customer's location (the `location` step) with the session's token. */
  assignLocation(input: AssignLocationInput): Promise<ProfileStepResult>;
  /** Revokes the session token; an already revoked token is also success. */
  logout(): Promise<string>;
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

/** `POST /complete-profile` body. */
export interface CompleteProfileBody {
  name: string;
  email: string;
  /** YYYY-MM-DD; the backend requires an age of at least 18. */
  birth_date: string;
}

/** `POST /assign-location` body. */
export interface AssignLocationBody {
  latitude: number;
  longitude: number;
  address_name: string;
  region: string;
}

/** `data` of a successful `/complete-profile` (and `/assign-location`). No new token. */
export interface ProfileStepData {
  user: UserDto;
  current_step: OnboardingStepDto;
}

function isProfileStepData(value: unknown): value is ProfileStepData {
  return (
    isRecord(value) &&
    isUserDto(value.user) &&
    isNullableString(value.current_step)
  );
}

/** Maps a profile-step response (`/complete-profile`, `/assign-location`). */
function toProfileStepResult(response: unknown): ProfileStepResult {
  if (!isApiEnvelope(response) || !isProfileStepData(response.data)) {
    throw new AppError("server");
  }
  const { user, current_step } = response.data;
  return {
    user: toAuthUser(user),
    onboardingStep: toOnboardingStep(current_step, Boolean(user.name)),
    message: response.message,
  };
}

/** The success message of a write whose `data` the app does not read. */
function messageOf(response: ApiEnvelope<unknown>): string {
  if (!isApiEnvelope(response)) throw new AppError("server");
  return response.message;
}

const httpAuthApi: AuthApi = {
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

  async completeProfile({ fullName, email, birthDate }, accessToken) {
    const body: CompleteProfileBody = {
      name: fullName,
      email,
      birth_date: birthDate,
    };
    return toProfileStepResult(
      await tokenServerHttp(accessToken).post<ApiEnvelope<unknown>>(
        "/complete-profile",
        body,
      ),
    );
  },

  async assignLocation({ latitude, longitude, addressName, region }) {
    const body: AssignLocationBody = {
      latitude,
      longitude,
      address_name: addressName,
      region,
    };
    return toProfileStepResult(
      await serverHttp.post<ApiEnvelope<unknown>>("/assign-location", body),
    );
  },

  async logout() {
    try {
      return messageOf(await serverHttp.post<ApiEnvelope<unknown>>("/logout"));
    } catch (error) {
      if (error instanceof AppError && error.kind === "unauthorized") return "";
      throw error;
    }
  },
};

// Every auth call is live; `api.mock.ts` is for tests only (no mock flag).
export const authApi: AuthApi = httpAuthApi;
