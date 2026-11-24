import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MOCK_REFERRAL_HISTORY } from "@/services/mocks/referrals";
import { renderWithIntl } from "@/shared/test/render";
import ReferralHistoryPage from "./ReferralHistoryPage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

describe("ReferralHistoryPage", () => {
  it("shows the total, the counts, and each invite's status", () => {
    renderWithIntl(<ReferralHistoryPage history={MOCK_REFERRAL_HISTORY} />);

    expect(screen.getByText("1000 points")).toBeInTheDocument();
    expect(screen.getByText("3 invites · 2 completed")).toBeInTheDocument();

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(
      within(rows[0]).getByText("Waiting for first booking"),
    ).toBeInTheDocument();
    // A pending invite has no reward badge yet.
    expect(within(rows[0]).queryByText(/\+\d+ points/)).not.toBeInTheDocument();
    expect(within(rows[1]).getByText("+500 points")).toBeInTheDocument();
    expect(within(rows[1]).getByText("October 30, 2026")).toBeInTheDocument();
  });

  it("links to the points history", () => {
    renderWithIntl(<ReferralHistoryPage history={MOCK_REFERRAL_HISTORY} />);
    expect(
      screen.getByRole("link", { name: "View points history" }),
    ).toHaveAttribute("href", "/account/points");
  });

  it("shows the empty state with a way back to inviting", () => {
    renderWithIntl(
      <ReferralHistoryPage history={{ totalPoints: 0, invites: [] }} />,
    );

    expect(
      screen.getByRole("heading", { name: "Your first invite starts here" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Invite a friend" }),
    ).toHaveAttribute("href", "/account/referrals");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
