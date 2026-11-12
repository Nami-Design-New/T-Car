import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import ExtendDurationModal from "./ExtendDurationModal";

describe("ExtendDurationModal", () => {
  it("submits the selected number of days through the form", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onGetQuote = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        count: 2,
        carPrice: 90,
        price: 180,
        additionalServicesCost: 0,
        offerDiscount: 0,
        newDeliveryDay: "2025-01-03",
        lateFee: 0,
        lateDays: 0,
        taxType: "percent",
        taxValue: 10,
        taxAddedValue: 54,
        totalAmount: 198,
      },
    });

    renderWithIntl(
      <ExtendDurationModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        onGetQuote={onGetQuote}
        currentDays={5}
        pricePerDay={500}
        price={2500}
        returnAt="2025-01-01T10:00:00"
        status="current"
        lateHours={null}
        taxRate={5}
        taxRateType="percent"
        taxValue={125}
        finalPrice={2625}
      />,
    );

    expect(onGetQuote).not.toHaveBeenCalled();
    expect(screen.getAllByText("500").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Increase days" }));
    await waitFor(() => expect(onGetQuote).toHaveBeenCalledWith(2));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onConfirm).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ count: 2, totalAmount: 198 }),
    );
    expect(screen.getAllByText("90").length).toBeGreaterThan(0);
    expect(
      screen.getByText("The booking will end on January 3, 2025"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tax")).toBeInTheDocument();
    expect(screen.queryByText("Late fee")).not.toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("shows the late fee only for a late booking", () => {
    renderWithIntl(
      <ExtendDurationModal
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        onGetQuote={vi.fn()}
        currentDays={5}
        pricePerDay={500}
        price={2500}
        returnAt="2025-01-01T10:00:00"
        status="late"
        lateHours={25}
        taxRate={5}
        taxRateType="percent"
        taxValue={125}
        finalPrice={2625}
      />,
    );

    expect(screen.getByText("Late fee")).toHaveClass("text-status-error");
    expect(screen.getByText("2 days")).toHaveClass("text-status-error");
  });
});
