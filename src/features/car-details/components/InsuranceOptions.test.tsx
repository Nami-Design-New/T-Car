import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InsuranceOptions from "./InsuranceOptions";
import { renderWithIntl } from "@/shared/test/render";

const OPTION = {
  id: "1",
  title: "Insurance with deductible",
  description: "A deductible applies",
  percentage: 20,
};

describe("InsuranceOptions", () => {
  it("shows only the insurance data returned by the API", () => {
    renderWithIntl(<InsuranceOptions option={OPTION} />);
    expect(screen.getByText("A deductible applies")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });
});
