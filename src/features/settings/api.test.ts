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
    privacy_policy_url: "https://t-car.app/user/privacy?locale=en",
    about_us_url: "https://t-car.app/user/about-us?locale=en",
    daily_booking_showing: true,
    monthly_booking_showing: false,
    station_booking_showing: true,
    airport_booking_showing: false,
    international_booking_showing: true,
    min_filter_price: 5,
    max_filter_price: 55,
    latitude: 24.6477765,
    longitude: 46.8291086,
    distance: 20,
    email: "info@tcar.com",
    phone: "+966500000000",
    facebook_link: "https://facebook.com/tcar",
    instagram_link: "https://instagram.com/tcar",
    twitter_link: "https://x.com/tcar",
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
  it("maps the company sizes with string IDs and the contact details", () => {
    expect(mapSettings(settings)).toEqual({
      companySizes: [
        { id: "1", size: 10 },
        { id: "2", size: 20 },
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
      bookingTypes: {
        daily: true,
        monthly: false,
        station: true,
        airport: false,
        international: true,
      },
      priceFilterRange: { min: 5, max: 55 },
      mapDefaultPosition: { lat: 24.6477765, lng: 46.8291086 },
    });
  });

  it("maps an empty size list and missing contact details", () => {
    expect(mapSettings({ ...settings, data: { company_sizes: [] } })).toEqual({
      companySizes: [],
      contact: {},
      links: {},
      bookingTypes: undefined,
      priceFilterRange: undefined,
      mapDefaultPosition: undefined,
    });
  });

  it("leaves out unusable contact details instead of failing", () => {
    const { contact, links, companySizes } = mapSettings({
      ...settings,
      data: {
        ...settings.data,
        email: "not-an-email",
        phone: 966500000000,
        facebook_link: "javascript:alert(1)",
        instagram_link: "/relative/path",
        twitter_link: null,
        terms_url: "ftp://t-car.app/terms",
        privacy_policy_url: 42,
        about_us_url: "",
      },
    });
    expect(links).toEqual({
      aboutUrl: undefined,
      termsUrl: undefined,
      privacyUrl: undefined,
    });
    expect(contact).toEqual({
      email: undefined,
      phone: undefined,
      facebook: undefined,
      instagram: undefined,
      twitter: undefined,
    });
    expect(companySizes).toHaveLength(2);
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
