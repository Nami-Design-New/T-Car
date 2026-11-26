import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionResult } from "@/shared/lib/result";
import { renderWithIntl } from "@/shared/test/render";
import type { RewardCatalogData, RewardRedemption } from "../model";

const { redeemRewardAction, router } = vi.hoisted(() => ({
  redeemRewardAction:
    vi.fn<(itemId: string) => Promise<ActionResult<RewardRedemption>>>(),
  router: { refresh: vi.fn() },
}));

vi.mock("../actions", () => ({ redeemRewardAction }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
  useRouter: () => router,
}));

import CatalogPage from "./CatalogPage";

const items: RewardCatalogData["items"] = [
  {
    id: "discount-50",
    discountAmount: 50,
    pointsCost: 1000,
    canReplace: true,
    validityDays: 90,
  },
  {
    id: "discount-100",
    discountAmount: 100,
    pointsCost: 1900,
    canReplace: true,
    validityDays: 90,
  },
  {
    id: "discount-200",
    discountAmount: 200,
    pointsCost: 3800,
    canReplace: true,
    validityDays: 90,
  },
];

const receipt: RewardRedemption = {
  card: {
    id: "redeemed-discount-50",
    code: "TCAR-305-Q9LD",
    discountAmount: 50,
    status: "active",
    expiresAt: "2027-01-18T00:00:00.000Z",
  },
  pointsCost: 1000,
  balanceBefore: 4000,
  balanceAfter: 3000,
  tierPoints: 12000,
  tierId: "3",
  tierName: "Gold",
};

beforeEach(() => {
  vi.clearAllMocks();
});

function openRedemption(balance = 4000) {
  const user = userEvent.setup();
  renderWithIntl(<CatalogPage data={{ balance, items }} />);
  return {
    user,
    redeem: screen.getByRole("button", {
      name: "Redeem the 50 SAR discount card",
    }),
  };
}

