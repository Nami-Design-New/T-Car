import { describe, expect, it } from "vitest";
import {
  canCancel,
  canExtend,
  canModify,
  bookingInstant,
  canRate,
  type Order,
} from "./model";

// Riyadh wall clock 10:00 (UTC+3), the zone booking times are written in.
const NOW = new Date("2026-11-10T10:00:00+03:00");

const order = {
  status: "accepted",
  pickupAt: "2026-11-10T11:00:00",
  deliveryType: "from_branch",
  payExtension: false,
  pendingExtensionId: null,
  hasModifyRequest: false,
  createdAt: "2026-11-01 12:00:00",
} as Order;

describe("order action rules", () => {
  it("allows cancellation only before pickup for cancellable statuses", () => {
    expect(canCancel(order, NOW)).toBe(true);
    expect(canCancel({ ...order, pickupAt: "2026-11-10T10:00:00" }, NOW)).toBe(
      false,
    );
    expect(canCancel({ ...order, status: "current" }, NOW)).toBe(false);
  });

  it("allows running extensions and from-branch accepted/open at pickup", () => {
    expect(canExtend({ ...order, status: "current" }, NOW)).toBe(true);
    expect(canExtend({ ...order, pickupAt: "2026-11-10T10:00:00" }, NOW)).toBe(
      true,
    );
    expect(
      canExtend(
        {
          ...order,
          deliveryType: "from_location",
          pickupAt: "2026-11-10T10:00:00",
        },
        NOW,
      ),
    ).toBe(false);
  });

  it("blocks extension while an unpaid extension exists", () => {
    expect(
      canExtend({ ...order, status: "late", payExtension: true }, NOW),
    ).toBe(false);
    expect(
      canExtend({ ...order, status: "late", pendingExtensionId: "9" }, NOW),
    ).toBe(false);
  });

  it("allows modification only before pickup without an existing request", () => {
    expect(canModify(order, NOW)).toBe(true);
    expect(canModify({ ...order, pickupAt: "2026-11-10T10:00:00" }, NOW)).toBe(
      false,
    );
    expect(canModify({ ...order, hasModifyRequest: true }, NOW)).toBe(false);
    expect(canModify({ ...order, status: "late" }, NOW)).toBe(false);
  });

  it("allows rating complete orders only", () => {
    expect(canRate({ status: "complete" })).toBe(true);
    expect(canRate({ status: "cancelled" })).toBe(false);
  });

  it("cancels new, accepted, and coming only", () => {
    for (const status of ["new", "accepted", "coming"] as const)
      expect(canCancel({ ...order, status }, NOW)).toBe(true);
    for (const status of ["open", "rejected", "suspended"] as const)
      expect(canCancel({ ...order, status }, NOW)).toBe(false);
  });

  it("extends open from-branch only once pickup has come", () => {
    expect(canExtend({ ...order, status: "open", pickupAt: "2026-11-10T09:59:00" }, NOW)).toBe(true);
    expect(canExtend({ ...order, status: "open" }, NOW)).toBe(false);
    expect(canExtend({ ...order, status: "complete" }, NOW)).toBe(false);
  });

  it("never modifies start, complete, or cancelled orders", () => {
    for (const status of ["start", "complete", "cancelled", "current"] as const)
      expect(canModify({ ...order, status }, NOW)).toBe(false);
  });
});

describe("bookingInstant", () => {
  it("reads offset-less booking times as Riyadh time (UTC+3)", () => {
    expect(bookingInstant("2026-11-10T10:00:00").toISOString()).toBe(
      "2026-11-10T07:00:00.000Z",
    );
  });

  it("keeps an explicit offset", () => {
    expect(bookingInstant("2026-11-10T10:00:00Z").toISOString()).toBe(
      "2026-11-10T10:00:00.000Z",
    );
  });
});
