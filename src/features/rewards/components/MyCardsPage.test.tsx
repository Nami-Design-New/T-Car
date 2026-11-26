import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { RewardCardsData } from "../model";
import MyCardsPage from "./MyCardsPage";

const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const replace = vi.hoisted(() => vi.fn());
vi.mock("../actions", () => ({ getRewardCardsPageAction: vi.fn() }));
vi.mock("@/shared/hooks/useNotify", () => ({ useNotify: () => notify }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  Link: ({ href, ...props }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));

const data: RewardCardsData = {
  balance: 4000,
  page: {
    page: 1,
    lastPage: 1,
    total: 3,
    items: [
      {
        id: "active",
        code: "TCAR-30S-Q9LD",
        discountAmount: 50,
        status: "active",
        expiresAt: "2027-01-18T00:00:00.000Z",
      },
      {
        id: "used",
        code: "TCAR-962-M2PA",
        discountAmount: 50,
        status: "used",
        usedAt: "2026-10-20T00:00:00.000Z",
        bookingId: "2363",
      },
      {
        id: "expired",
        code: "TCAR-418-X5RB",
        discountAmount: 50,
        status: "expired",
        expiresAt: "2026-09-30T00:00:00.000Z",
      },
    ],
  },
};

describe("MyCardsPage", () => {
  it("shows the balance and all three card states", () => {
    renderWithIntl(<MyCardsPage data={data} filter="all" />);

    expect(screen.getByText("4,000")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Points history" }),
    ).toHaveAttribute("href", "/account/points");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("TCAR-30S-Q9LD")).toBeInTheDocument();
    expect(screen.getByText("TCAR-962-M2PA")).toBeInTheDocument();
    expect(screen.getByText("TCAR-418-X5RB")).toBeInTheDocument();
    expect(screen.getByText(/booking #2363/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy code TCAR-962-M2PA" }),
    ).toBeDisabled();
  });

  it("changes the server filter through the URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MyCardsPage data={data} filter="all" />);

    await user.click(screen.getByRole("tab", { name: "Used" }));
    expect(replace).toHaveBeenCalledWith("/account/rewards/cards?filter=used", {
      scroll: false,
    });

    await user.click(screen.getByRole("tab", { name: "All" }));
    expect(replace).toHaveBeenCalledWith("/account/rewards/cards", {
      scroll: false,
    });
  });

  it("shows an empty state when there are no cards", () => {
    renderWithIntl(
      <MyCardsPage
        data={{
          balance: 0,
          page: { items: [], page: 1, lastPage: 1, total: 0 },
        }}
        filter="all"
      />,
    );
    expect(screen.getByText("No cards yet")).toBeInTheDocument();
  });

  it("copies only an active code", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    renderWithIntl(<MyCardsPage data={data} filter="all" />);

    await user.click(
      screen.getByRole("button", { name: "Copy code TCAR-30S-Q9LD" }),
    );

    expect(writeText).toHaveBeenCalledWith("TCAR-30S-Q9LD");
    expect(notify.success).toHaveBeenCalledWith("Code copied");
    expect(
      screen.getByRole("button", { name: "Copy code TCAR-962-M2PA" }),
    ).toBeDisabled();
  });
});
