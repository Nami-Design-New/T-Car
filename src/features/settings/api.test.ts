import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ publicServerHttp: { get } }));

import { mapSettings, settingsApi } from "./api";

// Observed GET /settings (2026-11-02), shortened to fields around the sizes.
const settings = {
  data: {
    terms_url: "https://t-car.app/user/terms?locale=en",
    daily_booking_showing: true,
    company_sizes: [
      { id: 1, size: 10 },
      { id: 2, size: 20 },
    ],
  },
  message: "Settings retrieved successfully.",
  code: 200,
};

beforeEach(() => vi.clearAllMocks());

describe("settings mapping", () => {
  it("maps the company sizes with string IDs", () => {
    expect(mapSettings(settings)).toEqual({
      companySizes: [
        { id: "1", size: 10 },
        { id: "2", size: 20 },
      ],
    });
  });

  it("maps an empty size list", () => {
    expect(mapSettings({ ...settings, data: { company_sizes: [] } })).toEqual({
      companySizes: [],
    });
  });

  it("throws a server AppError for malformed settings", () => {
    for (const value of [
      null,
      { ...settings, data: null },
      { ...settings, data: {} },
      { ...settings, data: { company_sizes: [{ id: "1", size: 10 }] } },
      { ...settings, data: { company_sizes: [{ id: 1 }] } },
      { ...settings, code: 422 },
    ]) {
      expect(() => mapSettings(value)).toThrow(new AppError("server"));
    }
  });
});

describe("settingsApi.getSettings", () => {
  it("reads the public endpoint", async () => {
    get.mockResolvedValue(settings);
    await expect(settingsApi.getSettings()).resolves.toMatchObject({
      companySizes: [{ id: "1" }, { id: "2" }],
    });
    expect(get).toHaveBeenCalledWith("/settings");
  });

  it("preserves the client's errors", async () => {
    const network = new AppError("network");
    get.mockRejectedValue(network);
    await expect(settingsApi.getSettings()).rejects.toBe(network);
  });
});
