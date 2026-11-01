import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTopUpPayment } from "./useTopUpPayment";

const payment = {
  paymentUrl: "https://t-car.app/wallet/pay/75",
  successUrl: "https://t-car.app/wallet/success/75",
  failUrl: "https://t-car.app/wallet/fail/75",
};

// jsdom only accepts a real window as a message source; this page stands in
// for the tab, with `close` stubbed.
const tab = window;
const close = vi.spyOn(window, "close").mockImplementation(() => {});

function post(
  data: unknown,
  origin = "https://t-car.app",
  source: Window | null = tab,
) {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, origin, source }));
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useTopUpPayment", () => {
  it("reports the outcome the payment tab posts, once", () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useTopUpPayment(onDone));

    act(() => result.current.watch(tab, payment));
    expect(result.current.paying).toBe(true);
    post("payment-failed");
    post("payment-success");

    expect(close).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith("failed");
    expect(result.current.paying).toBe(false);
  });

  it("ignores messages from other origins, other windows, or of another shape", () => {
    const onDone = vi.fn();
    const { result } = renderHook(() => useTopUpPayment(onDone));

    act(() => result.current.watch(tab, payment));
    post("payment-success", "https://evil.example");
    post("payment-success", "https://t-car.app", null);
    post("other-message");

    expect(onDone).not.toHaveBeenCalled();
  });

  it("reports null when the tab closes without an outcome", () => {
    const onDone = vi.fn();
    const closedTab = { closed: false } as Window;
    const { result } = renderHook(() => useTopUpPayment(onDone));

    act(() => result.current.watch(closedTab, payment));
    act(() => {
      (closedTab as { closed: boolean }).closed = true;
      vi.advanceTimersByTime(1000);
    });

    expect(onDone).toHaveBeenCalledWith(null);
  });
});
