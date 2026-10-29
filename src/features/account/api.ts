import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { env } from "@/shared/config/env";
import { AppError } from "@/shared/lib/errors";
import { fail, ok, type Result } from "@/shared/lib/result";
import type { PhoneFieldValue } from "@/shared/lib/phone";
import type { ProfileChanges, UserProfile } from "./model";
import { accountMock } from "./api.mock";

export interface AccountApi {
  getProfile(): Promise<UserProfile>;
  updateProfile(profile: ProfileChanges): Promise<Result<ProfileChanges>>;
  /** Sends a code to a new phone number; also used to resend it. */
  sendPhoneCode(phone: PhoneFieldValue): Promise<Result<void>>;
  /** Confirms the new phone number with the code that was sent to it. */
  verifyPhone(phone: PhoneFieldValue, code: string): Promise<Result<string>>;
  uploadLicense(file: File): Promise<Result<string>>;
  deleteAccount(): Promise<Result<null>>;
}

interface ProfileUserDto {
  name: string;
  email: string;
  phone: string;
  phone_code: string;
  birth_date: string;
  license: Record<string, unknown> | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isProfileUserDto(value: unknown): value is ProfileUserDto {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.phone === "string" &&
    typeof value.phone_code === "string" &&
    typeof value.birth_date === "string" &&
    (value.license === null || isRecord(value.license))
  );
}

function toUserProfile(user: ProfileUserDto): UserProfile {
  const licenseUrl =
    isRecord(user.license) && typeof user.license.license === "string"
      ? user.license.license
      : undefined;
  return {
    fullName: user.name,
    email: user.email,
    birthDate: user.birth_date,
    phone: `${user.phone_code}${user.phone}`,
    licenseUploaded: user.license !== null,
    ...(licenseUrl ? { licenseUrl: toLicenseUrl(licenseUrl) } : {}),
  };
}

/** Backend responses may contain an absolute URL or a path under the API host. */
function toLicenseUrl(reference: string): string {
  try {
    return new URL(reference, env.serverApiUrl).toString();
  } catch {
    return reference;
  }
}

interface LicenseDto {
  id: number | string;
  user_id: number | string;
  license: string;
  created_at: string;
}

function isLicenseDto(value: unknown): value is LicenseDto {
  return (
    isRecord(value) &&
    (typeof value.id === "number" || typeof value.id === "string") &&
    (typeof value.user_id === "number" || typeof value.user_id === "string") &&
    typeof value.license === "string" &&
    typeof value.created_at === "string"
  );
}

async function getProfile(): Promise<UserProfile> {
  const response = await serverHttp.get<ApiEnvelope<unknown>>("/profile");
  if (!isApiEnvelope(response) || !isRecord(response.data)) {
    throw new AppError("server");
  }
  const user = response.data.user;
  if (!isProfileUserDto(user)) throw new AppError("server");
  return toUserProfile(user);
}

async function updateProfile(
  profile: ProfileChanges,
): Promise<Result<ProfileChanges>> {
  try {
    const response = await serverHttp.put<ApiEnvelope<unknown>>(
      "/update-profile",
      {
        name: profile.fullName,
        email: profile.email,
        birth_date: profile.birthDate,
      },
    );
    if (
      !isApiEnvelope(response) ||
      !isRecord(response.data) ||
      !isRecord(response.data.user)
    ) {
      throw new AppError("server");
    }
    const user = response.data.user;
    if (
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      typeof user.birth_date !== "string"
    ) {
      throw new AppError("server");
    }
    return ok(
      { fullName: user.name, email: user.email, birthDate: user.birth_date },
      response.message,
    );
  } catch (error) {
    return fail(error);
  }
}

async function sendPhoneCode(phone: PhoneFieldValue): Promise<Result<void>> {
  try {
    const response = await serverHttp.post<ApiEnvelope<unknown>>(
      "/auth/request-otp",
      {
        phone: phone.phone,
        phone_code: phone.countryCode,
        otp_type: "change_phone",
      },
    );
    if (!isApiEnvelope(response) || response.data !== null) {
      throw new AppError("server");
    }
    return ok(undefined, response.message);
  } catch (error) {
    return fail(error);
  }
}

async function verifyPhone(
  phone: PhoneFieldValue,
  code: string,
): Promise<Result<string>> {
  try {
    const response = await serverHttp.post<ApiEnvelope<unknown>>(
      "/auth/verify-otp",
      {
        phone: phone.phone,
        phone_code: phone.countryCode,
        otp: code,
        otp_type: "change_phone",
      },
    );
    if (
      !isApiEnvelope(response) ||
      !isRecord(response.data) ||
      !isProfileUserDto(response.data.user)
    ) {
      throw new AppError("server");
    }
    return ok(toUserProfile(response.data.user).phone, response.message);
  } catch (error) {
    return fail(error);
  }
}

async function uploadLicense(file: File): Promise<Result<string>> {
  try {
    const formData = new FormData();
    formData.set("license", file);
    const response = await serverHttp.post<ApiEnvelope<unknown>>(
      "/license",
      formData,
    );
    if (!isApiEnvelope(response) || !isLicenseDto(response.data)) {
      throw new AppError("server");
    }
    return ok(toLicenseUrl(response.data.license), response.message);
  } catch (error) {
    return fail(error);
  }
}

async function deleteAccount(): Promise<Result<null>> {
  try {
    const response =
      await serverHttp.delete<ApiEnvelope<unknown>>("/delete-account");
    if (!isApiEnvelope(response) || response.data !== null) {
      throw new AppError("server");
    }
    return ok(null, response.message);
  } catch (error) {
    return fail(error);
  }
}

/** Profile reads, edits, phone OTP operations, and license upload are live. */
export const accountApi: AccountApi = {
  ...accountMock,
  getProfile,
  updateProfile,
  sendPhoneCode,
  verifyPhone,
  uploadLicense,
  deleteAccount,
};
