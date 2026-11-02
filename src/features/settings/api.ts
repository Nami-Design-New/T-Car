import "server-only";
import { isApiEnvelope, type ApiEnvelope } from "@/services/http/envelope";
import { publicServerHttp } from "@/services/http/server";
import { AppError } from "@/shared/lib/errors";
import type {
  AppSettings,
  BookingType,
  ContactSettings,
  MapDefaultPosition,
  PriceFilterRange,
} from "./model";

export interface SettingsApi {
  getSettings(): Promise<AppSettings>;
}

interface CompanySizeDto {
  id: number;
  size: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function isCompanySizeDto(value: unknown): value is CompanySizeDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    typeof value.size === "number" &&
    Number.isFinite(value.size)
  );
}

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** Only an absolute http(s) URL is used as a link. */
function link(value: unknown): string | undefined {
  const url = text(value);
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The contact details. Each one is optional: a missing or unusable field is
 * left out instead of failing the settings (the company sizes still load).
 */
function toContact(data: Record<string, unknown>): ContactSettings {
  const email = text(data.email);
  const phone = text(data.phone);
  return {
    email: email?.includes("@") ? email : undefined,
    phone: phone && /^\+?[\d\s-]{6,20}$/.test(phone) ? phone : undefined,
    facebook: link(data.facebook_link),
    instagram: link(data.instagram_link),
    twitter: link(data.twitter_link),
  };
}

const BOOKING_TYPE_FIELDS = {
  daily: "daily_booking_showing",
  monthly: "monthly_booking_showing",
  station: "station_booking_showing",
  airport: "airport_booking_showing",
  international: "international_booking_showing",
} satisfies Record<BookingType, string>;

function toBookingTypes(
  data: Record<string, unknown>,
): Partial<Record<BookingType, boolean>> | undefined {
  const entries = Object.entries(BOOKING_TYPE_FIELDS).flatMap(([type, field]) =>
    typeof data[field] === "boolean" ? [[type, data[field]]] : [],
  );
  return entries.length
    ? (Object.fromEntries(entries) as Partial<Record<BookingType, boolean>>)
    : undefined;
}

function toPriceFilterRange(
  data: Record<string, unknown>,
): PriceFilterRange | undefined {
  const min = data.min_filter_price;
  const max = data.max_filter_price;
  return typeof min === "number" && Number.isFinite(min) &&
    typeof max === "number" && Number.isFinite(max) && min < max
    ? { min, max }
    : undefined;
}

function toMapDefaultPosition(
  data: Record<string, unknown>,
): MapDefaultPosition | undefined {
  const lat = data.latitude;
  const lng = data.longitude;
  return typeof lat === "number" && Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    typeof lng === "number" && Number.isFinite(lng) && lng >= -180 && lng <= 180
    ? { lat, lng }
    : undefined;
}

/** Validate GET /settings and map the fields the app uses. */
export function mapSettings(value: unknown): AppSettings {
  const data = isApiEnvelope(value) ? value.data : undefined;
  const sizes = isRecord(data) ? data.company_sizes : undefined;
  if (
    !isApiEnvelope(value) ||
    (value.code !== 200 && value.code !== 201) ||
    !Array.isArray(sizes) ||
    !sizes.every(isCompanySizeDto)
  ) {
    throw new AppError("server");
  }
  const settingsData = data as Record<string, unknown>;
  return {
    companySizes: sizes.map(({ id, size }) => ({ id: String(id), size })),
    contact: toContact(settingsData),
    links: {
      aboutUrl: link(settingsData.about_us_url),
      termsUrl: link(settingsData.terms_url),
      privacyUrl: link(settingsData.privacy_policy_url),
    },
    bookingTypes: toBookingTypes(settingsData),
    priceFilterRange: toPriceFilterRange(settingsData),
    mapDefaultPosition: toMapDefaultPosition(settingsData),
  };
}

/** GET /settings is public: no token (docs/api/contact-join-us-api.md R2). */
async function getSettings(): Promise<AppSettings> {
  const response =
    await publicServerHttp.get<ApiEnvelope<unknown>>("/settings");
  return mapSettings(response);
}

export const settingsApi: SettingsApi = { getSettings };
