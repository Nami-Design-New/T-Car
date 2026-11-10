import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/shared/lib/errors";

const {
  auth,
  getPaymentOptions,
  payOrder,
  checkAvailability,
  createDraft,
  extendBooking,
  requestBookingEdit,
  submitReview,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  getPaymentOptions: vi.fn(),
  payOrder: vi.fn(),
  checkAvailability: vi.fn(),
  createDraft: vi.fn(),
  extendBooking: vi.fn(),
  requestBookingEdit: vi.fn(),
  submitReview: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("./api", () => ({
  bookingsApi: {
    checkAvailability,
    getPaymentOptions,
    payOrder,
      createDraft,
    extendBooking,
    requestBookingEdit,
    submitReview,
  },
}));
vi.mock("@/shared/lib/report", () => ({ reportError: vi.fn() }));

import {
  checkAvailabilityAction,
  getPaymentOptionsAction,
  payOrderAction,
  createDraftAction,
  extendBookingAction,
  requestBookingEditAction,
  submitBookingReviewAction,
} from "./actions";

const availabilityRequest = {
  carId: "1",
  branchId: "3",
  type: "daily" as const,
  fromDay: "2026-11-10",
  toDay: "2026-11-12",
  deliveryType: "from_branch" as const,
};

describe("checkAvailabilityAction", () => {
  it("returns E1 slots for an authenticated customer", async () => {
    checkAvailability.mockResolvedValue({
      slots: ["08", "10"],
      message: "Fetched successfully.",
    });

    await expect(checkAvailabilityAction(availabilityRequest)).resolves.toEqual({
      ok: true,
      data: { slots: ["08", "10"], message: "Fetched successfully." },
    });
    expect(checkAvailability).toHaveBeenCalledWith(availabilityRequest);
  });

  it("preserves a backend 422 message in the ActionResult", async () => {
    checkAvailability.mockRejectedValue(
      new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The car is not available for the selected days.",
      }),
    );

    await expect(checkAvailabilityAction(availabilityRequest)).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The car is not available for the selected days.",
      },
    });
  });
});

describe("getPaymentOptionsAction", () => {
  it("returns E3 methods and the wallet balance", async () => {
    const options = {
      methods: [{ id: "6", title: "Online Payment", type: "online" }],
      walletBalance: 120,
    };
    getPaymentOptions.mockResolvedValue(options);

    await expect(getPaymentOptionsAction("226")).resolves.toEqual({
      ok: true,
      data: options,
    });
    expect(getPaymentOptions).toHaveBeenCalledWith("226");
  });

  it("rejects a malformed order id before calling the API", async () => {
    await expect(getPaymentOptionsAction("../1")).resolves.toEqual({
      ok: false,
      error: { kind: "validation" },
    });
    expect(getPaymentOptions).not.toHaveBeenCalled();
  });

  it("requires an authenticated customer", async () => {
    auth.mockResolvedValue(null);
    await expect(getPaymentOptionsAction("226")).resolves.toEqual({
      ok: false,
      error: { kind: "unauthorized" },
    });
  });
});

describe("payOrderAction", () => {
  const request = { orderId: "226", useWallet: true, paymentMethodId: "6" };

  it("returns the gateway links and the backend message", async () => {
    const result = {
      ok: true,
      data: {
        kind: "gateway",
        payment: {
          paymentUrl: "https://t-car.app/order/pay/226",
          successUrl: "https://t-car.app/order/success/226",
          failUrl: "https://t-car.app/order/fail/226",
        },
      },
      message: "Proceed to payment now.",
    };
    payOrder.mockResolvedValue(result);

    await expect(payOrderAction(request)).resolves.toEqual(result);
    expect(payOrder).toHaveBeenCalledWith(request);
  });

  it("preserves a backend 422 message", async () => {
    payOrder.mockResolvedValue({
      ok: false,
      error: new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The payment method is required.",
      }),
    });

    await expect(
      payOrderAction({ ...request, paymentMethodId: null }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The payment method is required.",
      },
    });
  });

  it("rejects a choice without the wallet or a method", async () => {
    await expect(
      payOrderAction({ orderId: "226", useWallet: false, paymentMethodId: null }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        fieldErrors: { paymentMethodId: "booking.paymentMethodRequired" },
      },
    });
    expect(payOrder).not.toHaveBeenCalled();
  });

  it("requires an authenticated customer", async () => {
    auth.mockResolvedValue(null);
    await expect(payOrderAction(request)).resolves.toEqual({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(payOrder).not.toHaveBeenCalled();
  });
});

