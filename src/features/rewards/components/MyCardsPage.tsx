"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/cn";
import { StateCard } from "@/shared/ui/StateCard";
import {
  REWARD_CARD_FILTERS,
  matchesRewardCardFilter,
  type RewardCardFilter,
  type RewardCardsData,
} from "../model";
import RedeemableBalanceCard from "./RedeemableBalanceCard";
import RewardTicket from "./RewardTicket";

interface Props {
  data: RewardCardsData;
}

export default function MyCardsPage({ data }: Props) {
  const t = useTranslations("rewards.cards");
  const [filter, setFilter] = useState<RewardCardFilter>("all");
  const cards = data.cards.filter((card) =>
    matchesRewardCardFilter(card, filter),
  );

  return (
    <section className="bg-surface-card-primary mx-auto flex max-w-3xl flex-col gap-5 rounded-xl p-4 sm:p-5">
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
            onClick={() => setFilter(item)}
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
      {cards.length === 0 ? (
        <StateCard
          icon="gift"
          title={t(`empty.${filter}.title`)}
          description={t(`empty.${filter}.description`)}
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {cards.map((card) => (
            <RewardTicket key={card.id} card={card} />
          ))}
        </ul>
      )}
    </section>
  );
}
