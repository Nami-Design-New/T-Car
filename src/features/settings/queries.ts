import "server-only";
import { cache } from "react";
import { settingsApi } from "./api";
import type { AppSettings } from "./model";

/** The app settings for server components; read once per request. */
export const getSettings = cache((): Promise<AppSettings> =>
  settingsApi.getSettings(),
);
