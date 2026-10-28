/** The fields read from a Google geocoder result (Maps JS `GeocoderResult` or the REST API). */
interface GeocodeResult {
  formatted_address?: string;
  address_components?: { long_name: string; types: string[] }[];
}

/** The first-level administrative area (e.g. "Riyadh Province"), if the geocoder has one. */
export function regionOf(result: GeocodeResult): string | undefined {
  return result.address_components?.find((component) =>
    component.types.includes("administrative_area_level_1"),
  )?.long_name;
}

export interface ReverseGeocodeResult {
  address: string;
  region?: string;
}

/**
 * The address and region at a point, in `language`, from the Geocoding REST
 * API (no Maps script needed). Null when the lookup fails or finds nothing.
 */
export async function reverseGeocode(
  { lat, lng }: { lat: number; lng: number },
  language: string,
): Promise<ReverseGeocodeResult | null> {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    language,
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "",
  });
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    );
    if (!response.ok) return null;
    const body: { status?: string; results?: GeocodeResult[] } =
      await response.json();
    const result = body.status === "OK" ? body.results?.[0] : undefined;
    if (!result?.formatted_address) return null;
    return { address: result.formatted_address, region: regionOf(result) };
  } catch {
    return null;
  }
}
