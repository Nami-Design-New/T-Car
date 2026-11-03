/* Route handlers are the app boundary for browser GETs; this proxy delegates
 * mapping to the owning feature instead of duplicating the API contract. */
/* eslint-disable no-restricted-imports, boundaries/dependencies */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cityCarsApi } from "@/features/cars/api";
import type { CityCarsQuery } from "@/features/cars/searchParams";
import { AppError } from "@/shared/lib/errors";

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalString = z.string().trim().min(1).optional();
const optionalIds = z.array(z.string().regex(/^\d+$/)).optional();

function idsFrom(search: URLSearchParams, name: string): string[] | undefined {
  const ids = [...search.entries()]
    .filter(([key]) => new RegExp(`^${name}\\[\\d+\\]$`).test(key))
    .map(([, value]) => value);
  return ids.length ? ids : undefined;
}

const requestSchema = z
  .object({
    region: optionalString,
    latitude: z.coerce.number().finite().min(-90).max(90).optional(),
    longitude: z.coerce.number().finite().min(-180).max(180).optional(),
    query: optionalString,
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    fromDay: isoDay.optional(),
    toDay: isoDay.optional(),
    page: z.coerce.number().int().min(1).max(1000),
    companyId: z.string().regex(/^\d+$/).optional(),
    brandIds: optionalIds,
    typeIds: optionalIds,
    serviceIds: optionalIds,
    companyIds: optionalIds,
  })
  .refine(
    ({ region, latitude, longitude }) =>
      [region, latitude, longitude].every((value) => value !== undefined) ||
      [region, latitude, longitude].every((value) => value === undefined),
  );

function queryFrom(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  return requestSchema.safeParse({
    region: search.get("region") ?? undefined,
    latitude: search.get("latitude") ?? undefined,
    longitude: search.get("longitude") ?? undefined,
    query: search.get("search") ?? undefined,
    minPrice: search.get("min_price") ?? undefined,
    maxPrice: search.get("max_price") ?? undefined,
    fromDay: search.get("from_day") ?? undefined,
    toDay: search.get("to_day") ?? undefined,
    page: search.get("page") ?? undefined,
    companyId: search.get("company_id") ?? undefined,
    brandIds: idsFrom(search, "brand_id"),
    typeIds: idsFrom(search, "type_id"),
    serviceIds: idsFrom(search, "service_id"),
    companyIds: idsFrom(search, "company_id"),
  });
}

function localeFrom(request: NextRequest): string {
  return request.headers.get("accept-language")?.split(",")[0] || "en";
}

/** Browser-facing GET proxy for city pagination; the backend remains server-only. */
export async function GET(request: NextRequest) {
  const parsed = queryFrom(request);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { page, companyId, ...query } = parsed.data;
  try {
    const data = companyId
      ? await cityCarsApi.listCompanyCars(
          localeFrom(request),
          companyId,
          query as CityCarsQuery,
          page,
        )
      : await cityCarsApi.listCityCars(
          localeFrom(request),
          query as CityCarsQuery,
          page,
        );
    return NextResponse.json(data);
  } catch (error) {
    const status =
      error instanceof AppError && error.status ? error.status : 500;
    return NextResponse.json({ error: "server" }, { status });
  }
}
