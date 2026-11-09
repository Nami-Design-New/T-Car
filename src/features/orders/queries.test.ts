import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  error: undefined as unknown,
  booking: undefined as unknown,
  calls: 0,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/shared/lib/errors", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib/errors")>();
  return { ...actual, toAppError: (error: unknown) => error };
});
vi.mock("@/services/http/session", () => ({
  protectedRead: (read: () => Promise<unknown>) => read(),
}));
vi.mock("./api", () => ({
  ORDERS_PER_PAGE: 10,
  bookingsApi: {
    getOrder: async () => {
      state.calls += 1;
      if (state.error) throw state.error;
      return state.booking;
    },
    listOrders: vi.fn(),
  },
}));

import { readBookingDetails } from "./queries";

describe("getBookingDetails", () => {
  beforeEach(() => {
    state.error = undefined;
    state.booking = undefined;
    state.calls = 0;
  });

  it("returns null for a 404", async () => {
    state.error = { kind: "not_found", status: 404 };
    const result = await readBookingDetails("40401");
    expect(result).toBeNull();
  });

  it("returns the booking for an existing id", async () => {
    state.booking = { id: "153" };
    const result = await readBookingDetails("153");
    expect(result).toEqual({ id: "153" });
  });

  it("returns null for an ownership 422", async () => {
    state.error = {
      kind: "validation",
      status: 422,
      serverMessage: "You are not allowed to perform this action.",
    };
    const result = await readBookingDetails("42201");
    expect(result).toBeNull();
  });

  it("throws any other error", async () => {
    state.error = { kind: "server", status: 500 };
    await expect(readBookingDetails("50001")).rejects.toEqual({
      kind: "server",
      status: 500,
    });
  });

  it("returns null without an API call for a non-numeric id", async () => {
    await expect(readBookingDetails("abc")).resolves.toBeNull();
    expect(state.calls).toBe(0);
  });
});

describe("getBookingDetails and the sign-in redirect", () => {
  it("lets protectedRead's redirect propagate (catch is inside the read)", async () => {
    vi.resetModules();
    // The real toAppError: it would turn a redirect into AppError('unknown')
    // if the catch wrapped protectedRead.
    vi.doUnmock("@/shared/lib/errors");
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/ar?auth=login;307;",
    });
    vi.doMock("@/services/http/session", () => ({
      protectedRead: async () => {
        throw redirect;
      },
    }));
    const { readBookingDetails: read } = await import("./queries");
    await expect(read("153")).rejects.toBe(redirect);
    vi.doUnmock("@/services/http/session");
  });
});
