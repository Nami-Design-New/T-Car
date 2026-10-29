import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/shared/test/render";
import PhoneVerificationForm from "./PhoneVerificationForm";

describe("PhoneVerificationForm", () => {
  it("uses the translated OTP code and digit labels", () => {
    renderWithIntl(
      <PhoneVerificationForm
        phone="+966500000000"
        onResendCode={vi.fn(async () => undefined)}
        onVerifyCode={vi.fn(async () => undefined)}
        onVerified={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Verification code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Digit 1 of 4" }),
    ).toBeInTheDocument();
  });
});
