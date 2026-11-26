import "server-only";
import { cache } from "react";
import { reportError } from "@/shared/lib/report";
import { settingsApi } from "./api";
import {
  BOOKING_TYPES,
  DEFAULT_BOOKING_TYPES,
  DEFAULT_PRICE_FILTER_RANGE,
  type AppSettings,
  type BookingTypeAvailability,
  type SiteSettings,
  type VipSettings,
} from "./model";

/** The app settings for server components; read once per request. */
export const getSettings = cache((): Promise<AppSettings> =>
  settingsApi.getSettings(),
);

/** VIP details for the account banner; unavailable settings hide the banner. */
export async function getVipSettings(): Promise<VipSettings> {
  try {
    const { isVip, vipPackages, whatsappNumber } = await getSettings();
    return { isVip, vipPackages, whatsappNumber };
  } catch (error) {
    reportError(error, { scope: "settings.vip" });
    return { isVip: false, vipPackages: null, whatsappNumber: null };
  }
}

/** Booking switches; a missing setting keeps its option available. */
export async function getBookingTypeAvailability(): Promise<BookingTypeAvailability> {
  try {
    const { bookingTypes } = await getSettings();
    return Object.fromEntries(
      BOOKING_TYPES.map((type) => [type, bookingTypes?.[type] ?? true]),
    ) as BookingTypeAvailability;
  } catch (error) {
    reportError(error, { scope: "settings.booking-types" });
    return DEFAULT_BOOKING_TYPES;
  }
}

/**
 * Settings used by the shared shell and home page. Never throws: if the
 * settings cannot be read, the error is reported and known defaults are used.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { contact, links, priceFilterRange } = await getSettings();
    return {
      contact,
      links,
      priceFilterRange: priceFilterRange ?? DEFAULT_PRICE_FILTER_RANGE,
    };
  } catch (error) {
    reportError(error, { scope: "settings.site" });
    return {
      contact: {},
      links: {},
      priceFilterRange: DEFAULT_PRICE_FILTER_RANGE,
    };
  }
}
