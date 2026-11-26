import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/services/http/server", () => ({ serverHttp: { get, post } }));

import { rewardsApi } from "./api";
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
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("builds the overview and road from E7 alone without duplicating the current tier", async () => {
    get.mockResolvedValueOnce(
      envelope({
        ...currentDto,
        level_points: 1200,
        current_package: { ...packageDto, current_package: true },
        other_packages: [
          {
            ...currentDto.other_packages[0],
            high_color: "#F3C29B",
            medium_color: "#C8794A",
            low_color: "#7A3E1D",
          },
          {
            id: 8,
            name: "Gold",
            icon_url: "https://admin.t-car.app/storage/gold.png",
            start_points: 5000,
          },
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
    get.mockResolvedValueOnce(
      envelope({
        can_replaced_points: 500,
        discount_cards: [
          { id: 5, discount_value: 50, points_count: 1000, can_replace: true },
          {
            id: 6,
            discount_value: 100,
            points_count: 1900,
            can_replace: false,
          },
        ],
      }),
    );

    await expect(rewardsApi.getCatalog("user-1")).resolves.toEqual({
      balance: 500,
      items: [
        {
          id: "5",
          discountAmount: 50,
          pointsCost: 1000,
          canReplace: true,
          validityDays: 90,
        },
        {
          id: "6",
          discountAmount: 100,
          pointsCost: 1900,
          canReplace: false,
          validityDays: 90,
        },
      ],
    });
    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith("/discount-cards");
  });

  it("accepts an empty E9 catalog and rejects malformed card data", async () => {
    get.mockResolvedValueOnce(
      envelope({ can_replaced_points: 0, discount_cards: [] }),
    );
    await expect(rewardsApi.getCatalog("user-1")).resolves.toEqual({
      balance: 0,
      items: [],
    });
    get.mockResolvedValueOnce(
      envelope({
        can_replaced_points: 0,
        discount_cards: [
          {
            id: 5,
            discount_value: 50,
            points_count: "1000",
            can_replace: true,
          },
        ],
      }),
    );
    await expect(rewardsApi.getCatalog("user-1")).rejects.toEqual(
      new AppError("server"),
    );
    get.mockResolvedValueOnce(
      envelope({
        can_replaced_points: 0,
        discount_cards: [{ id: 5, discount_value: 50, points_count: 1000 }],
      }),
    );
    await expect(rewardsApi.getCatalog("user-1")).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("propagates E9 transport errors unchanged", async () => {
    const error = new AppError("unauthorized");
    get.mockRejectedValueOnce(error);
    await expect(rewardsApi.getCatalog("user-1")).rejects.toBe(error);
  });

  it("reads E10 with the selected filter and maps paginated cards", async () => {
    get.mockResolvedValueOnce({
      ...envelope([
        {
          id: 42,
          discount_card_id: 5,
          code: "TCAR-42",
          discount_value: 50,
          points_count: 1000,
          status: "used",
          expire_at: "2027-01-18 10:00:00",
          used_at: "2026-11-20 12:30:00",
          order_id: 2363,
        },
      ]),
      pagination: {
        current_page: 2,
        last_page: 3,
        per_page: 10,
        total: 21,
        from: 11,
        to: 20,
      },
    });
    await expect(rewardsApi.getCardsPage("user-1", 2, "used")).resolves.toEqual(
      {
        items: [
          {
            id: "42",
            code: "TCAR-42",
            discountAmount: 50,
            status: "used",
            expiresAt: "2027-01-18T10:00:00+03:00",
            usedAt: "2026-11-20T12:30:00+03:00",
            bookingId: "2363",
          },
        ],
        page: 2,
        lastPage: 3,
        total: 21,
      },
    );
    expect(get).toHaveBeenCalledWith("/my-discount-cards", {
      query: { page: 2, per_page: 10, filter: "used" },
    });
  });

  it("reads E9 balance and the unfiltered first E10 page for My Cards", async () => {
    get.mockImplementation((path: string) =>
      Promise.resolve(
        path === "/discount-cards"
          ? envelope({ can_replaced_points: 500, discount_cards: [] })
          : {
              ...envelope([]),
              pagination: { current_page: 1, last_page: 1, total: 0 },
            },
      ),
    );
    await expect(rewardsApi.getCards("user-1", "all")).resolves.toEqual({
      balance: 500,
      page: { items: [], page: 1, lastPage: 1, total: 0 },
    });
    expect(get).toHaveBeenCalledWith("/my-discount-cards", {
      query: { page: 1, per_page: 10 },
    });
  });

  it("rejects malformed E10 rows and pagination", async () => {
    const pagination = { current_page: 1, last_page: 1, total: 1 };
    get.mockResolvedValueOnce({ ...envelope([{ id: 1 }]), pagination });
    await expect(
      rewardsApi.getCardsPage("user-1", 1, "active"),
    ).rejects.toEqual(new AppError("server"));
    get.mockResolvedValueOnce({ ...envelope([]), pagination: null });
    await expect(rewardsApi.getCardsPage("user-1", 1, "all")).rejects.toEqual(
      new AppError("server"),
    );
  });

  it("reads E11 with the card id and the current tier name", async () => {
    get.mockImplementation((path: string) =>
      Promise.resolve(
        path === "/replace-points/quote"
          ? envelope({
              points_count_before: 4000,
              replace_points: 1000,
              points_count_after: 3000,
            })
          : envelope({
              ...currentDto,
              level_points: 12000,
              can_replaced_points: 4000,
              current_package: { ...packageDto, current_package: true },
            }),
      ),
    );

    await expect(
      rewardsApi.getRedemptionQuote("user-1", "5"),
    ).resolves.toEqual({
      balanceBefore: 4000,
      pointsCost: 1000,
      balanceAfter: 3000,
      tierName: packageDto.name,
    });
    expect(get).toHaveBeenCalledWith("/replace-points/quote", {
      query: { discount_card_id: "5" },
    });
    expect(get).toHaveBeenCalledWith("/packages/current");
  });

  it("rejects a malformed E11 quote", async () => {
    get.mockImplementation((path: string) =>
      Promise.resolve(
        path === "/replace-points/quote"
          ? envelope({
              points_count_before: 4000,
              replace_points: "1000",
              points_count_after: 3000,
            })
          : envelope(currentDto),
      ),
    );

    await expect(
      rewardsApi.getRedemptionQuote("user-1", "5"),
    ).rejects.toEqual(new AppError("server"));
  });

  it("propagates E11's not-enough-points error unchanged", async () => {
    const error = new AppError("validation", undefined, 400, undefined, {
      serverMessage:
        "You do not have enough replaceable points for this discount card.",
    });
    get.mockImplementation((path: string) =>
      path === "/replace-points/quote"
        ? Promise.reject(error)
        : Promise.resolve(envelope(currentDto)),
    );

    await expect(
      rewardsApi.getRedemptionQuote("user-1", "5"),
    ).rejects.toBe(error);
  });

  it("redeems with E12 POST and maps the new card and balances", async () => {
    post.mockResolvedValueOnce({
      ...envelope({
        level_points: 12000,
        can_replaced_points: 3000,
        last_replaced_points: 1000,
        discount_card: {
          id: 42,
          discount_card_id: 5,
          code: "TCAR-42",
          discount_value: 50,
          points_count: 1000,
          status: "active",
          expire_at: "2027-01-18 10:00:00",
          used_at: null,
          order_id: null,
        },
      }),
      message: "Card redeemed",
    });

    await expect(rewardsApi.redeem("user-1", "5")).resolves.toEqual({
      ok: true,
      message: "Card redeemed",
      data: {
        card: {
          id: "42",
          code: "TCAR-42",
          discountAmount: 50,
          status: "active",
          expiresAt: "2027-01-18T10:00:00+03:00",
        },
        pointsCost: 1000,
        balanceBefore: 4000,
        balanceAfter: 3000,
        tierPoints: 12000,
      },
    });
    expect(post).toHaveBeenCalledWith("/replace-points", {
      discount_card_id: 5,
    });
  });

  it("returns E12 validation failures and malformed data as a failed Result", async () => {
    const error = new AppError("validation", undefined, 400, undefined, {
      serverMessage:
        "You do not have enough replaceable points for this discount card.",
    });
    post.mockRejectedValueOnce(error);
    await expect(rewardsApi.redeem("user-1", "5")).resolves.toMatchObject({
      ok: false,
      error: { kind: "validation", serverMessage: error.serverMessage },
    });

    post.mockResolvedValueOnce(envelope({ level_points: 12000 }));
    await expect(rewardsApi.redeem("user-1", "5")).resolves.toMatchObject({
      ok: false,
      error: { kind: "server" },
    });

    await expect(
      rewardsApi.redeem("user-1", "discount-50"),
    ).resolves.toMatchObject({
      ok: false,
      error: { kind: "validation", code: "rewards.cardUnavailable" },
    });
    expect(post).toHaveBeenCalledTimes(2);
  });
});
