// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isSessionProof, sessionProof } from "./session-proof";

describe("isSessionProof", () => {
  it("accepts the proof made for the same session and secret only", async () => {
    const proof = await sessionProof("session", "secret");

    expect(proof).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await expect(isSessionProof(proof, "session", "secret")).resolves.toBe(
      true,
    );
    await expect(isSessionProof(proof, "other", "secret")).resolves.toBe(false);
    await expect(isSessionProof(proof, "session", "other")).resolves.toBe(
      false,
    );
  });

  it("rejects a missing proof, session, or secret", async () => {
    const proof = await sessionProof("session", "secret");

    await expect(isSessionProof(null, "session", "secret")).resolves.toBe(
      false,
    );
    await expect(isSessionProof(proof, undefined, "secret")).resolves.toBe(
      false,
    );
    await expect(isSessionProof(proof, "session", undefined)).resolves.toBe(
      false,
    );
  });
});
