import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MOCK_POINTS_DATA } from "../api.mock";
import { renderWithIntl } from "@/shared/test/render";
import PointsPage from "./PointsPage";

const replace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
  useRouter: () => ({ replace }),
}));

describe("PointsPage", () => {
  it("shows the three balances and groups API titles", () => {
    renderWithIntl(<PointsPage data={MOCK_POINTS_DATA} filter="all" />);
    expect(
      screen.getByText("Tier points").closest("div")!.textContent,
    ).toContain("12,000");
    expect(
      screen.getByText("Available to redeem").closest("div")!.textContent,
    ).toContain("4,000");
    expect(
      screen.getByText("Last redemption").closest("div")!.textContent,
    ).toContain("1,000");
    const latest = screen.getByRole("heading", {
      name: "Latest activity",
    }).parentElement!;
    expect(within(latest).getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByText("Redeemed a 50 SAR discount card"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "September 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "August 2026" }),
    ).toBeInTheDocument();
  });

  it("links booking, rating, and referral titles by source", () => {
    renderWithIntl(<PointsPage data={MOCK_POINTS_DATA} filter="all" />);
    expect(screen.getByText("Booking reward").closest("a")).toHaveAttribute(
      "href",
      "/account/bookings/2363",
    );
    expect(screen.getByText("Rating reward").closest("a")).toHaveAttribute(
      "href",
      "/account/bookings/2363",
    );
    expect(screen.getByText("Referral reward").closest("a")).toHaveAttribute(
      "href",
      "/account/referrals/history",
    );
    expect(screen.getByText("Redeemed points").closest("a")).toBeNull();
  });

  it("navigates to the URL filter without scrolling", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PointsPage data={MOCK_POINTS_DATA} filter="all" />);
    await user.click(screen.getByRole("tab", { name: "Used" }));
    expect(replace).toHaveBeenCalledWith("/account/points?filter=spent", {
      scroll: false,
    });
    await user.click(screen.getByRole("tab", { name: "Earned" }));
    expect(replace).toHaveBeenCalledWith("/account/points?filter=earned", {
      scroll: false,
    });
    await user.click(screen.getByRole("tab", { name: "All" }));
    expect(replace).toHaveBeenCalledWith("/account/points", { scroll: false });
  });

  it.each([
    ["all", "No points activity yet"],
    ["earned", "You have not earned points yet"],
    ["spent", "You have not used points yet"],
  ] as const)("shows the %s empty state", (filter, title) => {
    renderWithIntl(
      <PointsPage
        data={{
          summary: { tierPoints: 0, balance: 0, lastRedemption: null },
          page: { items: [], page: 1, lastPage: 1, total: 0 },
        }}
        filter={filter}
      />,
    );
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(
      screen.getByText("Last redemption").closest("div")!.textContent,
    ).toContain("—");
  });
});
