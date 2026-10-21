import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";
import { renderWithIntl } from "@/shared/test/render";
import { ok } from "@/shared/lib/result";
import BookingReviewModal from "./BookingReviewModal";

describe("BookingReviewModal", () => {
  it("submits the selected rating and normalized review text", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(ok(undefined));
    const onClose = vi.fn();

    renderWithIntl(
      <BookingReviewModal onSubmit={onSubmit} onClose={onClose} />,
    );

    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    await user.type(
      screen.getByRole("textbox", { name: "Review" }),
      "  Helpful showroom  ",
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalledWith({
      rating: 4,
      review: "Helpful showroom",
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the dialog open and the entered text after a failed submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      error: new AppError("conflict", "bookings.notActive"),
    });

    renderWithIntl(
      <BookingReviewModal onSubmit={onSubmit} onClose={vi.fn()} />,
    );

    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    const textbox = screen.getByRole("textbox", { name: "Review" });
    await user.type(textbox, "Still here");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This booking is no longer active.",
    );
    expect(textbox).toHaveValue("Still here");
  });
});
