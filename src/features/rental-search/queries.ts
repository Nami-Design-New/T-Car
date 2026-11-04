import "server-only";
import { getLocale } from "next-intl/server";
import { rentalSearchApi } from "./api";
import type { RentalSearchOptions } from "./model";

export function getRentalSearchOptions(): Promise<RentalSearchOptions> {
  return getLocale().then((locale) => rentalSearchApi.getOptions(locale));
}
