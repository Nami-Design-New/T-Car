"use client";

import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { fail, ok, type Result } from "@/shared/lib/result";
import type { CarListing, OfficeCarGroup } from "../model";
import {
  COMPANY_CARS_PER_PAGE,
  toCarsListingSearchParams,
  type CarsListingQuery,
} from "../searchParams";

const LISTING_GROUPS_PER_PAGE = 1;

async function getPage<T>(
  path: string,
  query: CarsListingQuery,
  page: number,
  locale: string,
  companyId?: string,
): Promise<Result<Page<T>>> {
  try {
    const perPage = companyId ? COMPANY_CARS_PER_PAGE : LISTING_GROUPS_PER_PAGE;
    const search = toCarsListingSearchParams(query, page, perPage, companyId);
    search.set("source", query.source);
    const response = await fetch(`/api/${path}?${search}`, {
      headers: { "Accept-Language": locale },
    });
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

export function getCarsListingGroups(
  query: CarsListingQuery,
  page: number,
  locale: string,
) {
  return getPage<OfficeCarGroup>("cars-listing", query, page, locale);
}

export function getListingCompanyCars(
  companyId: string,
  query: CarsListingQuery,
  page: number,
  locale: string,
) {
  return getPage<CarListing>("company-cars", query, page, locale, companyId);
}
