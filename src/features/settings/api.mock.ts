import { AppError } from "@/shared/lib/errors";
import type { SettingsApi } from "./api";
import type { AppSettings } from "./model";

/** Settings shaped like GET /settings (sizes as observed on 2026-11-02). */
export const MOCK_SETTINGS: AppSettings = {
  companySizes: [
    { id: "1", size: 10 },
    { id: "2", size: 20 },
    { id: "3", size: 30 },
    { id: "4", size: 40 },
    { id: "5", size: 50 },
  ],
  contact: {
    email: "info@tcar.com",
    phone: "+966500000000",
    facebook: "https://facebook.com/tcar",
    instagram: "https://instagram.com/tcar",
    twitter: "https://x.com/tcar",
  },
  links: {
    aboutUrl: "https://t-car.app/user/about-us?locale=en",
    termsUrl: "https://t-car.app/user/terms?locale=en",
    privacyUrl: "https://t-car.app/user/privacy?locale=en",
  },
};

/**
 * Test double of the live `SettingsApi` (no production caller, no mock flag).
 * Stateless. Failure rule: `createSettingsMock({ fail: true })` answers like a
 * malformed or unreachable API, a `server` AppError.
 */
export function createSettingsMock({ fail = false } = {}): SettingsApi {
  return {
    async getSettings() {
      if (fail) throw new AppError("server");
      return MOCK_SETTINGS;
    },
  };
}

export const settingsMock: SettingsApi = createSettingsMock();
