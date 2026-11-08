import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ReviewsRatingButton from "./ReviewsRatingButton";
import { renderWithIntl } from "@/shared/test/render";

const REVIEWS = [
  { id: "1", name: "Saad Alnajjar", rating: 5, date: "2025-12-25 10:30:00" },
];

describe("ReviewsRatingButton", () => {
  it("shows the rating and opens the reviews modal", async () => {
    renderWithIntl(
      <ReviewsRatingButton
        rating={4.9}
        reviewsCount={1}
        reviews={REVIEWS}
        className="lg:hidden"
      />,
    );

    const button = screen.getByRole("button", { name: "View all reviews" });
    expect(button).toHaveTextContent("4.9");
    expect(button).toHaveClass("lg:hidden");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Saad Alnajjar")).toBeInTheDocument();
  });
});
