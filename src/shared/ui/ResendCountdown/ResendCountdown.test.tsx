import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/shared/test/render";
import { ResendCountdown } from "./ResendCountdown";

describe("ResendCountdown", () => {
  it("counts down, invokes resend, and resets after a successful resend", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      const onResend = vi.fn(async () => true);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithIntl(<ResendCountdown seconds={2} onResend={onResend} />);

      expect(screen.getByText("00:02")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(2000));
      expect(
        screen.getByRole("button", { name: "Resend code" }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Resend code" }));

      expect(onResend).toHaveBeenCalledOnce();
      expect(screen.getByText("00:02")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the countdown expired when resend fails", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      const onResend = vi.fn(async () => false);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithIntl(<ResendCountdown seconds={1} onResend={onResend} />);
      act(() => vi.advanceTimersByTime(1000));
      await user.click(screen.getByRole("button", { name: "Resend code" }));

      expect(onResend).toHaveBeenCalledOnce();
      expect(
        screen.getByRole("button", { name: "Resend code" }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
