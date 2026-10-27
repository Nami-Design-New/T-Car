import { http } from "@/services/http/client";
import type { ApiPage } from "@/services/http/envelope";
import { IMAGES } from "@/shared/config/assets";
import { AppError } from "@/shared/lib/errors";
import type {
  CountryPage,
  CountryPageRequest,
  PhoneCountry,
} from "@/shared/lib/phone";

/** The contract `PhoneField` was built against (`loadCountries`); the mock implements it too. */
export interface PhoneCountriesApi {
  listCountries(request: CountryPageRequest): Promise<CountryPage>;
}

/** `GET /countries` item, as the backend sends it (docs/api/Auth-API.md §4.3). Never leaves this file as-is. */
export interface CountryDto {
  id: number;
  title: string;
  phone_code: string;
  image: string | null;
}

/**
 * A search that is a calling code ("+966", "966", "+9"). The backend's `search`
 * matches titles only, so these are filtered here (backend question Q10).
 */
const CALLING_CODE_SEARCH = /^\+?\d+$/;
/** One page that holds every country (TEST has 9). Revisit if the list passes 100. */
const ALL_COUNTRIES = 100;

/** Checks only the fields the app reads; anything else in the item is ignored. */
function isCountryDto(value: unknown): value is CountryDto {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.phone_code === "string" &&
    (item.image === null || typeof item.image === "string")
  );
}

/**
 * The page's countries, or a `server` AppError when the shape is wrong, so
 * `PhoneField` shows its error/retry state instead of rendering broken rows.
 */
function countriesOf(page: ApiPage<unknown>): CountryDto[] {
  if (!Array.isArray(page.data) || !page.data.every(isCountryDto)) {
    throw new AppError("server");
  }
  return page.data;
}

/** The page to load next, or `null` on the last page. */
function nextPage(page: ApiPage<unknown>): number | null {
  const pagination = page.pagination as
    ApiPage<unknown>["pagination"] | undefined;
  if (
    typeof pagination?.current_page !== "number" ||
    typeof pagination.last_page !== "number"
  ) {
    throw new AppError("server");
  }
  return pagination.current_page < pagination.last_page
    ? pagination.current_page + 1
    : null;
}

/** Backend item → the app's `PhoneCountry`. `iso2` is not provided by the API. */
function toPhoneCountry(country: CountryDto): PhoneCountry {
  return {
    id: String(country.id),
    name: country.title,
    countryCode: country.phone_code,
    flagUrl: country.image ?? IMAGES.flagPlaceholder.src,
  };
}

/**
 * `PhoneField` pages with an opaque string cursor; here it carries the
 * backend's page number. No cursor is the first page.
 */
function pageNumber(cursor: string | null): number {
  if (cursor === null) return 1;
  const page = Number(cursor);
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("validation", "phoneCountries.invalidCursor");
  }
  return page;
}

// Public endpoint (no token, CORS allows GET), so the browser calls it
// directly with the page locale as Accept-Language.
export const phoneCountriesApi: PhoneCountriesApi = {
  async listCountries({ search, cursor = null, limit, signal }) {
    const term = search.trim();

    // Calling-code search: how PhoneField finds the flag for the current
    // number. Fetch every country and match the code locally. All matches are
    // returned (not `limit`), because PhoneField picks the exact one itself.
    if (CALLING_CODE_SEARCH.test(term)) {
      const digits = term.replace(/^\+/, "");
      const page = await http.get<ApiPage<unknown>>("/countries", {
        query: { per_page: ALL_COUNTRIES },
        signal,
      });
      return {
        items: countriesOf(page)
          .filter((country) =>
            country.phone_code.replace(/^\+/, "").startsWith(digits),
          )
          .map(toPhoneCountry),
        nextCursor: null,
      };
    }

    // Browsing or a name search: the backend pages and filters. An empty
    // search is left out of the query (the client drops `undefined`).
    const page = await http.get<ApiPage<unknown>>("/countries", {
      query: {
        page: pageNumber(cursor),
        per_page: Math.max(1, Math.floor(limit)),
        search: term || undefined,
      },
      signal,
    });
    const next = nextPage(page);
    return {
      items: countriesOf(page).map(toPhoneCountry),
      nextCursor: next === null ? null : String(next),
    };
  },
};
