import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ serverHttp: { get } }));

import { rewardsApi } from "./api";
import { rewardsMock } from "./api.mock";
import { rewardsOverview } from "./model";

const envelope = (data: unknown) => ({ data, message: "OK", code: 200 });
const packageDto = {
  id: 7,
  name: "البرونزية",
  icon_url: "https://admin.t-car.app/storage/bronze.png",
  start_points: 1000,
  end_points: 4999,
  high_color: "#F3C29B",
  medium_color: "#C8794A",
  low_color: "#7A3E1D",
  current_package: false,
  features: [
    { key: "bronze_welcome", title: "Welcome", code: null },
    { key: "new_perk", title: "New perk", code: "WELCOME" },
  ],
};
const currentDto = {
  level_points: 0,
  can_replaced_points: 0,
  current_package: null,
  other_packages: [
    {
      id: 7,
      name: packageDto.name,
      icon_url: packageDto.icon_url,
      start_points: 1000,
    },
  ],
};

describe("rewardsApi live package reads", () => {
  beforeEach(() => get.mockReset());

  it("builds the overview and road from E7 alone without duplicating the current tier", async () => {
    get.mockResolvedValueOnce(
      envelope({
        ...currentDto,
        level_points: 1200,
        current_package: { ...packageDto, current_package: true },
        other_packages: [
          { ...currentDto.other_packages[0], high_color: "#F3C29B", medium_color: "#C8794A", low_color: "#7A3E1D" },
          { id: 8, name: "Gold", icon_url: "https://admin.t-car.app/storage/gold.png", start_points: 5000 },
        ],
      }),
    );

    const home = await rewardsApi.getHome("user-1");

    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith("/packages/current");
    expect(home.currentTier).toMatchObject({
      id: "7",
      perks: [{ key: "bronze_welcome" }, { key: "new_perk" }],
    });
    expect(home.roadTiers.map(({ id }) => id)).toEqual(["7", "8"]);
    expect(home.roadTiers[0].colors.high).toBe("#F3C29B");
  });

  it("uses E7's road when no current package exists", async () => {
    get.mockResolvedValueOnce(envelope(currentDto));
    const home = await rewardsApi.getHome("user-1");
    expect(home.currentTier).toBeNull();
    expect(home.roadTiers).toHaveLength(1);
    expect(home.roadTiers[0].colors.high).toBe("#e5e7eb");
  });

  it("combines E6 packages and E7 balances below the first tier", async () => {
    get.mockImplementation((path: string) =>
      Promise.resolve(
        envelope(path === "/packages" ? [packageDto] : currentDto),
      ),
    );

    const summary = await rewardsApi.getSummary("user-1");

    expect(get).toHaveBeenCalledWith("/packages");
    expect(get).toHaveBeenCalledWith("/packages/current");
    expect(summary).toEqual({
      tierPoints: 0,
      balance: 0,
      tiers: [
        {
          id: "7",
          name: "البرونزية",
          iconUrl: packageDto.icon_url,
          colors: { high: "#F3C29B", medium: "#C8794A", low: "#7A3E1D" },
          startPoints: 1000,
          endPoints: 4999,
          perks: [
            { key: "bronze_welcome", title: "Welcome", code: null },
            { key: "new_perk", title: "New perk", code: "WELCOME" },
          ],
        },
      ],
    });
    expect(rewardsOverview(summary).current.id).toBe("7");
  });

  it("reads E8 for a tier detail and preserves backend-owned copy", async () => {
    get.mockResolvedValueOnce(envelope(packageDto));
    await expect(rewardsApi.getTier("user-1", "7")).resolves.toMatchObject({
      id: "7",
      name: packageDto.name,
      perks: [{ key: "bronze_welcome" }, { code: "WELCOME" }],
    });
    expect(get).toHaveBeenCalledWith("/packages/7");
  });

  it("accepts E7 when the customer has reached a package", async () => {
    get.mockImplementation((path: string) =>
      Promise.resolve(
        envelope(
          path === "/packages"
            ? [packageDto]
            : {
                ...currentDto,
                level_points: 1200,
                can_replaced_points: 800,
                current_package: { ...packageDto, current_package: true },
                other_packages: [],
              },
        ),
      ),
    );
    await expect(rewardsApi.getSummary("user-1")).resolves.toMatchObject({
      tierPoints: 1200,
      balance: 800,
    });
  });

  it("maps E8 404 to null and skips malformed route ids", async () => {
    const missing = new AppError("not_found", undefined, 404);
    get.mockRejectedValueOnce(missing);
    await expect(rewardsApi.getTier("user-1", "999")).resolves.toBeNull();
    await expect(
      rewardsApi.getTier("user-1", "invalid-id"),
    ).resolves.toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed package data and an empty catalog", async () => {
    for (const packages of [[], [{ ...packageDto, high_color: "red" }]]) {
      get.mockImplementation((path: string) =>
        Promise.resolve(envelope(path === "/packages" ? packages : currentDto)),
      );
      await expect(rewardsApi.getSummary("user-1")).rejects.toEqual(
        new AppError("server"),
      );
    }
  });

  it("rejects malformed E7 balances", async () => {
    get.mockImplementation((path: string) =>
      Promise.resolve(
        envelope(
          path === "/packages"
            ? [packageDto]
            : { ...currentDto, can_replaced_points: "0" },
        ),
      ),
    );
    await expect(rewardsApi.getSummary("user-1")).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("propagates a transport 401 unchanged", async () => {
    const error = new AppError("unauthorized");
    get.mockRejectedValueOnce(error);
    await expect(rewardsApi.getTier("user-1", "7")).rejects.toBe(error);
  });

  it("reads E9 catalog items and balance from one response", async () => {
    get.mockResolvedValueOnce(envelope({
      can_replaced_points: 500,
      discount_cards: [
        { id: 5, discount_value: 50, points_count: 1000 },
        { id: 6, discount_value: 100, points_count: 1900 },
      ],
    }));

    await expect(rewardsApi.getCatalog("user-1")).resolves.toEqual({
      balance: 500,
      items: [
        { id: "5", discountAmount: 50, pointsCost: 1000, validityDays: 90 },
        { id: "6", discountAmount: 100, pointsCost: 1900, validityDays: 90 },
      ],
    });
    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith("/discount-cards");
  });

  it("accepts an empty E9 catalog and rejects malformed card data", async () => {
    get.mockResolvedValueOnce(envelope({ can_replaced_points: 0, discount_cards: [] }));
    await expect(rewardsApi.getCatalog("user-1")).resolves.toEqual({
      balance: 0,
      items: [],
    });
    get.mockResolvedValueOnce(envelope({
      can_replaced_points: 0,
      discount_cards: [{ id: 5, discount_value: 50, points_count: "1000" }],
    }));
    await expect(rewardsApi.getCatalog("user-1")).rejects.toEqual(new AppError("server"));
  });

  it("propagates E9 transport errors unchanged", async () => {
    const error = new AppError("unauthorized");
    get.mockRejectedValueOnce(error);
    await expect(rewardsApi.getCatalog("user-1")).rejects.toBe(error);
  });

  it("keeps card and redemption methods on their mock for later fractions", () => {
    expect(rewardsApi.getCards).toBe(rewardsMock.getCards);
    expect(rewardsApi.redeem).toBe(rewardsMock.redeem);
  });
});
