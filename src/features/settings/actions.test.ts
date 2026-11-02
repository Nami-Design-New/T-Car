import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));
vi.mock("./api", async () => {
  const { createSettingsMock } = await import("./api.mock");
  return { settingsApi: createSettingsMock() };
});

import { getSettingsAction } from "./actions";
import { MOCK_SETTINGS, createSettingsMock } from "./api.mock";
import { settingsApi } from "./api";

beforeEach(() => vi.restoreAllMocks());

describe("getSettingsAction", () => {
  it("returns the settings", async () => {
    await expect(getSettingsAction()).resolves.toEqual({
      ok: true,
      data: MOCK_SETTINGS,
    });
  });

  it("returns a failed read as plain error data (mock failure rule)", async () => {
    vi.spyOn(settingsApi, "getSettings").mockImplementation(
      createSettingsMock({ fail: true }).getSettings,
    );
    await expect(getSettingsAction()).resolves.toEqual({
      ok: false,
      error: { kind: "server" },
    });
  });
});
