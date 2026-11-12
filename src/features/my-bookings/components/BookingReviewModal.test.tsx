import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import { AppError } from "@/shared/lib/errors";
import { renderWithIntl } from "@/shared/test/render";
import { ok } from "@/shared/lib/result";
import BookingReviewModal from "./BookingReviewModal";

const notify = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("@/shared/hooks/useNotify", () => ({
  useNotify: () => notify,
}));

describe("BookingReviewModal", () => {
  it("only asks for a showroom rating when the booking has no driver", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(
      ok({ showroomRating: 4, driverRating: null, hasDriver: false }),
    );

    renderWithIntl(
      <BookingReviewModal
        hasDriver={false}
        initialRating={{ companyRate: null, driverRate: null }}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("radiogroup", { name: "Driver rating" }),
    ).not.toBeInTheDocument();
    await user.click(
      within(
        screen.getByRole("radiogroup", { name: "Showroom rating" }),
      ).getByRole("radio", { name: "4 stars" }),
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalledWith({ showroomRating: 4 });
  });

  it("submits separate showroom and driver ratings", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(ok(undefined));
    const onClose = vi.fn();

    renderWithIntl(
      <BookingReviewModal
        hasDriver
        initialRating={{ companyRate: null, driverRate: null }}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Rate us" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(
      within(
        screen.getByRole("radiogroup", { name: "Showroom rating" }),
      ).getByRole("radio", { name: "4 stars" }),
    );
    await user.click(
      within(
        screen.getByRole("radiogroup", { name: "Driver rating" }),
      ).getByRole("radio", { name: "5 stars" }),
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalledWith({
      showroomRating: 4,
      driverRating: 5,
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the dialog open and the selected ratings after a failed submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      error: new AppError("conflict", "bookings.notActive"),
    });

    renderWithIntl(
      <BookingReviewModal
        hasDriver
        initialRating={{ companyRate: null, driverRate: null }}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    await user.click(
      within(
        screen.getByRole("radiogroup", { name: "Showroom rating" }),
      ).getByRole("radio", { name: "5 stars" }),
    );
    await user.click(
      within(
        screen.getByRole("radiogroup", { name: "Driver rating" }),
      ).getByRole("radio", { name: "4 stars" }),
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(notify.error).toHaveBeenCalledWith(
      "This booking is no longer active.",
    );
    expect(
      within(
        screen.getByRole("radiogroup", { name: "Showroom rating" }),
      ).getByRole("radio", { name: "5 stars" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(
        screen.getByRole("radiogroup", { name: "Driver rating" }),
      ).getByRole("radio", { name: "4 stars" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("toasts the backend validation message", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, {
        serverMessage: "Please select a valid showroom rating.",
      }),
    });

    renderWithIntl(
      <BookingReviewModal
        hasDriver={false}
        initialRating={{ companyRate: null, driverRate: null }}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    await user.click(
      within(
        screen.getByRole("radiogroup", { name: "Showroom rating" }),
      ).getByRole("radio", { name: "4 stars" }),
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(notify.error).toHaveBeenCalledWith(
      "Please select a valid showroom rating.",
    );
  });
});
