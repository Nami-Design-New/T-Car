import { describe, expect, it } from "vitest";
import { distanceKm, isWithinKm } from "./geo";

const riyadh = { lat: 24.7136, lng: 46.6753 };
const jeddah = { lat: 21.4858, lng: 39.1925 };

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm(riyadh, riyadh)).toBe(0);
  });

  it("measures a known distance (Riyadh to Jeddah, about 846 km)", () => {
    expect(distanceKm(riyadh, jeddah)).toBeGreaterThan(840);
    expect(distanceKm(riyadh, jeddah)).toBeLessThan(855);
  });
});

describe("isWithinKm", () => {
  it("accepts a point inside the radius and rejects one outside", () => {
    const near = { lat: riyadh.lat + 0.1, lng: riyadh.lng }; // ~11 km north
    expect(isWithinKm(riyadh, near, 20)).toBe(true);
    expect(isWithinKm(riyadh, near, 5)).toBe(false);
  });
});
