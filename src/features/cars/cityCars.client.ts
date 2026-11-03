"use client";

import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { fail, ok, type Result } from "@/shared/lib/result";
import type { CarListing, OfficeCarGroup } from "./model";
import {
  COMPANY_CARS_PER_PAGE,
  toCityCarsSearchParams,
  type CityCarsQuery,
} from "./searchParams";

const CITY_CARS_PER_PAGE = 1;

async function getPage<T>(
  query: CityCarsQuery,
  page: number,
  locale: string,
  companyId?: string,
): Promise<Result<Page<T>>> {
  try {
    const perPage = companyId ? COMPANY_CARS_PER_PAGE : CITY_CARS_PER_PAGE;
    const response = await fetch(
      `/api/city-cars?${toCityCarsSearchParams(query, page, perPage, companyId)}`,
      { headers: { "Accept-Language": locale } },
    );
    if (!response.ok) {
      return fail(new AppError(response.status === 400 ? "validation" : "server"));
    }
    return ok((await response.json()) as Page<T>);
  } catch {
    return fail(new AppError("network"));
  }
}

export function getCityCarGroups(
  query: CityCarsQuery,
  page: number,
  locale: string,
) {
  return getPage<OfficeCarGroup>(query, page, locale);
}

export function getCompanyCars(
  companyId: string,
  query: CityCarsQuery,
  page: number,
  locale: string,
) {
  return getPage<CarListing>(query, page, locale, companyId);
}
