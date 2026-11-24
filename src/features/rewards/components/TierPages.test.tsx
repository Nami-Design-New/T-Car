import { screen, within } from "@testing-library/react";
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
      id: "bronze",
      threshold: 1000,
      perks: [
        {
          id: "bronze-1",
          title: "توك بديت يا وحش",
          icon: "sparkle",
        },
      ],
    },
    {
      id: "silver",
      threshold: 5000,
      perks: [
        {
          id: "silver-1",
          title: "Silver benefit",
          description: "Silver detail",
          icon: "calendar",
        },
      ],
    },
    {
      id: "gold",
      threshold: 10000,
      perks: [
        {
          id: "gold-1",
          title: "Gold benefit",
          description: "Gold detail",
          icon: "tag",
        },
      ],
    },
    {
      id: "diamond",
      threshold: 20000,
      perks: [
        {
          id: "diamond-1",
          title: "Diamond benefit",
          description: "Diamond detail",
          icon: "gift",
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
      "/account/rewards/tiers/gold",
    );
    const cards = screen.getAllByRole("article");
    expect(within(cards[1]).getByText("50%")).toBeInTheDocument();
    for (const index of [0, 2, 3]) {
      expect(within(cards[index]).queryByText("50%")).not.toBeInTheDocument();
    }
    expect(within(cards[2]).getByText("Locked")).toBeInTheDocument();
  });
  it("shows selected tab and upcoming perks for the current tier", () => {
    renderWithIntl(<TierDetailPage summary={summary} tierId="silver" />);
    expect(screen.getByRole("link", { name: "Silver" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Unlocks at Gold")).toBeInTheDocument();
    expect(screen.getByText("Gold detail")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });
  it("shows earning guidance before locked perks", () => {
    renderWithIntl(<TierDetailPage summary={summary} tierId="gold" />);
    expect(screen.getByText("How to earn points")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Invite a friend/ }),
    ).toHaveAttribute("href", "/account/referrals");
    expect(screen.getByText("Gold benefit")).toBeInTheDocument();
    expect(
      screen.getByText("/ 10,000 tier points").parentElement,
    ).toHaveTextContent(/5,000\s*\/ 10,000 tier points/);
    expect(screen.getByText("5,000 points to Gold")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });
  it("uses neutral copy for a reached tier with no perks", () => {
    renderWithIntl(
      <TierDetailPage
        summary={{
          ...summary,
          tiers: summary.tiers.map((tier) =>
            tier.id === "bronze" ? { ...tier, perks: [] } : tier,
          ),
        }}
        tierId="bronze"
      />,
    );
    expect(screen.getByText("Tier reached")).toBeInTheDocument();
    expect(
      screen.queryByText("You have just started!"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("This tier has no perks")).toBeInTheDocument();
    expect(screen.queryByText(/Collect 5,000 points/)).not.toBeInTheDocument();
    expect(screen.queryByText("How to earn points")).not.toBeInTheDocument();
  });
  it("shows the Bronze welcome perk with an unlocked check", () => {
    renderWithIntl(<TierDetailPage summary={summary} tierId="bronze" />);
    expect(screen.getByText("توك بديت يا وحش")).toBeInTheDocument();
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
  });
  it("shows unlocked perks for a reached tier without earning guidance", () => {
    renderWithIntl(
      <TierDetailPage
        summary={{ ...summary, tierPoints: 12000 }}
        tierId="silver"
      />,
    );
    expect(screen.getByText("Tier reached")).toBeInTheDocument();
    expect(screen.getByText("From 5,000 points")).toBeInTheDocument();
    expect(screen.getByText("Unlocked")).toBeInTheDocument();
    expect(screen.queryByText("How to earn points")).not.toBeInTheDocument();
  });
  it("does not show an unlock section for the current top tier", () => {
    renderWithIntl(
      <TierDetailPage
        summary={{ ...summary, tierPoints: 25000 }}
        tierId="diamond"
      />,
    );
    expect(screen.queryByText(/Unlocks at/)).not.toBeInTheDocument();
  });
});