describe("CatalogPage", () => {
  it("shows the balance and all three cards in the design order", () => {
    renderWithIntl(<CatalogPage data={{ balance: 4000, items }} />);

    expect(screen.getByText("4,000")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Points history" }),
    ).toHaveAttribute("href", "/account/points");
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(
      within(cards[0]).getByRole("heading", {
        name: "Discount card worth 50 Saudi riyals",
      }),
    ).toBeInTheDocument();
    expect(
      within(cards[1]).getByRole("heading", {
        name: "Discount card worth 100 Saudi riyals",
      }),
    ).toBeInTheDocument();
    expect(
      within(cards[2]).getByRole("heading", {
        name: "Discount card worth 200 Saudi riyals",
      }),
    ).toBeInTheDocument();
    expect(cards[0].querySelectorAll('img[src="/icons/sar.svg"]')).toHaveLength(
      2,
    );
    expect(within(cards[2]).getByText("3,800")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("marks the cards the API flags as unavailable and disables them", () => {
    // The balance covers every card; only the API's per-card flag disables.
    const flagged = items.map((item, index) => ({
      ...item,
      canReplace: index === 0,
    }));
    renderWithIntl(<CatalogPage data={{ balance: 4000, items: flagged }} />);

    const cards = screen.getAllByRole("article");
    expect(
      within(cards[0]).getByText("Enough points to redeem"),
    ).toBeInTheDocument();
    expect(within(cards[0]).getByRole("button")).toBeEnabled();
    expect(within(cards[1]).getAllByText("Not enough points")).toHaveLength(2);
    expect(within(cards[2]).getAllByText("Not enough points")).toHaveLength(2);
    expect(
      within(cards[1]).getByRole("button", {
        name: "Redeem the 100 SAR discount card",
      }),
    ).toBeDisabled();
    expect(
      within(cards[2]).getByRole("button", {
        name: "Redeem the 200 SAR discount card",
      }),
    ).toBeDisabled();
  });

  it("shows an empty state when the catalog has no cards", () => {
    renderWithIntl(<CatalogPage data={{ balance: 0, items: [] }} />);

    expect(screen.getByText("No cards available")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("opens the confirmation with the balance before, the cost and the balance after", async () => {
    const { user, redeem } = openRedemption();

    await user.click(redeem);

    const dialog = screen.getByRole("dialog", { name: "Confirm redemption" });
    expect(within(dialog).getByText("4,000 points")).toBeInTheDocument();
    expect(within(dialog).getByText("−1,000 points")).toBeInTheDocument();
    expect(within(dialog).getByText("3,000 points")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Valid for 90 days from redemption"),
    ).toBeInTheDocument();
  });

  it("opens the success dialog with the new card and links, and closing it returns to the catalog", async () => {
    redeemRewardAction.mockResolvedValue({ ok: true, data: receipt });
    const { user, redeem } = openRedemption();

    await user.click(redeem);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirm redemption",
      }),
    );

    const success = await screen.findByRole("dialog", {
      name: "Redeemed successfully!",
    });
    expect(redeemRewardAction).toHaveBeenCalledWith("discount-50");
    expect(router.refresh).toHaveBeenCalled();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(within(success).getByText("TCAR-305-Q9LD")).toBeInTheDocument();
    expect(
      within(success).getByText("Redeemable balance: 3,000 points"),
    ).toBeInTheDocument();
    expect(
      within(success).getByText(
        "Your Gold tier stays the same · 12,000 tier points",
      ),
    ).toBeInTheDocument();
    expect(
      within(success).getByRole("link", { name: "View my cards" }),
    ).toHaveAttribute("href", "/account/rewards/cards");
    expect(
      within(success).getByRole("link", { name: "Back to rewards" }),
    ).toHaveAttribute("href", "/account/rewards");

    await user.click(within(success).getByRole("button", { name: "Close" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByRole("article")).toHaveLength(3);
    await waitFor(() => expect(redeem).toHaveFocus());
  });

  it("locks the dialog while the redemption is pending and sends it once", async () => {
    let resolve!: (result: ActionResult<RewardRedemption>) => void;
    redeemRewardAction.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { user, redeem } = openRedemption();

    await user.click(redeem);
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", {
      name: "Confirm redemption",
    });
    await user.dblClick(confirm);

    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute("aria-busy", "true");
    expect(
      within(dialog).getByRole("button", { name: "Cancel" }),
    ).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(redeemRewardAction).toHaveBeenCalledTimes(1);

    resolve({ ok: true, data: receipt });
    expect(
      await screen.findByRole("dialog", { name: "Redeemed successfully!" }),
    ).toBeInTheDocument();
  });

  it("shows the network error in the dialog", async () => {
    redeemRewardAction.mockResolvedValue({
      ok: false,
      error: { kind: "network", code: "rewards.unavailable" },
    });
    const { user, redeem } = openRedemption();

    await user.click(redeem);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirm redemption",
      }),
    );

    expect(
      await within(screen.getByRole("dialog")).findByRole("alert"),
    ).toHaveTextContent(
      "Your rewards are temporarily unavailable. Try again shortly.",
    );
  });

  it("keeps the dialog open with the error when the redemption fails", async () => {
    redeemRewardAction.mockResolvedValue({
      ok: false,
      error: { kind: "conflict", code: "rewards.insufficientPoints" },
    });
    const { user, redeem } = openRedemption();

    await user.click(redeem);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirm redemption",
      }),
    );

    const dialog = screen.getByRole("dialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "You do not have enough points for this card.",
    );
    expect(router.refresh).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Redeemed successfully!" }),
    ).not.toBeInTheDocument();
  });

  it("closes the dialog on Cancel without redeeming", async () => {
    const { user, redeem } = openRedemption();

    await user.click(redeem);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(redeemRewardAction).not.toHaveBeenCalled();
  });
});
