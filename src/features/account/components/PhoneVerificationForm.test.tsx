import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/shared/test/render";
import { AppError } from "@/shared/lib/errors";
import PhoneVerificationForm from "./PhoneVerificationForm";

describe("PhoneVerificationForm", () => {
  it("uses the translated OTP code and digit labels", () => {
    renderWithIntl(
      <PhoneVerificationForm
        phone={{ countryCode: "+966", phone: "500000000" }}
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

  it("resends to the structured number and restarts the timer only after success", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      const phone = { countryCode: "+966", phone: "500000000" };
      const onResendCode = vi.fn()
        .mockResolvedValueOnce(new AppError("rate_limited", "account.resendLimited"))
        .mockResolvedValueOnce(undefined);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithIntl(
        <PhoneVerificationForm phone={phone} onResendCode={onResendCode} onVerifyCode={vi.fn()} onVerified={vi.fn()} />,
      );
      for (let i = 0; i < 30; i += 1) act(() => vi.advanceTimersByTime(1000));
      await user.click(screen.getByRole("button", { name: "Resend code" }));
      expect(onResendCode).toHaveBeenLastCalledWith(phone);
      expect(screen.getByRole("button", { name: "Resend code" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Resend code" }));
      expect(onResendCode).toHaveBeenCalledTimes(2);
      expect(screen.getByText("00:30")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
