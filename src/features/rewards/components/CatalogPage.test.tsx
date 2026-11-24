import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { RewardCatalogData } from "../model";
import CatalogPage from "./CatalogPage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

const items: RewardCatalogData["items"] = [
  { id: "discount-50", discountAmount: 50, pointsCost: 1000 },
  { id: "discount-100", discountAmount: 100, pointsCost: 1900 },
  { id: "discount-200", discountAmount: 200, pointsCost: 3800 },
];

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
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("marks cards above the balance as unavailable", () => {
    renderWithIntl(<CatalogPage data={{ balance: 1000, items }} />);

    const cards = screen.getAllByRole("article");
    expect(
      within(cards[0]).getByText("Enough points to redeem"),
    ).toBeInTheDocument();
    expect(within(cards[1]).getAllByText("Not enough points")).toHaveLength(2);
    expect(within(cards[2]).getAllByText("Not enough points")).toHaveLength(2);
  });

  it("shows an empty state when the catalog has no cards", () => {
    renderWithIntl(<CatalogPage data={{ balance: 0, items: [] }} />);

    expect(screen.getByText("No cards available")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
