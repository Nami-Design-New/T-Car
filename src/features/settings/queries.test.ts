import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { getSettings, reportError } = vi.hoisted(() => ({
  getSettings: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/shared/lib/report", () => ({ reportError }));
vi.mock("./api", () => ({ settingsApi: { getSettings } }));

import { MOCK_SETTINGS } from "./api.mock";
import { getSiteSettings } from "./queries";

beforeEach(() => vi.clearAllMocks());

describe("getSiteSettings", () => {
  it("returns the contact details and the site links", async () => {
    getSettings.mockResolvedValue(MOCK_SETTINGS);
    await expect(getSiteSettings()).resolves.toEqual({
      contact: MOCK_SETTINGS.contact,
      links: MOCK_SETTINGS.links,
    });
  });

  it("never throws: reports the failure and returns no details", async () => {
    getSettings.mockRejectedValue(new AppError("server"));
    await expect(getSiteSettings()).resolves.toEqual({
      contact: {},
      links: {},
    });
    expect(reportError).toHaveBeenCalledWith(expect.any(AppError), {
      scope: "settings.site",
    });
  });
});
