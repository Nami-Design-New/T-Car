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
  BookingEditRequest,
  BookingReviewInput,
  CreateBookingRequest,
  OrderListItem,
  OrderListTab,
} from "./model";
import type { Page } from "@/shared/lib/pagination";
import {
  bookingEditSchema,
  bookingReviewSchema,
  createBookingSchema,
  extendBookingSchema,
} from "./validation";

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

/** Creates a booking after checking the session at the Server Action boundary. */
export async function createBookingAction(
  request: CreateBookingRequest,
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    await bookingsApi.createBooking(parse(createBookingSchema, request));
    return toActionResult(ok(undefined));
  } catch (error) {
    reportError(error, { scope: "booking.create", carId: request.carId });
    return toActionResult(fail(error));
  }
}

async function run(
  scope: string,
  write: () => Promise<void>,
): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    await write();
    return toActionResult(ok(undefined));
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
): Promise<ActionResult<void>> {
  return run("bookings.cancel", () => bookingsApi.cancelBooking(bookingId));
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
