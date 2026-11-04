"use client";

import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { fail, ok, type Result } from "@/shared/lib/result";
import type { Airport, Country, Station } from "../model";

export type LookupKind = "airports" | "train-stations" | "countries";

async function getPage<T>(
  kind: LookupKind,
  page: number,
  search: string,
  locale: string,
): Promise<Result<Page<T>>> {
  const query = new URLSearchParams({ page: String(page), per_page: "20" });
  if (search.trim()) query.set("search", search.trim());

  try {
    const response = await fetch(
      `/api/rental-search-options/${kind}?${query}`,
      {
        headers: { "Accept-Language": locale },
      },
    );
    if (!response.ok) {
      return fail(
        new AppError(response.status === 400 ? "validation" : "server"),
      );
    }
    return ok((await response.json()) as Page<T>);
  } catch {
    return fail(new AppError("network"));
  }
}

export const getAirportPage = (page: number, search: string, locale: string) =>
  getPage<Airport>("airports", page, search, locale);

export const getStationPage = (page: number, search: string, locale: string) =>
  getPage<Station>("train-stations", page, search, locale);

export const getCountryPage = (page: number, search: string, locale: string) =>
  getPage<Country>("countries", page, search, locale);
