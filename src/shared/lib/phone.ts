/** Country metadata used by phone entry fields. */
export interface PhoneCountry {
  id: string;
  /** Not provided by the countries API. */
  iso2?: string;
  name: string;
  countryCode: string;
  flagUrl: string;
}

/** The selected calling code and national number remain separate. */
export interface PhoneFieldValue {
  countryCode: string;
  phone: string;
}

export interface CountryPageRequest {
  search: string;
  cursor?: string | null;
  limit: number;
  signal?: AbortSignal;
}

export interface CountryPage {
  items: PhoneCountry[];
  nextCursor: string | null;
}

/** Joins the separated field value at the existing action/API boundary. */
export function formatPhoneFieldValue({
  countryCode,
  phone,
}: PhoneFieldValue): string {
  return `${countryCode}${phone}`;
}

/** Splits a stored number using the supplied default calling code. */
export function parsePhoneFieldValue(
  value: string,
  defaultCountryCode = "+966",
  countryCodes: readonly string[] = [
    // Must cover every phone_code from GET /countries until the forms keep
    // the calling code separate (auth fraction A4, account later).
    "+966",
    "+971",
    "+973",
    "+965",
    "+968",
    "+974",
    "+962",
    "+961",
    "+20",
  ],
): PhoneFieldValue {
  const normalized = value.trim();
  if (!normalized) return { countryCode: defaultCountryCode, phone: "" };

  const countryCode =
    [...countryCodes]
      .sort((left, right) => right.length - left.length)
      .find((code) => normalized.startsWith(code)) ?? defaultCountryCode;
  const hasCountryCode = normalized.startsWith(countryCode);

  return {
    countryCode,
    phone: hasCountryCode
      ? normalized.slice(countryCode.length)
      : normalized.replace(/^\+/, ""),
  };
}
