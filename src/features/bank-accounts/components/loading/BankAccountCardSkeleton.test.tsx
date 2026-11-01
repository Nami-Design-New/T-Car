import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BankAccountCardSkeleton from "./BankAccountCardSkeleton";

describe("BankAccountCardSkeleton", () => {
  it("is hidden from assistive technology and has no controls", () => {
    const { container } = render(<BankAccountCardSkeleton variant="option" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("button")).toBeNull();
  });

  it("uses a round logo bone for the picker and a wide one for the tab", () => {
    const option = render(<BankAccountCardSkeleton variant="option" />);
    expect(option.container.querySelector(".skeleton--circle")).not.toBeNull();

    const listed = render(<BankAccountCardSkeleton />);
    expect(listed.container.querySelector(".skeleton--rect")).not.toBeNull();
  });
});
