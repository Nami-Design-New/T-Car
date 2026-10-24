import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import type { BookingDetails } from "../model";
import BookingConfirmModal from "./BookingConfirmModal";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

function booking(): BookingDetails {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return {
    startDate,
    endDate,
    time: "9:00 AM",
    days: 1,
    pricePerDay: 500,
    subtotal: 500,
    vat: 75,
    total: 575,
    notes: "",
  };
}

function renderModal() {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  renderWithIntl(
    <BookingConfirmModal
      open
      onClose={vi.fn()}
      onBack={vi.fn()}
      onContinue={onContinue}
      carName="Creta"
      carBrand="Hyundai"
      carYear={2024}
      showroomLogo="/mock/offices/office-1.webp"
      carImage="https://example.com/creta.jpg"
      showroom="Riyadh branch"
      rating={4.5}
      booking={booking()}
    />,
  );
  return { user, onContinue };
}

describe("BookingConfirmModal", () => {
  it("requires terms before continuing to payment", async () => {
    const { user, onContinue } = renderModal();
    await user.click(
      screen.getByRole("button", { name: "Continue to payment" }),
    );

    expect(
      await screen.findByText("Accept the terms and conditions to continue"),
    ).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("submits terms acceptance with the keyboard", async () => {
    const { user, onContinue } = renderModal();
    await user.click(
      screen.getByRole("checkbox", { name: /I agree to all requirements/ }),
    );
    await user.tab();
    await user.keyboard("{Enter}");

    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("keeps the confirmation content scrollable inside the dialog body", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    const form = dialog.querySelector("form");
    const body = form?.parentElement?.parentElement;
    const scrollArea = form?.firstElementChild;

    expect(body).toHaveClass("overflow-hidden");
    expect(form).toHaveClass("min-h-0");
    expect(scrollArea).toHaveClass("min-h-0", "overflow-y-auto");
  });
});
