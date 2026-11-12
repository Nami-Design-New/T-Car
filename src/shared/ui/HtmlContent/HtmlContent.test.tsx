import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HtmlContent } from "./HtmlContent";

describe("HtmlContent", () => {
  it("renders sanitized rich text as markup", () => {
    render(
      <HtmlContent html="<ol><li>First term</li><li>Second term</li></ol>" />,
    );

    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("merges a caller class name", () => {
    const { container } = render(
      <HtmlContent html="<p>Terms</p>" className="text-sm" />,
    );

    expect(container.firstChild).toHaveClass("text-sm", "text-start");
  });
});
