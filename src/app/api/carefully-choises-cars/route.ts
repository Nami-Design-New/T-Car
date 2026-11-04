/* Browser-facing paginated curated-cars proxy; mapping stays in the cars feature. */
/* eslint-disable no-restricted-imports, boundaries/dependencies */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cityCarsApi } from "@/features/cars/api";
import type { CityCarsLocation } from "@/features/cars/searchParams";
import { AppError } from "@/shared/lib/errors";

const requestSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000),
    perPage: z.coerce.number().int().min(1).max(100),
    region: z.string().trim().min(1).optional(),
    latitude: z.coerce.number().finite().min(-90).max(90).optional(),
    longitude: z.coerce.number().finite().min(-180).max(180).optional(),
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
    page: search.get("page") ?? undefined,
    perPage: search.get("per_page") ?? undefined,
    region: search.get("region") ?? undefined,
    latitude: search.get("latitude") ?? undefined,
    longitude: search.get("longitude") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const { page, perPage, region, latitude, longitude } = parsed.data;
  const location =
    region === undefined
      ? undefined
      : ({ region, latitude, longitude } as CityCarsLocation);
  try {
    const data = await cityCarsApi.listHomeCarefullyChosenCars(
      localeFrom(request),
      page,
      perPage,
      location,
    );
    return NextResponse.json(data);
  } catch (error) {
    const status =
      error instanceof AppError && error.status ? error.status : 500;
    return NextResponse.json({ error: "server" }, { status });
  }
}
