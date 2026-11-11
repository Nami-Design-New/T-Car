"use server";

import { auth } from "@/auth";
import { AppError } from "@/shared/lib/errors";
import { reportError } from "@/shared/lib/report";
import {
  fail,
  ok,
  toActionResult,
  type ActionResult,
} from "@/shared/lib/result";
import { toValidationError } from "@/shared/lib/validation";
import type { ZodType } from "zod";
import { bookingsApi, ORDERS_PER_PAGE } from "./api";
import type {
  Availability,
  AvailabilityRequest,
  CancelQuote,
  BookingEditRequest,
  BookingReviewInput,
  CreateDraftRequest,
  Order,
  OrderListItem,
  OrderListTab,
  PaymentOptions,
  PayOrderRequest,
  PayOrderResult,
} from "./model";
import type { Page } from "@/shared/lib/pagination";
import {
  availabilitySchema,
  bookingEditSchema,
  bookingReviewSchema,
  createDraftSchema,
  payOrderSchema,
  extendBookingSchema,
} from "./validation";

export async function checkAvailabilityAction(
  request: AvailabilityRequest,
): Promise<ActionResult<Availability>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const availability = await bookingsApi.checkAvailability(
      parse(availabilitySchema, request),
    );
    return toActionResult(ok(availability));
  } catch (error) {
    reportError(error, {
      scope: "booking.availability",
      carId: request.carId,
      branchId: request.branchId,
    });
    return toActionResult(fail(error));
  }
}

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw toValidationError(result.error);
  return result.data;
}

/** Loads another E6 page for the client-side InfiniteList. */
export async function getOrdersPageAction(
  tab: OrderListTab,
  page: number,
): Promise<ActionResult<Page<OrderListItem>>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (
      (tab !== "active" && tab !== "past") ||
      !Number.isInteger(page) ||
      page < 1
    )
      throw new AppError("validation");
    const orders = await bookingsApi.listOrders({
      status: tab === "active" ? "current" : "past",
      page,
      perPage: ORDERS_PER_PAGE,
    });
    return toActionResult(ok(orders));
  } catch (error) {
    reportError(error, { scope: "bookings.list", tab, page });
    return toActionResult(fail(error));
  }
}

const ORDER_ID = /^[1-9]\d*$/;

/** E3 for the checkout payment step. */
export async function getPaymentOptionsAction(
  orderId: string,
): Promise<ActionResult<PaymentOptions>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (typeof orderId !== "string" || !ORDER_ID.test(orderId))
      throw new AppError("validation");
    return toActionResult(ok(await bookingsApi.getPaymentOptions(orderId)));
  } catch (error) {
    reportError(error, { scope: "booking.paymentOptions", orderId });
    return toActionResult(fail(error));
  }
}

/** E5: pays the draft with the wallet, one method, or both (R14). */
export async function payOrderAction(
  request: PayOrderRequest,
): Promise<ActionResult<PayOrderResult>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const result = await bookingsApi.payOrder(parse(payOrderSchema, request));
    if (!result.ok) reportError(result.error, { scope: "booking.pay" });
    return toActionResult(result);
  } catch (error) {
    reportError(error, { scope: "booking.pay", orderId: request?.orderId });
    return toActionResult(fail(error));
  }
}

/** Creates the server-priced E2 draft; payment is handled by O6. */
export async function createDraftAction(
  request: CreateDraftRequest,
): Promise<ActionResult<Order>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    const draft = await bookingsApi.createDraft(
      parse(createDraftSchema, request),
    );
    return toActionResult(ok(draft));
  } catch (error) {
    reportError(error, { scope: "booking.draft", carId: request.carId });
    return toActionResult(fail(error));
  }
}

async function run<T>(
  scope: string,
  write: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return toActionResult(ok(await write()));
  } catch (error) {
    reportError(error, { scope });
    return toActionResult(fail(error));
  }
}

export async function extendBookingAction(
  bookingId: string,
  days: number,
): Promise<ActionResult<void>> {
  return run("bookings.extend", () => {
    const values = parse(extendBookingSchema, { days });
    return bookingsApi.extendBooking(bookingId, values.days);
  });
}

export async function requestBookingEditAction(
  bookingId: string,
  request: BookingEditRequest,
): Promise<ActionResult<void>> {
  return run("bookings.requestEdit", () => {
    const values = parse(bookingEditSchema, request);
    return bookingsApi.requestBookingEdit(bookingId, values);
  });
}

export async function cancelBookingAction(
  bookingId: string,
): Promise<ActionResult<string | undefined>> {
  return run("bookings.cancel", () => bookingsApi.cancelBooking(bookingId));
}

export async function getCancelQuoteAction(
  bookingId: string,
): Promise<ActionResult<CancelQuote>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    if (typeof bookingId !== "string" || !ORDER_ID.test(bookingId))
      throw new AppError("validation");
    return toActionResult(ok(await bookingsApi.getCancelQuote(bookingId)));
  } catch (error) {
    reportError(error, { scope: "bookings.cancelQuote", bookingId });
    return toActionResult(fail(error));
  }
}

export async function submitBookingReviewAction(
  bookingId: string,
  input: BookingReviewInput,
): Promise<ActionResult<void>> {
  return run("bookings.review", () => {
    const values = parse(bookingReviewSchema, input);
    return bookingsApi.submitReview(bookingId, values);
  });
}
