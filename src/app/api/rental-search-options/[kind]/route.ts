/* Browser-facing lookup proxy. The feature owns mapping and backend access. */
/* eslint-disable no-restricted-imports, boundaries/dependencies */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  rentalSearchApi,
  type LookupRequest,
} from "@/features/rental-search/api";
import { AppError } from "@/shared/lib/errors";

const requestSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
});

type LookupKind = "airports" | "train-stations" | "countries";

function isLookupKind(value: string): value is LookupKind {
  return (
    value === "airports" || value === "train-stations" || value === "countries"
  );
}

function localeFrom(request: NextRequest): string {
  return request.headers.get("accept-language")?.split(",")[0] || "en";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  const parsed = requestSchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    perPage: request.nextUrl.searchParams.get("per_page") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });
  if (!isLookupKind(kind) || !parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const lookup: LookupRequest = { ...parsed.data, locale: localeFrom(request) };
  try {
    const data = await (kind === "airports"
      ? rentalSearchApi.listAirports(lookup)
      : kind === "train-stations"
        ? rentalSearchApi.listStations(lookup)
        : rentalSearchApi.listCountries(lookup));
    return NextResponse.json(data);
  } catch (error) {
    const status =
      error instanceof AppError && error.status ? error.status : 500;
    return NextResponse.json({ error: "server" }, { status });
  }
}
