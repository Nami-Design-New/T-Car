import type { PhoneCountry } from "@/shared/lib/phone";
import type { PhoneCountriesApi } from "../phoneCountries.api";
import { AppError } from "@/shared/lib/errors";

const MOCK_COUNTRIES: PhoneCountry[] = [
  {
    id: "eg",
    iso2: "EG",
    name: "Egypt",
    countryCode: "+20",
    flagUrl: "/mock/flags/flag1.png",
  },
  {
    id: "lb",
    iso2: "LB",
    name: "Lebanon",
    countryCode: "+961",
    flagUrl: "/mock/flags/flag2.png",
  },
  {
    id: "sa",
    iso2: "SA",
    name: "Saudi Arabia",
    countryCode: "+966",
    flagUrl: "/mock/flags/flag3.png",
  },
  {
    id: "ae",
    iso2: "AE",
    name: "United Arab Emirates",
    countryCode: "+971",
    flagUrl: "/mock/flags/flag4.png",
  },
  {
    id: "bh",
    iso2: "BH",
    name: "Bahrain",
    countryCode: "+973",
    flagUrl: "/mock/flags/flag5.png",
  },
];

// Stateless and safe for server reads. For a reproducible error state, search
// for the exact term "__mock_error__"; it throws a server AppError.
export const phoneCountriesMock: PhoneCountriesApi = {
  async listCountries({ search, cursor = null, limit, signal }) {
    if (signal?.aborted) {
      throw new DOMException("The request was aborted.", "AbortError");
    }

    if (search.trim().toLowerCase() === "__mock_error__") {
      throw new AppError("server", "phoneCountries.unavailable");
    }

    const offset = cursor === null ? 0 : Number(cursor);
    if (!Number.isInteger(offset) || offset < 0) {
      throw new AppError("validation", "phoneCountries.invalidCursor");
    }

    const normalizedSearch = search.trim().toLocaleLowerCase();
    const filteredCountries = MOCK_COUNTRIES.filter((country) =>
      [country.name, country.iso2, country.countryCode].some((field) =>
        field.toLocaleLowerCase().includes(normalizedSearch),
      ),
    );
    const pageSize = Math.max(1, Math.floor(limit));
    const items = filteredCountries.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;

    return {
      items,
      nextCursor:
        nextOffset < filteredCountries.length ? String(nextOffset) : null,
    };
  },
};
