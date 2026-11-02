import { AppError } from "@/shared/lib/errors";
import type { SettingsApi } from "./api";
import type { AppSettings } from "./model";

/** The company sizes observed on GET /settings (2026-11-02). */
export const MOCK_SETTINGS: AppSettings = {
  companySizes: [
    { id: "1", size: 10 },
    { id: "2", size: 20 },
    { id: "3", size: 30 },
    { id: "4", size: 40 },
    { id: "5", size: 50 },
  ],
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
