"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { cn } from "@/shared/lib/cn";
import { fromActionResult } from "@/shared/lib/result";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { StateCard } from "@/shared/ui/StateCard";
import { getRewardCardsPageAction } from "../actions";
import {
  REWARD_CARD_FILTERS,
  type RewardCardFilter,
  type RewardCardsData,
} from "../model";
import RedeemableBalanceCard from "./RedeemableBalanceCard";
import RewardTicket from "./RewardTicket";

interface Props {
  data: RewardCardsData;
  filter: RewardCardFilter;
}

export default function MyCardsPage({ data, filter }: Props) {
  const t = useTranslations("rewards.cards");
  const router = useRouter();
  const fetchPage = useCallback(
    async (page: number) =>
      fromActionResult(await getRewardCardsPageAction(page, filter)),
    [filter],
  );
  const cards = usePaginatedList(fetchPage, {
    initialPage: data.page,
    scope: "rewards.cards",
  });

  return (
    <section className="bg-surface-card-primary flex flex-col gap-5 rounded-xl">
      <RedeemableBalanceCard balance={data.balance} showHistory />
      <div
        role="tablist"
        aria-label={t("filtersLabel")}
        className="flex rounded-xl bg-neutral-100 p-1"
      >
        {REWARD_CARD_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() =>
              router.replace(
                item === "all"
                  ? "/account/rewards/cards"
                  : `/account/rewards/cards?filter=${item}`,
                { scroll: false },
              )
            }
            className={cn(
              "text-text-subtle min-w-0 flex-1 cursor-pointer rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm",
              filter === item &&
                "bg-surface-elevated text-action-primary shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
            )}
          >
            {t(`filters.${item}`)}
          </button>
        ))}
      </div>
      <InfiniteList
        loading={cards.loading}
        hasMore={cards.hasMore}
        isEmpty={cards.items.length === 0}
        error={cards.error ?? undefined}
        onLoadMore={cards.loadMore}
        onRetry={cards.retry}
      >
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {cards.items.map((card) => (
            <RewardTicket key={card.id} card={card} />
          ))}
        </ul>
        <InfiniteList.Loading className="mt-3">
          <div className="bg-surface-elevated h-30 animate-pulse rounded-xl" />
        </InfiniteList.Loading>
        <InfiniteList.Error />
        <InfiniteList.Empty>
          <StateCard
            icon="gift"
            title={t(`empty.${filter}.title`)}
            description={t(`empty.${filter}.description`)}
          />
        </InfiniteList.Empty>
      </InfiniteList>
    </section>
  );
}
