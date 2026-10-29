import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { serverHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import { fail, ok, type Result } from "@/shared/lib/result";
import type { LicenseUpload, ProfileChanges, UserProfile } from "./model";
import { accountMock } from "./api.mock";

export interface AccountApi {
  getProfile(): Promise<UserProfile>;
  updateProfile(
    accountId: string,
    profile: ProfileChanges,
  ): Promise<Result<ProfileChanges>>;
  /** Sends a code to a new phone number; also used to resend it. */
  sendPhoneCode(accountId: string, phone: string): Promise<void>;
  /** Confirms the new phone number with the code that was sent to it. */
  verifyPhone(accountId: string, phone: string, code: string): Promise<void>;
  uploadLicense(accountId: string, file: LicenseUpload): Promise<void>;
  deleteAccount(accountId: string): Promise<void>;
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
  return {
    fullName: user.name,
    email: user.email,
    birthDate: user.birth_date,
    phone: `${user.phone_code}${user.phone}`,
    licenseUploaded: user.license !== null,
  };
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
  _accountId: string,
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

/** Profile reads and edits are live; other writes remain on their mocks. */
export const accountApi: AccountApi = {
  ...accountMock,
  getProfile,
  updateProfile,
};
