import { describe, expect, it } from "vitest";
import {
  canCancel,
  canExtend,
  canModify,
  canRate,
  toCreateDraftRequest,
  type BookingContext,
  type BookingDetails,
  type Order,
} from "./model";

const order = {
  status: "accepted",
  pickupAt: "2026-11-10T11:00:00",
  deliveryType: "from_branch",
  payExtension: false,
  pendingExtensionId: null,
  hasModifyRequest: false,
  modifyRequestPendingPayment: false,
  modifyRequestPaymentAmount: null,
  createdAt: "2026-11-01 12:00:00",
} as Order;

describe("order action rules", () => {
  it("shows cancel and edit only for coming bookings", () => {
    expect(canCancel({ ...order, status: "coming" })).toBe(true);
    expect(canModify({ ...order, status: "coming" })).toBe(true);
    expect(canCancel(order)).toBe(false);
    expect(canModify({ ...order, status: "accepted" })).toBe(false);
  });

  it("shows extension only for current and late bookings", () => {
    expect(canExtend({ ...order, status: "current" })).toBe(true);
    expect(canExtend({ ...order, status: "late" })).toBe(true);
    expect(canExtend({ ...order, status: "open" })).toBe(false);
  });

  it("allows rating complete orders only", () => {
    expect(canRate({ status: "complete" })).toBe(true);
    expect(canRate({ status: "cancelled" })).toBe(false);
  });

  it("hides the action menu items for a complete booking", () => {
    const completed = { ...order, status: "complete" as const };
    expect(canCancel(completed)).toBe(false);
    expect(canExtend(completed)).toBe(false);
    expect(canModify(completed)).toBe(false);
  });
});

describe("toCreateDraftRequest", () => {
  const details = { time: "09" } as BookingDetails;
  const branch = {
    id: "3",
    name: "cairo",
    address: "Branch street",
    distanceKm: 8,
    latitude: 30.04,
    longitude: 31.23,
    region: "Cairo",
  };
  const context = (extra: Partial<BookingContext>): BookingContext => ({
    bookingType: "daily",
    deliveryType: "from_branch",
    branch,
    ...extra,
  });

  it("returns null without a branch (R16)", () => {
    expect(
      toCreateDraftRequest("1", context({ branch: undefined }), details),
    ).toBeNull();
  });

  it("keeps the delivery type for daily and drops it for airport", () => {
    expect(toCreateDraftRequest("1", context({}), details)).toMatchObject({
      deliveryType: "from_branch",
    });
    const airport = toCreateDraftRequest(
      "1",
      context({
        bookingType: "airport",
        deliveryType: undefined,
        airportId: "2",
        pickupPointHasBranch: false,
      }),
      details,
    );
    expect(airport).not.toHaveProperty("deliveryType");
    expect(airport).toMatchObject({
      airportId: "2",
      returnAtPickupPoint: false,
      returnLocation: {
        lat: 30.04,
        lng: 31.23,
        region: "Cairo",
        address: "Branch street",
      },
    });
  });

  it("returns at the station branch when the company has one there", () => {
    expect(
      toCreateDraftRequest(
        "1",
        context({
          bookingType: "station",
          deliveryType: undefined,
          stationId: "5",
          pickupPointHasBranch: true,
        }),
        details,
      ),
    ).toMatchObject({ stationId: "5", returnAtPickupPoint: true });
  });
});
