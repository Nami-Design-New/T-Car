import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import arMessages from "../../../../messages/ar.json";
import type { RewardsSummary } from "../model";
import RewardsPage from "./RewardsPage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

const tiers: RewardsSummary["tiers"] = [
  {
    id: "bronze",
    threshold: 1000,
    perks: [
      {
        id: "bronze-1",
        title: "You've just started, champ!",
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
        title: "100 bonus points every month",
        description: "Added automatically",
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
        title: "Monthly discount code",
        description: "Monthly",
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
        title: "24/7 VIP support",
        description: "Always",
        icon: "support",
      },
    ],
  },
];

describe("RewardsPage", () => {
  it("renders the current tier, progress, balance, perks, and destinations", () => {
    renderWithIntl(
      <RewardsPage summary={{ tierPoints: 5000, balance: 5000, tiers }} />,
    );

    expect(screen.getAllByText("Silver")).toHaveLength(2);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("5,000 points to Gold")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Your current tier\s*Silver/ }),
    ).toHaveAttribute("href", "/account/rewards/tiers");
    expect(screen.getByText("(your tier)")).toBeInTheDocument();
    expect(screen.getByText("(reached)")).toBeInTheDocument();
    expect(screen.getAllByText("(locked)")).toHaveLength(2);
    expect(screen.getByAltText("car").parentElement).toHaveStyle({
      insetInlineStart: "50%",
    });
    expect(screen.getByTestId("tier-road-fill")).toHaveStyle({ width: "50%" });
    expect(screen.getAllByText("5,000").length).toBeGreaterThan(0);
    expect(
      screen.getByText("100 bonus points every month"),
    ).toBeInTheDocument();
    expect(screen.getByText("Added automatically")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      "/account/rewards/tiers/silver",
    );
    expect(screen.getByRole("link", { name: "Redeem points" })).toHaveAttribute(
      "href",
      "/account/rewards/catalog",
    );
    expect(screen.getByRole("link", { name: "My cards" })).toHaveAttribute(
      "href",
      "/account/rewards/cards",
    );
    expect(
      screen.getAllByRole("link", { name: "Points history" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Points history" })[0],
    ).toHaveAttribute("href", "/account/points");
    expect(screen.getByRole("link", { name: "View tiers" })).toHaveAttribute(
      "href",
      "/account/rewards/tiers",
    );
  });

  it("shows the just-started state when the current tier has no perks", () => {
    renderWithIntl(
      <RewardsPage
        summary={{
          tierPoints: 1000,
          balance: 1000,
          tiers: tiers.map((tier) =>
            tier.id === "bronze" ? { ...tier, perks: [] } : tier,
          ),
        }}
      />,
    );

    expect(screen.getByText("You have just started!")).toBeInTheDocument();
    expect(
      screen.getByText(/Collect 5,000 points to unlock Silver benefits/),
    ).toBeInTheDocument();
  });

  it("centres the road car between the current and next packages", () => {
    renderWithIntl(
      <RewardsPage summary={{ tierPoints: 12000, balance: 12000, tiers }} />,
    );

    expect(screen.getByAltText("car").parentElement).toHaveStyle({
      insetInlineStart: "75%",
    });
    expect(
      parseFloat(screen.getByTestId("tier-road-fill").style.width),
    ).toBeCloseTo(250 / 3);
  });

  it("shows the English Bronze welcome perk on the overview", () => {
    renderWithIntl(
      <RewardsPage summary={{ tierPoints: 1000, balance: 1000, tiers }} />,
    );
    expect(screen.getByText("You've just started, champ!")).toBeInTheDocument();
  });

  it("renders the top tier as complete without a next-tier chip", () => {
    renderWithIntl(
      <RewardsPage summary={{ tierPoints: 25000, balance: 5000, tiers }} />,
    );

    expect(screen.getAllByText("Diamond")).toHaveLength(2);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Highest tier reached")).toBeInTheDocument();
    expect(screen.queryByText(/points to/)).not.toBeInTheDocument();
  });

  it("names the next tier with the Arabic preposition", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <RewardsPage summary={{ tierPoints: 5000, balance: 5000, tiers }} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/نقطة للذهبية$/)).toBeInTheDocument();
  });
});
