import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import StationAndAirportInfo from "./StationAndAirportInfo";

const nearestBranch = {
  id: "3",
  name: "Cairo branch",
  address: "Mit Khaqan, Shebin El Kom",
  distanceKm: 0.99,
  latitude: 30.5687368,
  longitude: 31.0294824,
  region: "Monufia Governorate",
  placeId: "ChIJT430qt_W9xQR0DqT7YZxX3o",
};

describe("StationAndAirportInfo", () => {
  it("shows the nearest branch returned for the selected context", () => {
    renderWithIntl(
      <StationAndAirportInfo
        showroom="Company"
        pickup={{ nearestBranch }}
        branches={[]}
      />,
    );

    expect(screen.getByText("Cairo branch")).toBeInTheDocument();
    expect(screen.getByText("Mit Khaqan, Shebin El Kom")).toBeInTheDocument();
    expect(screen.queryByText("T-Car airport parking")).not.toBeInTheDocument();
  });

  it("opens the complete branch list returned by the branch endpoint", async () => {
    renderWithIntl(
      <StationAndAirportInfo
        showroom="Company"
        pickup={{ nearestBranch }}
        branches={[
          nearestBranch,
          { ...nearestBranch, id: "4", name: "Giza branch" },
        ]}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "View details for Company" }),
    );
    expect(screen.getByText("Giza branch")).toBeInTheDocument();
  });
});
