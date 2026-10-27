import { phoneCountriesApi } from "./api";

/** Country loader for `PhoneField` (`loadCountries`), backed by `GET /countries`. */
export const loadPhoneCountries = phoneCountriesApi.listCountries;

export type { CountryDto, PhoneCountriesApi } from "./api";
