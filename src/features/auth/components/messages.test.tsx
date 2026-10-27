import { render } from "@testing-library/react";
import { NextIntlClientProvider, type IntlError } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";
import LoginForm from "./LoginForm";
import OtpForm from "./OtpForm";
import RegisterForm from "./RegisterForm";

// BackButton and the terms link use the locale-aware navigation, which needs the app router.
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
  Link: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/phone-countries", async () => {
  const { phoneCountriesMock } =
    await import("@/features/phone-countries/api.mock");
  return { loadPhoneCountries: phoneCountriesMock.listCountries };
});

const noop = async () => undefined;

const forms: [string, ReactElement][] = [
  ["LoginForm", <LoginForm key="login" onNext={noop} />],
  [
    "OtpForm",
    <OtpForm
      key="otp"
      phone="+966544444442"
      onBack={vi.fn()}
      onEditPhone={vi.fn()}
      onVerify={noop}
      onResend={noop}
    />,
  ],
  [
    "RegisterForm",
    <RegisterForm key="register" onBack={vi.fn()} onSubmit={noop} />,
  ],
];

/** Every message the auth forms render exists and formats in both locales. */
describe.each([
  ["en", en],
  ["ar", ar],
] as const)("auth form messages (%s)", (locale, messages) => {
  it.each(forms)(
    "%s renders without missing or broken messages",
    (_name, form) => {
      const errors: IntlError[] = [];
      render(
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          onError={(error) => errors.push(error)}
        >
          {form}
        </NextIntlClientProvider>,
      );
      expect(errors.map((error) => error.message)).toEqual([]);
    },
  );
});
