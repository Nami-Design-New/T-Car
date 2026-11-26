import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { RewardsSummary } from "../model";
import AllTiersPage from "./AllTiersPage";
import TierDetailPage from "./TierDetailPage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

const summary: RewardsSummary = {
  tierPoints: 5000,
  balance: 5000,
  tiers: [
    {
      id: "1",
      name: "Bronze",
      iconUrl: "/images/rewards/badge-bronze.webp",
      colors: { high: "#F3C29B", medium: "#C8794A", low: "#7A3E1D" },
      startPoints: 1000,
      endPoints: 4999,
      perks: [
        {
          key: "bronze_welcome",
          title: "توك بديت يا وحش",
          code: null,
        },
      ],
    },
    {
      id: "2",
      name: "Silver",
      iconUrl: "/images/rewards/badge-silver.webp",
      colors: { high: "#F3C29B", medium: "#C8794A", low: "#7A3E1D" },
      startPoints: 5000,
      endPoints: 9999,
      perks: [
        {
          key: "monthly_points",
          title: "Silver benefit",
          code: null,
        },
      ],
    },
    {
      id: "3",
      name: "Gold",
      iconUrl: "/images/rewards/badge-gold.webp",
      colors: { high: "#F7DB8D", medium: "#D9A21B", low: "#8B5A09" },
      startPoints: 10000,
      endPoints: 19999,
      perks: [
        {
          key: "monthly_discount_code",
          title: "Gold benefit",
          code: null,
        },
      ],
    },
    {
      id: "4",
      name: "Diamond",
      iconUrl: "/images/rewards/badge-diamond.webp",
      colors: { high: "#B9DDFF", medium: "#5596DD", low: "#174A8B" },
      startPoints: 20000,
      endPoints: 999999,
      perks: [
        {
          key: "diamond_offers",
          title: "Diamond benefit",
          code: null,
        },
      ],
    },
  ],
};

describe("reward tier pages", () => {
  it("renders reached, current, and locked cards with progress only on current", () => {
    renderWithIntl(<AllTiersPage summary={summary} />);
    expect(screen.getByText("Tier reached")).toBeInTheDocument();
    expect(screen.getByText("Your current tier")).toBeInTheDocument();
    expect(screen.getByText("Requires 10,000")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(
      screen.getByText("5,000 / 10,000 points to Gold"),
    ).toBeInTheDocument();
    expect(screen.getByText("Gold benefit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gold" })).toHaveAttribute(
      "href",
      "/account/rewards/tiers/3",
    );
    const cards = screen.getAllByRole("article");
    expect(within(cards[1]).getByText("50%")).toBeInTheDocument();
    for (const index of [0, 2, 3]) {
      expect(within(cards[index]).queryByText("50%")).not.toBeInTheDocument();
    }
    expect(within(cards[2]).getByText("Locked")).toBeInTheDocument();
  });
  it("shows selected tab and upcoming perks for the current tier", () => {
    renderWithIntl(<TierDetailPage summary={summary} tierId="2" />);
    expect(screen.getByRole("link", { name: "Silver" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Unlocks at Gold")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });
  it("opens earning guidance in a dialog from a locked tier", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TierDetailPage summary={summary} tierId="3" />);
    expect(screen.queryByText("Invite a friend")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "How to earn points" }));
    const dialog = screen.getByRole("dialog", { name: "How to earn points" });
    expect(
      within(dialog).getByRole("link", { name: /Invite a friend/ }),
    ).toHaveAttribute("href", "/account/referrals");
    expect(within(dialog).getByText("Complete a trip")).toBeInTheDocument();
    expect(within(dialog).getByText("Rate your experience")).toBeInTheDocument();
    expect(screen.getByText("Gold benefit")).toBeInTheDocument();
    expect(
      screen.getByText("/ 10,000 tier points").parentElement,
    ).toHaveTextContent(/5,000\s*\/ 10,000 tier points/);
    expect(screen.getByText("5,000 points to Gold")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("uses neutral copy for a reached tier with no perks", () => {
    renderWithIntl(
      <TierDetailPage
        summary={{
          ...summary,
          tiers: summary.tiers.map((tier) =>
            tier.id === "1" ? { ...tier, perks: [] } : tier,
          ),
        }}
        tierId="1"
      />,
    );
    expect(screen.getByText("Tier reached")).toBeInTheDocument();
    expect(
      screen.queryByText("You have just started!"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("This tier has no perks")).toBeInTheDocument();
    expect(screen.queryByText(/Collect 5,000 points/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "How to earn points" }),
    ).toBeInTheDocument();
  });
  it("shows the Bronze welcome perk with an unlocked check", () => {
    renderWithIntl(<TierDetailPage summary={summary} tierId="1" />);
    expect(screen.getByText("توك بديت يا وحش")).toBeInTheDocument();
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
  });
  it("offers the earning dialog on a reached tier", () => {
    renderWithIntl(
      <TierDetailPage
        summary={{ ...summary, tierPoints: 12000 }}
        tierId="2"
      />,
    );
    expect(screen.getByText("Tier reached")).toBeInTheDocument();
    expect(screen.getByText("From 5,000 points")).toBeInTheDocument();
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "How to earn points" }),
    ).toBeInTheDocument();
  });
  it("offers the earning dialog on the current top tier", () => {
    renderWithIntl(
      <TierDetailPage
        summary={{ ...summary, tierPoints: 25000 }}
        tierId="4"
      />,
    );
    expect(screen.queryByText(/Unlocks at/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "How to earn points" }),
    ).toBeInTheDocument();
  });
});
