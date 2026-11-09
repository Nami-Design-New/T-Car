"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getOrdersPageAction, type OrderListItem } from "@/features/orders";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import type { Page } from "@/shared/lib/pagination";
import { fromActionResult } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { BookingTab } from "../model";
import BookingsTabs from "./BookingsTabs";
import BookingCard from "./BookingCard";

interface Props {
  initialPage: Page<OrderListItem>;
  /** From the URL (?status=); the page parses it. */
  status: BookingTab;
}

export default function BookingsTab({
  initialPage,
  status,
}: Props) {
  return (
    <div>
      <BookingsTabs
        active={status}
      />
      {/* Keyed by tab: switching tabs only changes the query string, which keeps
          this component mounted, and the list must restart from the new tab's
          first page. */}
      <OrdersList key={status} initialPage={initialPage} status={status} />
    </div>
  );
}

function OrdersList({
  initialPage,
  status,
}: Pick<Props, "initialPage" | "status">) {
  const t = useTranslations("bookings.empty");
  const fetchPage = useCallback(
    async (page: number) =>
      fromActionResult(await getOrdersPageAction(status, page)),
    [status],
  );
  const orders = usePaginatedList(fetchPage, {
    initialPage,
    scope: "bookings.list",
  });

  return (
    <InfiniteList
      loading={orders.loading}
      hasMore={orders.hasMore}
      isEmpty={orders.items.length === 0}
      error={orders.error ?? undefined}
      onLoadMore={orders.loadMore}
      onRetry={orders.retry}
    >
      <InfiniteList.Items className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 max-[640px]:grid-cols-1">
        {orders.items.map((booking) => (
          <InfiniteList.Item key={booking.id}>
            <BookingCard booking={booking} />
          </InfiniteList.Item>
        ))}
      </InfiniteList.Items>
      <InfiniteList.Loading className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 max-[640px]:grid-cols-1">
        <Skeleton shape="rect" height={330} className="rounded-lg" />
      </InfiniteList.Loading>
      <InfiniteList.Error />
      <InfiniteList.Empty>
        <EmptyState
          title={t("title")}
          description={t(status)}
          action={
            <Button asChild>
              <Link href="/cities">{t("cta")}</Link>
            </Button>
          }
        />
      </InfiniteList.Empty>
    </InfiniteList>
  );
}
