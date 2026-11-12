import { readGuestLocation } from "@/shared/lib/guest-location";
import type { LocationData } from "@/shared/lib/location";
import type { BookingContext } from "@/features/orders";

/**
 * The branch delivery range (car details `allowed_distance`, km) as a map
 * circle around the branch, or undefined when either is unknown.
 */
export function allowedAreaOf(
  branch: BookingContext["branch"] | undefined,
  allowedDistanceKm: number | undefined,
): { center: { lat: number; lng: number }; radiusKm: number } | undefined {
  if (
    !branch ||
    branch.latitude === undefined ||
    branch.longitude === undefined ||
    !allowedDistanceKm ||
    allowedDistanceKm <= 0
  )
    return undefined;
  return {
    center: { lat: branch.latitude, lng: branch.longitude },
    radiusKm: allowedDistanceKm,
  };
}

/** Where a pickup / return map opens: the chosen point, else the saved browser location (like the rental flow map). */
export function mapStartLocation(
  chosen: LocationData | null | undefined,
): LocationData | null {
  if (chosen) return chosen;
  const saved = readGuestLocation();
  return saved ? { ...saved, address: saved.address ?? "" } : null;
}