function validDraftRequest() {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return {
    carId: "1",
    branchId: "3",
    bookingType: "daily" as const,
    deliveryType: "from_branch" as const,
    details: {
      startDate,
      endDate,
      time: "09",
      days: 1,
      pricePerDay: 500,
      subtotal: 500,
      vat: 75,
      total: 575,
      notes: "Need help",
      pickupLocation: null,
      dropoffLocation: null,
    },
    services: [],
  };
}

describe("createDraftAction", () => {
  it("requires an authenticated customer", async () => {
    auth.mockResolvedValue(null);

    await expect(createDraftAction(validDraftRequest())).resolves.toEqual({
      ok: false,
      error: { kind: "unauthorized" },
    });
    expect(createDraft).not.toHaveBeenCalled();
  });

  it("validates and forwards the E2 request", async () => {
    const draft = { id: "226" };
    createDraft.mockResolvedValue(draft);

    await expect(createDraftAction(validDraftRequest())).resolves.toEqual({
      ok: true,
      data: draft,
    });
    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        carId: "1",
        branchId: "3",
        bookingType: "daily",
        deliveryType: "from_branch",
      }),
    );
  });

  it("preserves a backend 422 message", async () => {
    createDraft.mockRejectedValue(
      new AppError("validation", undefined, 422, undefined, {
        serverMessage: "The car is not available for the selected days.",
      }),
    );

    await expect(createDraftAction(validDraftRequest())).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        status: 422,
        serverMessage: "The car is not available for the selected days.",
      },
    });
  });
});

function validEdit() {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return {
    startDate,
    endDate,
    time: "09",
    days: 1,
    pricePerDay: 500,
    subtotal: 500,
    vat: 75,
    total: 575,
    notes: " Need help ",
    pickupAddress: " Riyadh ",
    dropoffAddress: "",
    pickupLocation: null,
    dropoffLocation: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "user-1" } });
  checkAvailability.mockResolvedValue({
    slots: ["08"],
    message: "Fetched successfully.",
  });
  createDraft.mockResolvedValue({ id: "226" });
  extendBooking.mockResolvedValue(undefined);
  requestBookingEdit.mockResolvedValue(undefined);
  submitReview.mockResolvedValue(undefined);
});

describe("booking action validation", () => {
  it("rejects malformed extension input before the service", async () => {
    await expect(extendBookingAction("booking-1", 1.5)).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "bookings.invalidExtendDays",
        fieldErrors: { days: "bookings.invalidExtendDays" },
      },
    });
    expect(extendBooking).not.toHaveBeenCalled();
  });

  it("forwards both review ratings to the service", async () => {
    await expect(
      submitBookingReviewAction("booking-1", {
        showroomRating: 4,
        driverRating: 5,
      }),
    ).resolves.toEqual({
      ok: true,
      data: undefined,
    });
    expect(submitReview).toHaveBeenCalledWith("booking-1", {
      showroomRating: 4,
      driverRating: 5,
    });
  });

  it("rejects malformed edit input before the service", async () => {
    await expect(
      requestBookingEditAction("booking-1", { ...validEdit(), days: 2 }),
    ).resolves.toEqual({
      ok: false,
      error: {
        kind: "validation",
        code: "booking.invalidDays",
        fieldErrors: { days: "booking.invalidDays" },
      },
    });
    expect(requestBookingEdit).not.toHaveBeenCalled();
  });

  it("preserves service failures as ActionResults", async () => {
    extendBooking.mockRejectedValue(
      new AppError("conflict", "bookings.extendLimit"),
    );

    await expect(extendBookingAction("booking-1", 10)).resolves.toEqual({
      ok: false,
      error: { kind: "conflict", code: "bookings.extendLimit" },
    });
  });
});
