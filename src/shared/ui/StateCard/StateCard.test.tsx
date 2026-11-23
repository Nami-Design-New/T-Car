import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StateCard } from "./StateCard";

describe("StateCard", () => {
  it("shows the title, the description, and the action", () => {
    render(
      <StateCard
        icon="gift"
        title="Nothing here yet"
        description="Share your code."
        action={<button type="button">Invite</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nothing here yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Share your code.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite" })).toBeInTheDocument();
  });

  it("announces a failure when given the alert role", () => {
    render(<StateCard icon="info" title="Could not load" role="alert" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load");
  });

  it("keeps the icon out of the accessibility tree", () => {
    const { container } = render(
      <StateCard icon="info" title="Could not load" />,
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});
