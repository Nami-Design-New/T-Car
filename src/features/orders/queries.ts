import "server-only";
import { cache } from "react";
import { protectedRead } from "@/services/http/session";
import { toAppError } from "@/shared/lib/errors";
import { bookingsApi, ORDERS_PER_PAGE } from "./api";
import type { Page } from "@/shared/lib/pagination";
import type { Order, OrderListItem, OrderListTab } from "./model";

export function getMyBookings(
  tab: OrderListTab,
  page = 1,
): Promise<Page<OrderListItem>> {
  return protectedRead(() =>
    bookingsApi.listOrders({
      status: tab === "active" ? "current" : "past",
      page,
      perPage: ORDERS_PER_PAGE,
    }),
  );
}

/** The number of bookings in a tab, for its count badge (one item is read). */
export async function getMyBookingsTotal(tab: OrderListTab): Promise<number> {
  const page = await protectedRead(() =>
    bookingsApi.listOrders({
      status: tab === "active" ? "current" : "past",
      page: 1,
      perPage: 1,
    }),
  );
  return page.total;
}

/**
 * Null for an unknown id and for another customer's booking (HTTP 200 body
 * code 422, R4), so the page can call notFound(). A dead session signs in
 * again; other failures throw to error.tsx. Cached per request:
 * generateMetadata and the page share one read.
 */
export async function readBookingDetails(id: string): Promise<Order | null> {
  if (!/^\d+$/.test(id)) return null;
  // The catch stays inside the read: protectedRead turns a 401 into a sign-in
  // redirect, which must propagate untouched.
  return protectedRead(async () => {
    try {
      return await bookingsApi.getOrder(id);
    } catch (error) {
      const appError = toAppError(error);
      // 422 on this input-free read is an ownership error: the visitor has no
      // such booking. The backend message stays display-only.
      if (appError.kind === "not_found" || appError.status === 422)
        return null;
      throw appError;
    }
  });
}

export const getBookingDetails = cache(readBookingDetails);
