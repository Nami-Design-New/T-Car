import type { CountryPage, CountryPageRequest } from "@/shared/lib/phone";
import { phoneCountriesMock } from "./mocks/phoneCountries";

export interface PhoneCountriesApi {
  listCountries(request: CountryPageRequest): Promise<CountryPage>;
}

// Country data has no real endpoint yet; callers use the stateless mock until
// the backend contract is available.
export const phoneCountriesApi: PhoneCountriesApi = phoneCountriesMock;
