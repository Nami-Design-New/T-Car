/* Browser-facing company-row proxy; the cars feature owns backend mapping. */
/* eslint-disable no-restricted-imports, boundaries/dependencies */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cityCarsApi } from "@/features/cars/api";
import type { CarsListingQuery } from "@/features/cars/searchParams";
import { AppError } from "@/shared/lib/errors";

const id = z.string().regex(/^\d+$/);
const optionalString = z.string().trim().min(1).optional();
const optionalIds = z.array(id).optional();

function idsFrom(search: URLSearchParams, name: string): string[] | undefined {
  const ids = [...search.entries()]
    .filter(([key]) => new RegExp(`^${name}\\[\\d+\\]$`).test(key))
    .map(([, value]) => value);
  return ids.length ? ids : undefined;
}

const requestSchema = z
  .object({
    source: z.enum(["offer", "careful_chooses", "general"]),
    companyId: id,
    page: z.coerce.number().int().min(2).max(1000),
    region: optionalString,
    latitude: z.coerce.number().finite().min(-90).max(90).optional(),
    longitude: z.coerce.number().finite().min(-180).max(180).optional(),
    query: optionalString,
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    brandIds: optionalIds,
    typeIds: optionalIds,
    serviceIds: optionalIds,
    companyIds: optionalIds,
    deliveryType: z.enum(["to_location", "from_branch"]).optional(),
    airportId: id.optional(),
    stationId: id.optional(),
    countryId: id.optional(),
  })
  .refine(
    ({ region, latitude, longitude }) =>
      [region, latitude, longitude].every((value) => value !== undefined) ||
      [region, latitude, longitude].every((value) => value === undefined),
  );

function localeFrom(request: NextRequest): string {
  return request.headers.get("accept-language")?.split(",")[0] || "en";
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const parsed = requestSchema.safeParse({
    source: search.get("source") ?? undefined,
    companyId: search.get("company_id") ?? undefined,
    page: search.get("page") ?? undefined,
    region: search.get("region") ?? undefined,
    latitude: search.get("latitude") ?? undefined,
    longitude: search.get("longitude") ?? undefined,
    query: search.get("search") ?? undefined,
    minPrice: search.get("min_price") ?? undefined,
    maxPrice: search.get("max_price") ?? undefined,
    brandIds: idsFrom(search, "brand_id"),
    typeIds: idsFrom(search, "type_id"),
    serviceIds: idsFrom(search, "service_id"),
    companyIds: idsFrom(search, "company_id"),
    deliveryType: search.get("delivery_type") ?? undefined,
    airportId: search.get("airport_id") ?? undefined,
    stationId: search.get("train_station_id") ?? undefined,
    countryId: search.get("country_id") ?? undefined,
  });
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 400 });

  const { page, source, companyId, ...query } = parsed.data;
  try {
    const data = await cityCarsApi.listListingCompanyCars(
      localeFrom(request),
      companyId,
      { ...query, source } as CarsListingQuery,
      page,
    );
    return NextResponse.json(data);
  } catch (error) {
    const status =
      error instanceof AppError && error.status ? error.status : 500;
    return NextResponse.json({ error: "server" }, { status });
  }
}
