import "server-only";
import { cache } from "react";
import { protectedRead } from "@/services/http/session";
import { toAppError } from "@/shared/lib/errors";
import { bookingsApi, ORDERS_PER_PAGE } from "./api";
import type { Page } from "@/shared/lib/pagination";
import type { BookingDetailsView, OrderListItem, OrderListTab } from "./model";

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
 * Null for an unknown id, so the page can call notFound(). A dead session signs
 * in again; other failures throw to error.tsx. Cached per request:
 * generateMetadata and the page share one read.
 */
export const getBookingDetails = cache(
  (id: string): Promise<BookingDetailsView | null> =>
    protectedRead(async () => {
      try {
        return await bookingsApi.getBookingDetails(id);
      } catch (error) {
        const appError = toAppError(error);
        if (appError.kind === "not_found") return null;
        throw appError;
      }
    }),
);
