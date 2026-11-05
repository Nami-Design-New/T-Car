import "server-only";
import { cache } from "react";
import { carDetailsApi } from "./api";
import { toAppError } from "@/shared/lib/errors";
import {
  deserializeCarDetailsQuery,
  type CarDetails,
  type CarPolicies,
  type CompanyRatings,
} from "./model";

/**
 * Null for an unknown id, so the page can call notFound(). Other failures throw
 * to error.tsx. Cached per request: generateMetadata and the page share one read.
 */
export const getCarDetails = cache(
  async (id: string, queryKey: string): Promise<CarDetails | null> => {
    try {
      return await carDetailsApi.getCarDetails(
        id,
        deserializeCarDetailsQuery(queryKey),
      );
    } catch (error) {
      const appError = toAppError(error);
      if (appError.kind === "not_found") return null;
      throw appError;
    }
  },
);

/** Ratings are company-level and share the selected delivery context. */
export const getCompanyRatings = cache(
  async (id: string, queryKey: string): Promise<CompanyRatings> =>
    carDetailsApi.getCompanyRatings(id, deserializeCarDetailsQuery(queryKey)),
);

export const getCarPolicies = cache(async (): Promise<CarPolicies> =>
  carDetailsApi.getPolicies(),
);
