import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import arMessages from "../../../../messages/ar.json";
import { rewardsOverview, type RewardsSummary } from "../model";
import RewardsPage from "./RewardsPage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

const tiers: RewardsSummary["tiers"] = [
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
        title: "You've just started, champ!",
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
        title: "100 bonus points every month",
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
        title: "Monthly discount code",
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
        key: "vip_support_24h",
        title: "24/7 VIP support",
      },
    ],
  },
];

const home = (
  tierPoints: number,
  balance: number,
  roadTiers = tiers,
) => ({
  tierPoints,
  balance,
  currentTier: rewardsOverview({ tierPoints, balance, tiers: roadTiers }).current,
  roadTiers,
});

describe("RewardsPage", () => {
  it("renders the current tier, progress, balance, perks, and destinations", () => {
    renderWithIntl(
      <RewardsPage data={home(5000, 5000)} />,
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
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      "/account/rewards/tiers/2",
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
        data={home(
          1000,
          1000,
          tiers.map((tier) =>
            tier.id === "1" ? { ...tier, perks: [] } : tier,
          ),
        )}
      />,
    );

    expect(screen.getByText("You have just started!")).toBeInTheDocument();
    expect(
      screen.getByText(/Collect 5,000 points to unlock Silver benefits/),
    ).toBeInTheDocument();
  });

  it("centres the road car between the current and next packages", () => {
    renderWithIntl(
      <RewardsPage data={home(12000, 12000)} />,
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
      <RewardsPage data={home(1000, 1000)} />,
    );
    expect(screen.getByText("You've just started, champ!")).toBeInTheDocument();
  });

  it("renders the top tier as complete without a next-tier chip", () => {
    renderWithIntl(
      <RewardsPage data={home(25000, 5000)} />,
    );

    expect(screen.getAllByText("Diamond")).toHaveLength(2);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Highest tier reached")).toBeInTheDocument();
    expect(screen.queryByText(/points to/)).not.toBeInTheDocument();
  });

  it("renders an extra API-shaped tier and unknown perk key", () => {
    const extra = {
      ...tiers[3],
      id: "73",
      name: "Platinum",
      iconUrl: "/custom-platinum.webp",
      startPoints: 30000,
      endPoints: 49999,
      perks: [{ key: "future_perk", title: "A new benefit" }],
    };
    const { container } = renderWithIntl(
      <RewardsPage data={home(32000, 5000, [...tiers, extra])} />,
    );
    expect(screen.getAllByText("Platinum")).toHaveLength(2);
    expect(screen.getByText("A new benefit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      "/account/rewards/tiers/73",
    );
    expect(container.querySelector('img[src="/custom-platinum.webp"]')).toBeInTheDocument();
  });

  it("uses package colours for the hero and badge gradients", () => {
    const colors = { high: "#112233", medium: "#445566", low: "#778899" };
    const customTiers = tiers.map((tier) =>
      tier.id === "2" ? { ...tier, colors } : tier,
    );
    renderWithIntl(
      <RewardsPage
        data={home(5000, 5000, customTiers)}
      />,
    );
    const hero = screen.getByRole("link", { name: /Your current tier\s*Silver/ });
    expect(hero).toHaveStyle({
      background: "linear-gradient(150deg, #112233 14%, #445566 52%, #778899 88%)",
    });
    expect(hero.querySelector('[style*="clip-path"]')).toHaveStyle({
      background: "linear-gradient(150deg, #112233, #445566, #778899)",
    });
  });

  it("names the next tier with the Arabic preposition", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <RewardsPage
          data={home(
            5000,
            5000,
            tiers.map((tier) =>
              tier.id === "3" ? { ...tier, name: "الذهبية" } : tier,
            ),
          )}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText(/نقطة للوصول إلى الذهبية/)).toBeInTheDocument();
  });
});
