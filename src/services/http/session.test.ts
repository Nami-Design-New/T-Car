// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore, requestHeaders, redirect, getToken } = vi.hoisted(() => ({
  cookieStore: { getAll: vi.fn(), set: vi.fn() },
  getToken: vi.fn(),
  requestHeaders: new Headers(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => requestHeaders,
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next-auth/jwt", () => ({ getToken }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "ar" }));

import {
  NEXT_PATH_HEADER,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/shared/config/session";
import { AppError } from "@/shared/lib/errors";
import { sessionProof } from "@/shared/lib/session-proof";
import { clearSession, protectedRead } from "./session";

const SECRET = "test-secret";

beforeEach(() => {
  vi.resetAllMocks();
  redirect.mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  });
  requestHeaders.delete(NEXT_PATH_HEADER);
  process.env.AUTH_SECRET = SECRET;
});

describe("clearSession", () => {
  it("expires the session cookie and its chunks only", async () => {
    cookieStore.getAll.mockReturnValue([
      { name: SESSION_COOKIE, value: "a" },
      { name: `${SESSION_COOKIE}.0`, value: "b" },
      { name: "NEXT_LOCALE", value: "ar" },
    ]);

    await clearSession();

    expect(cookieStore.set.mock.calls).toEqual([
      [SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 }],
      [`${SESSION_COOKIE}.0`, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 }],
    ]);
  });

  it("does nothing while a page renders (read-only cookies)", async () => {
    cookieStore.getAll.mockReturnValue([{ name: SESSION_COOKIE, value: "a" }]);
    cookieStore.set.mockImplementation(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });

    await expect(clearSession()).resolves.toBeUndefined();
  });
});

describe("protectedRead", () => {
  const unauthorized = async () => {
    throw new AppError("unauthorized", undefined, 401);
  };

  beforeEach(() => {
    getToken.mockResolvedValue({ accessToken: "dead" });
  });

  it("returns the read's data", async () => {
    await expect(protectedRead(async () => 42)).resolves.toBe(42);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("sends an unauthorized read to sign in with this session's proof, then back", async () => {
    requestHeaders.set(NEXT_PATH_HEADER, "/account/bookings?status=active");

    await expect(protectedRead(unauthorized)).rejects.toThrow("NEXT_REDIRECT");
    const params = new URLSearchParams({
      auth: "expired",
      proof: await sessionProof("dead", SECRET),
      next: "/account/bookings?status=active",
    });
    expect(redirect).toHaveBeenCalledWith(`/ar?${params}`);
  });

  it("omits next when the middleware did not set it, and proof when signed out", async () => {
    getToken.mockResolvedValue(null);

    await expect(protectedRead(unauthorized)).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/ar?auth=expired");
  });

  it("rethrows other failures as they are", async () => {
    const error = new AppError("server", undefined, 500);
    await expect(
      protectedRead(async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(redirect).not.toHaveBeenCalled();
  });
});
