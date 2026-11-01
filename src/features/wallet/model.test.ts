import { describe, expect, it } from "vitest";
import { topUpOutcome } from "./model";

describe("topUpOutcome", () => {
  it("reads the payment page's success and failed messages", () => {
    expect(topUpOutcome("payment-success")).toBe("success");
    expect(topUpOutcome("payment-failed")).toBe("failed");
  });

  it("ignores other messages", () => {
    for (const data of [
      null,
      "success",
      "payment-pending",
      "toString",
      { status: "payment-success" },
    ]) {
      expect(topUpOutcome(data)).toBeNull();
    }
  });
});
