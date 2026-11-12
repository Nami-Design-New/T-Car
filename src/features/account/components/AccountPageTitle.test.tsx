import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import arabicMessages from "../../../../messages/ar.json";
import messages from "../../../../messages/en.json";
import { describe, expect, it, vi } from "vitest";
import AccountPageTitle from "./AccountPageTitle";

let pathname = "/account/profile";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
}));

describe("AccountPageTitle", () => {
  it("uses the current account section as the page title", () => {
    pathname = "/account/notifications";
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AccountPageTitle fallback="My account" />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("falls back to the account title outside a section route", () => {
    pathname = "/account";
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AccountPageTitle fallback="My account" />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "My account" }),
    ).toBeInTheDocument();
  });

  it("uses the translation key for the bank accounts route", () => {
    pathname = "/account/bank-accounts";
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AccountPageTitle fallback="My account" />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Bank accounts" }),
    ).toBeInTheDocument();
  });

  it("resolves the bank accounts heading in Arabic", () => {
    pathname = "/account/bank-accounts";
    render(
      <NextIntlClientProvider locale="ar" messages={arabicMessages}>
        <AccountPageTitle fallback="حسابي" />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "الحسابات البنكية" }),
    ).toBeInTheDocument();
  });
});
