import {
  render as renderWithTestingLibrary,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../../messages/en.json";
import type { CountryPageRequest, PhoneFieldValue } from "@/shared/lib/phone";
import { PhoneField } from "./PhoneField";

const loadCountries = async (_request: CountryPageRequest) => ({
  items: [
    {
      id: "sa",
      iso2: "SA",
      name: "Saudi Arabia",
      countryCode: "+966",
      flagUrl: "/test-flag.svg",
    },
  ],
  nextCursor: null,
});

function render(children: ReactNode) {
  return renderWithTestingLibrary(
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>,
  );
}

function ControlledPhoneField({
  onChange,
}: {
  onChange: (phone: PhoneFieldValue) => void;
}) {
  const [phone, setPhone] = useState<PhoneFieldValue>({
    countryCode: "+966",
    phone: "",
  });
  return (
    <PhoneField
      value={phone}
      loadCountries={loadCountries}
      onChange={(next) => {
        setPhone(next);
        onChange(next);
      }}
    />
  );
}

describe("PhoneField", () => {
  it("is a named phone input that autocompletes from the device", () => {
    render(
      <PhoneField
        loadCountries={loadCountries}
        onChange={vi.fn()}
        inputAriaLabel="Mobile number"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Mobile number" });
    expect(input).toHaveAttribute("name", "phone");
    expect(input).toHaveAttribute("autocomplete", "tel-national");
  });

  it("starts with the Saudi code and reports the number separately", async () => {
    const onChange = vi.fn();
    render(<ControlledPhoneField onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "Phone number" });
    expect(input).toHaveValue("");
    expect(
      screen.getByRole("button", { name: /Choose country:/ }),
    ).toHaveTextContent("+966");

    await userEvent.type(input, "500000000");
    expect(onChange).toHaveBeenLastCalledWith({
      countryCode: "+966",
      phone: "500000000",
    });
  });

  it("can be disabled", () => {
    render(
      <PhoneField
        loadCountries={loadCountries}
        value={{ countryCode: "+966", phone: "500000000" }}
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(
      screen.getByRole("textbox", { name: "Phone number" }),
    ).toBeDisabled();
  });

  it("shows its error, announces it, and links it to the input", () => {
    render(
      <PhoneField
        loadCountries={loadCountries}
        onChange={vi.fn()}
        required
        error="Enter a valid phone number."
      />,
    );
    const input = screen.getByRole("textbox", { name: "Phone number" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid phone number.",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid phone number.");
  });

  it("reports blur", async () => {
    const onBlur = vi.fn();
    render(
      <PhoneField
        loadCountries={loadCountries}
        onChange={vi.fn()}
        onBlur={onBlur}
      />,
    );
    await userEvent.click(
      screen.getByRole("textbox", { name: "Phone number" }),
    );
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });
});
