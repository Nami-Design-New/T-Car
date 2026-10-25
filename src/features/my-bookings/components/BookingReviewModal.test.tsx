import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import { AppError } from "@/shared/lib/errors";
import { renderWithIntl } from "@/shared/test/render";
import { ok } from "@/shared/lib/result";
import BookingReviewModal from "./BookingReviewModal";

describe("BookingReviewModal", () => {
  it("submits separate showroom and driver ratings", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(ok(undefined));
    const onClose = vi.fn();

    renderWithIntl(
      <BookingReviewModal onSubmit={onSubmit} onClose={onClose} />,
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
      <BookingReviewModal onSubmit={onSubmit} onClose={vi.fn()} />,
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

    expect(screen.getByRole("alert")).toHaveTextContent(
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
});
