import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MOCK_POINTS_DATA } from "@/services/mocks/points";
import { renderWithIntl } from "@/shared/test/render";
import PointsPage from "./PointsPage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

describe("PointsPage", () => {
  it("shows the three balances", () => {
    renderWithIntl(<PointsPage data={MOCK_POINTS_DATA} />);
    const stat = (label: string) =>
      screen.getByText(label).closest("div")!.textContent;

    expect(stat("Tier points")).toContain("5,000");
    expect(stat("Available to redeem")).toContain("4,000");
    expect(stat("Last redemption")).toContain("1,000");
  });

  it("groups movements and describes their source", () => {
    renderWithIntl(<PointsPage data={MOCK_POINTS_DATA} />);

    const latest = screen.getByRole("heading", {
      name: "Latest activity",
    }).parentElement!;
    expect(within(latest).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(latest).getByText("Redeemed a 50 SAR discount card"),
    ).toBeInTheDocument();
    expect(within(latest).getByText("−1,000")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "September 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "August 2026" }),
    ).toBeInTheDocument();
  });

  it("links a booking movement to its booking and an invite to the invite history", () => {
    renderWithIntl(<PointsPage data={MOCK_POINTS_DATA} />);

    expect(
      screen.getByText("Booking #2363 · tier points").closest("a"),
    ).toHaveAttribute("href", "/account/bookings/2363");
    expect(
      screen.getByText("Invited a friend: أحمد").closest("a"),
    ).toHaveAttribute("href", "/account/referrals/history");
    expect(screen.getByText("Expired points").closest("a")).toBeNull();
  });

  it("filters to used points, including expired ones", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PointsPage data={MOCK_POINTS_DATA} />);

    await user.click(screen.getByRole("tab", { name: "Used" }));

    expect(screen.getByRole("tab", { name: "Used" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
    expect(screen.getByText("Expired points")).toBeInTheDocument();
  });

  it("shows an empty state for a filter with nothing in it", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <PointsPage
        data={{
          summary: { tierPoints: 0, balance: 0, lastRedemption: null },
          transactions: [],
        }}
      />,
    );

    expect(screen.getByText("No points activity yet")).toBeInTheDocument();
    expect(
      screen.getByText("Last redemption").closest("div")!.textContent,
    ).toContain("—");
    await user.click(screen.getByRole("tab", { name: "Earned" }));
    expect(
      screen.getByText("You have not earned points yet"),
    ).toBeInTheDocument();
  });
});
