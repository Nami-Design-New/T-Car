import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { getSettings, reportError } = vi.hoisted(() => ({
  getSettings: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/shared/lib/report", () => ({ reportError }));
vi.mock("./api", () => ({ settingsApi: { getSettings } }));

import {
  DEFAULT_PRICE_FILTER_RANGE,
} from "./model";
import { MOCK_SETTINGS } from "./api.mock";
import { getBookingTypeAvailability, getSiteSettings } from "./queries";

beforeEach(() => vi.clearAllMocks());

describe("getSiteSettings", () => {
  it("returns the contact details and the site links", async () => {
    getSettings.mockResolvedValue(MOCK_SETTINGS);
    await expect(getSiteSettings()).resolves.toEqual({
      contact: MOCK_SETTINGS.contact,
      links: MOCK_SETTINGS.links,
      priceFilterRange: MOCK_SETTINGS.priceFilterRange,
    });
  });

  it("never throws: reports the failure and returns no details", async () => {
    getSettings.mockRejectedValue(new AppError("server"));
    await expect(getSiteSettings()).resolves.toEqual({
      contact: {},
      links: {},
      priceFilterRange: DEFAULT_PRICE_FILTER_RANGE,
    });
    expect(reportError).toHaveBeenCalledWith(expect.any(AppError), {
      scope: "settings.site",
    });
  });
});

describe("getBookingTypeAvailability", () => {
  it("keeps missing switches enabled and honors explicit false values", async () => {
    getSettings.mockResolvedValue({
      ...MOCK_SETTINGS,
      bookingTypes: { daily: false, airport: false },
    });

    await expect(getBookingTypeAvailability()).resolves.toEqual({
      daily: false,
      monthly: true,
      station: true,
      airport: false,
      international: true,
    });
  });

  it("reports a failed settings read and keeps all options available", async () => {
    getSettings.mockRejectedValue(new AppError("server"));

    await expect(getBookingTypeAvailability()).resolves.toEqual({
      daily: true,
      monthly: true,
      station: true,
      airport: true,
      international: true,
    });
    expect(reportError).toHaveBeenCalledWith(expect.any(AppError), {
      scope: "settings.booking-types",
    });
  });
});
