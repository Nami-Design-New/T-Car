import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/shared/test/render";
import CountryModal from "./CountryModal";
import type { Country } from "../model";

const { getCountryPage } = vi.hoisted(() => ({ getCountryPage: vi.fn() }));
vi.mock("../client/lookup.client", () => ({ getCountryPage }));

const countries: Country[] = [
  { id: 1, name: "Saudi Arabia", flag: "/images/saudi-flag.svg" },
  { id: 2, name: "United Arab Emirates", flag: "/images/uae-flag.svg" },
];

function renderCountryModal(
  overrides: Partial<React.ComponentProps<typeof CountryModal>> = {},
) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  const user = userEvent.setup();
  renderWithIntl(
    <CountryModal
      open
      countries={{
        items: countries,
        page: 1,
        lastPage: 1,
        total: countries.length,
      }}
      onClose={onClose}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onClose, onSelect, user };
}

describe("CountryModal", () => {
  it("uses the shared accessible dialog and focuses country search", () => {
    renderCountryModal();
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Choose a country");
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });

  it("filters countries and confirms the selected country", async () => {
    getCountryPage.mockResolvedValue({
      ok: true,
      data: { items: [countries[1]], page: 1, lastPage: 1, total: 1 },
    });
    const { onSelect, user } = renderCountryModal();
    await user.type(screen.getByRole("searchbox"), "emirates");
    await waitFor(() => expect(getCountryPage).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Saudi Arabia" }),
    ).not.toBeInTheDocument();
    const country = screen.getByRole("button", {
      name: "United Arab Emirates",
    });
    await user.click(country);
    expect(country).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onSelect).toHaveBeenCalledWith(countries[1]);
  });

  it("preserves close behavior through the shared close control", async () => {
    const { onClose, user } = renderCountryModal();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
