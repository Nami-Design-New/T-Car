import { describe, expect, it } from "vitest";
import { isHttpsUrl, paymentOutcome } from "./paymentWindow";

describe("paymentOutcome", () => {
  it("reads the payment page's success and failed messages", () => {
    expect(paymentOutcome("payment-success")).toBe("success");
    expect(paymentOutcome("payment-failed")).toBe("failed");
  });

  it("ignores other messages", () => {
    for (const data of [
      null,
      "success",
      "payment-pending",
      "toString",
      { status: "payment-success" },
    ]) {
      expect(paymentOutcome(data)).toBeNull();
    }
  });
});

describe("isHttpsUrl", () => {
  it("accepts absolute https URLs only", () => {
    expect(isHttpsUrl("https://t-car.app/order/pay/1")).toBe(true);
    for (const value of ["http://t-car.app", "javascript:alert(1)", "/order/pay/1", "", 1, null]) {
      expect(isHttpsUrl(value)).toBe(false);
    }
  });
});
