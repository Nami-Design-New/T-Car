"use client";

import { AppError } from "@/shared/lib/errors";
import type { Page } from "@/shared/lib/pagination";
import { fail, ok, type Result } from "@/shared/lib/result";
import type { CarListing } from "../model";
import {
  HOME_CAREFULLY_CHOSEN_CARS_PER_PAGE,
  type CityCarsLocation,
} from "../searchParams";

/** Browser request through the server-only curated-cars proxy. */
export async function getHomeCarefullyChosenCars(
  page: number,
  locale: string,
  location: CityCarsLocation | null,
): Promise<Result<Page<CarListing>>> {
  try {
    const search = new URLSearchParams({
      per_page: String(HOME_CAREFULLY_CHOSEN_CARS_PER_PAGE),
      page: String(page),
    });
    if (location) {
      search.set("region", location.region);
      search.set("latitude", String(location.latitude));
      search.set("longitude", String(location.longitude));
    }
    const response = await fetch(`/api/carefully-choises-cars?${search}`, {
      headers: { "Accept-Language": locale },
    });
    if (!response.ok) {
      return fail(
        new AppError(response.status === 400 ? "validation" : "server"),
      );
    }
    return ok((await response.json()) as Page<CarListing>);
  } catch {
    return fail(new AppError("network"));
  }
}
