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
  { id: "bronze", threshold: 1000, perks: [] },
  {
    id: "silver",
    threshold: 5000,
    perks: ["100 bonus points every month"],
  },
  { id: "gold", threshold: 10000, perks: ["Monthly discount code"] },
  { id: "diamond", threshold: 20000, perks: ["24/7 VIP support"] },
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
    expect(screen.getAllByText("5,000").length).toBeGreaterThan(0);
    expect(
      screen.getByText("100 bonus points every month"),
    ).toBeInTheDocument();
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
      <RewardsPage summary={{ tierPoints: 1000, balance: 1000, tiers }} />,
    );

    expect(screen.getByText("You have just started!")).toBeInTheDocument();
    expect(
      screen.getByText(/Collect 5,000 points to unlock Silver benefits/),
    ).toBeInTheDocument();
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
