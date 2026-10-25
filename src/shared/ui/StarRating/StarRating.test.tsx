import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StarRating } from "./StarRating";

function StatefulRating() {
  const [rating, setRating] = useState(0);
  return (
    <StarRating
      label="Showroom rating"
      value={rating}
      onChange={setRating}
      starLabel={(count) => `${count} stars`}
    />
  );
}

describe("StarRating", () => {
  it("exposes a labelled radio group and selects a rating", async () => {
    const user = userEvent.setup();
    render(<StatefulRating />);

    expect(
      screen.getByRole("radiogroup", { name: "Showroom rating" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(screen.getByRole("radio", { name: "4 stars" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("supports moving the rating with arrow keys", async () => {
    const user = userEvent.setup();
    render(<StatefulRating />);

    const first = screen.getByRole("radio", { name: "1 stars" });
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "2 stars" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "2 stars" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("reports clicks to a controlled owner", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <StarRating
        label="Driver rating"
        value={0}
        onChange={onChange}
        starLabel={(count) => `${count} stars`}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
