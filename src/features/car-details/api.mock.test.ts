import { describe, expect, it } from "vitest";
import { carDetailsMock } from "./api.mock";

describe("carDetailsMock", () => {
  it("returns the listing together with its detail-only fields", async () => {
    const car = await carDetailsMock.getCarDetails("1", {});

    expect(car).toMatchObject({ id: "1" });
    expect(car.images).toHaveLength(1);
    expect(car.warranties.length).toBeGreaterThan(0);
  });

  it("reports an unknown car as not found", async () => {
    await expect(
      carDetailsMock.getCarDetails("missing", {}),
    ).rejects.toMatchObject({ kind: "not_found" });
  });
});
