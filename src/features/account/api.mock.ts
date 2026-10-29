import {
  LICENSE_MAX_SIZE_BYTES,
  isLicenseFileType,
  type UserProfile,
} from "./model";
import { AppError } from "@/shared/lib/errors";
import { fail, ok } from "@/shared/lib/result";
import type { AccountApi } from "./api";

/** The phone-change code; the same fixed code as the sign-in mock (features/auth/api.mock.ts). */
const MOCK_OTP_CODE = "1234";

const MOCK_PROFILE: UserProfile = {
  fullName: "أحمد عبدالله القحطاني",
  email: "ahmed@domain.com",
  birthDate: "1993-03-15",
  phone: "+966 45 67 89",
  licenseUploaded: false,
};

// Stateless, so it is safe to run on the server. Writes validate and return
// their result without retaining it between users. Each write has a documented
// reproducible failure rule.
export const accountMock: AccountApi = {
  async getProfile() {
    return { ...MOCK_PROFILE };
  },

  async updateProfile(profile) {
    // `fail@tcar.test` deterministically exercises validation without keeping server state.
    if (profile.email === "fail@tcar.test") {
      return fail(new AppError("validation", "account.profileRejected", undefined, {
        email: "account.profileRejected",
      }));
    }
    return ok(profile, "Profile updated successfully.");
  },

  async sendPhoneCode(phone) {
    // Any phone ending in 0000 deterministically exercises the rate-limit path.
    if (phone.phone.replace(/\D/g, "").endsWith("0000")) {
      return fail(new AppError("rate_limited", "account.resendLimited"));
    }
    return ok(undefined, "OTP has been sent successfully.");
  },

  async verifyPhone(phone, code) {
    // Same fixed code as sign-in (MOCK_OTP_CODE), so the wrong-code path is reproducible.
    if (code !== MOCK_OTP_CODE) {
      return fail(new AppError("validation", "account.invalidCode", undefined, {
        code: "account.invalidCode",
      }));
    }
    return ok(`${phone.countryCode}${phone.phone}`, "Profile retrieved successfully.");
  },

  async uploadLicense(file) {
    // This reserved filename deterministically exercises an upload rejection.
    if (file.name === "reject-license.jpg") {
      return fail(new AppError("validation", "account.licenseRejected"));
    }
    if (!file.name) return fail(new AppError("validation", "account.licenseRequired"));
    if (file.size > LICENSE_MAX_SIZE_BYTES) {
      return fail(new AppError("validation", "account.licenseTooLarge", undefined, {
        file: "account.licenseTooLarge",
      }));
    }
    if (!isLicenseFileType(file.type)) {
      return fail(new AppError(
        "validation",
        "account.licenseInvalidType",
        undefined,
        {
          file: "account.licenseInvalidType",
        },
      ));
    }
    return ok(
      "https://example.test/licenses/" + encodeURIComponent(file.name),
      "License saved successfully.",
    );
  },

  async deleteAccount() {
    // Account deletion needs a live user contract. The mock always rejects, so
    // test callers cannot claim a deletion that was never persisted.
    return fail(new AppError("conflict", "account.deleteRejected"));
  },
};
