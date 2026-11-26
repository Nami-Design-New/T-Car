"use client";

import { useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { fromActionResult } from "@/shared/lib/result";
import { Button } from "@/shared/ui/Button";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { StateCard } from "@/shared/ui/StateCard";
import { getReferralHistoryAction } from "../actions";
import type { ReferralHistory } from "../model";
import InviteRow from "./InviteRow";

interface Props {
  history: ReferralHistory;
}

/** "My invites": points earned from invites and each friend's progress. */
export default function ReferralHistoryPage({ history }: Props) {
  const t = useTranslations("account.referrals.history");
  const fetchPage = useCallback(
    async (page: number) =>
      fromActionResult(await getReferralHistoryAction(page)),
    [],
  );
  const invites = usePaginatedList(fetchPage, {
    initialPage: history.page,
    scope: "referrals.history",
  });

  return (
    <section className="flex flex-col gap-4">
      {history.invitedCount === 0 ? (
        <StateCard
          icon="gift"
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Button asChild>
              <Link href="/account/referrals">{t("inviteAction")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="border-stroke-light bg-surface-elevated flex flex-wrap items-end justify-between gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-3 max-md:w-full">
              <span className="text-text-subtle text-sm">
                {t("totalLabel")}
              </span>
              <strong className="text-action-primary text-[clamp(1.875rem,4vw,2.25rem)] leading-tight font-bold">
                {t("points", { points: history.totalPoints })}
              </strong>
              <span className="text-text-subtle text-xs lg:text-sm">
                {t("counts", {
                  invited: history.invitedCount,
                  completed: history.completedCount,
                })}
              </span>
            </div>
            <Button asChild variant="outline" className="max-md:w-full">
              <Link href="/account/points">{t("pointsHistory")}</Link>
            </Button>
          </div>

          <h2 className="m-0 text-lg font-bold">{t("latest")}</h2>
          <div className="border-none">
            {/* One list for every width: columns with a header row on desktop, labelled cards on mobile. */}
            {/* <div
              className="text-text-subtle border-stroke-light hidden grid-cols-4 gap-4 border-b px-6 pb-3 text-sm font-semibold md:grid"
              aria-hidden="true"
            >
              <span>{t("columns.friend")}</span>
              <span>{t("columns.joinedAt")}</span>
              <span>{t("columns.firstBookingAt")}</span>
              <span>{t("columns.reward")}</span>
            </div> */}
            <InfiniteList
              loading={invites.loading}
              hasMore={invites.hasMore}
              isEmpty={invites.items.length === 0}
              error={invites.error ?? undefined}
              onLoadMore={invites.loadMore}
              onRetry={invites.retry}
            >
              <InfiniteList.Items className="m-0 flex list-none flex-col gap-2 p-0">
                {invites.items.map((invite) => (
                  <InviteRow key={invite.id} invite={invite} />
                ))}
              </InfiniteList.Items>
              <InfiniteList.Loading className="mt-3">
                <div className="bg-surface-elevated h-24 animate-pulse rounded-lg" />
              </InfiniteList.Loading>
              <InfiniteList.Error />
            </InfiniteList>
          </div>
        </>
      )}
    </section>
  );
}
