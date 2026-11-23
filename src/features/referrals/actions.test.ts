import { describe, expect, it } from "vitest";
import { checkReferralCodeAction } from "./actions";

describe("checkReferralCodeAction", () => {
  it("names the friend for a valid code, in any case", async () => {
    expect(await checkReferralCodeAction(" tcar-a7k9 ")).toEqual({
      ok: true,
      data: { valid: true, inviterName: "أحمد" },
    });
  });

  it("rejects an unknown code", async () => {
    expect(await checkReferralCodeAction("TCAR-A7K0")).toEqual({
      ok: true,
      data: { valid: false },
    });
  });

  it("rejects a code in the wrong shape without asking the service", async () => {
    expect(await checkReferralCodeAction("A")).toEqual({
      ok: true,
      data: { valid: false },
    });
  });

  it("returns a network error when the service is unreachable", async () => {
    const result = await checkReferralCodeAction("TCAR-FAIL");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("network");
  });
});
