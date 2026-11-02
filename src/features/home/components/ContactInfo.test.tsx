import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../../messages/en.json";
import { describe, expect, it } from "vitest";
import type { ContactSettings } from "@/features/settings";
import ContactInfo from "./ContactInfo";

function renderInfo(contact: ContactSettings) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContactInfo contact={contact} />
    </NextIntlClientProvider>,
  );
}

describe("ContactInfo", () => {
  it("shows the API contact details as links, and the translated address", () => {
    renderInfo({
      email: "info@tcar.com",
      phone: "+966 500 000 000",
      facebook: "https://facebook.com/tcar",
      instagram: "https://instagram.com/tcar",
      twitter: "https://x.com/tcar",
    });

    expect(
      screen.getByRole("link", { name: "+966 500 000 000" }),
    ).toHaveAttribute("href", "tel:+966500000000");
    expect(screen.getByRole("link", { name: "info@tcar.com" })).toHaveAttribute(
      "href",
      "mailto:info@tcar.com",
    );
    expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute(
      "href",
      "https://facebook.com/tcar",
    );
    expect(screen.getByRole("link", { name: "X (Twitter)" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByText("Riyadh, Saudi Arabia")).toBeInTheDocument();
  });

  it("hides the details the API did not send", () => {
    renderInfo({ email: "info@tcar.com" });

    expect(
      screen.getByRole("link", { name: "info@tcar.com" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Phone Number")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Facebook" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the address when the settings could not be read", () => {
    renderInfo({});

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("Riyadh, Saudi Arabia")).toBeInTheDocument();
  });
});
