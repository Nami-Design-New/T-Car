import "server-only";
import { cache } from "react";
import { reportError } from "@/shared/lib/report";
import { settingsApi } from "./api";
import type { AppSettings, SiteSettings } from "./model";

/** The app settings for server components; read once per request. */
export const getSettings = cache((): Promise<AppSettings> =>
  settingsApi.getSettings(),
);

/**
 * What every page needs: the contact details (footer, home Contact card) and
 * the site links (footer, register form). Never throws: if the settings
 * cannot be read, the error is reported and the page renders without them.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { contact, links } = await getSettings();
    return { contact, links };
  } catch (error) {
    reportError(error, { scope: "settings.site" });
    return { contact: {}, links: {} };
  }
}
