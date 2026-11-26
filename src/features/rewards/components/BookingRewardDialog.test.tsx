import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import BookingRewardDialog from "./BookingRewardDialog";
import ar from "../../../../messages/ar.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a">) => <a href={href} {...props} />,
}));

describe("BookingRewardDialog", () => {
  it("renders the Arabic labels and actions in an RTL context", () => {
    render(<NextIntlClientProvider locale="ar" messages={ar}><div dir="rtl"><BookingRewardDialog reward={{ earnedPoints: 200, tierPoints: 5000, balance: 5000 }} /></div></NextIntlClientProvider>);
    expect(screen.getByRole("dialog", { name: "اكتمال الحجز" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "عرض رصيد المكافآت" })).toHaveAttribute("href", "/account/rewards");
    expect(screen.getByRole("link", { name: "استبدال النقاط" })).toHaveAttribute("href", "/account/rewards/catalog");
  });
  it("shows the awarded points, balances and rewards links, and can be closed", async () => {
    renderWithIntl(<BookingRewardDialog reward={{ earnedPoints: 200, tierPoints: 5000, balance: 4500 }} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("+200")).toHaveLength(2);
    expect(screen.getByText("Tier points: 5,000 points")).toBeInTheDocument();
    expect(screen.getByText("Redeemable balance: 4,500 points")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View rewards balance" })).toHaveAttribute("href", "/account/rewards");
    expect(screen.getByRole("link", { name: "Redeem points" })).toHaveAttribute("href", "/account/rewards/catalog");
    await userEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
