// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AuthGrant } from "./model";
import { sealGrant, unsealGrant } from "./sealed-grant";

const grant: AuthGrant = {
  accessToken: "backend-token",
  user: { id: "34", name: "", phone: "+966500000001" },
  onboardingStep: "register",
};

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-long-enough-for-tests");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("sealed grants", () => {
  it("round-trips a grant without exposing the token", async () => {
    const sealed = await sealGrant(grant, "use-a", 60);
    expect(sealed).not.toContain("backend-token");
    await expect(unsealGrant(sealed, "use-a")).resolves.toEqual(grant);
  });

  it("refuses a grant sealed for another use", async () => {
    const sealed = await sealGrant(grant, "use-a", 60);
    await expect(unsealGrant(sealed, "use-b")).resolves.toBeNull();
  });

  it("refuses a forged or malformed value", async () => {
    await expect(
      unsealGrant("not-a-sealed-grant", "use-a"),
    ).resolves.toBeNull();
    await expect(unsealGrant("", "use-a")).resolves.toBeNull();
  });

  it("refuses an expired grant", async () => {
    const sealed = await sealGrant(grant, "use-a", 60);
    // Past the 60 s age and Auth.js's 15 s clock tolerance.
    vi.useFakeTimers({ now: Date.now() + 120_000 });
    await expect(unsealGrant(sealed, "use-a")).resolves.toBeNull();
  });
});
