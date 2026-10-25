"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { POINTS_ICONS } from "@/shared/config/assets";
import type { PointsData, PointsFilter, PointsTransaction } from "../model";

interface Props {
  data: PointsData;
}

const FILTERS: PointsFilter[] = ["all", "earned", "spent"];

export default function PointsPage({ data }: Props) {
  const t = useTranslations("account.points");
  const locale = useLocale();
  const [filter, setFilter] = useState<PointsFilter>("all");
  const transactions = data.transactions.filter(
    (transaction) => filter === "all" || transaction.type === filter,
  );

  return (
    <section className="points-page min-h-140 overflow-hidden rounded-xl bg-[linear-gradient(214deg,#f6faff_0%,#eff6fe_100%)] text-text-primary max-md:min-h-[calc(100vh-160px)]">
      <header className="points-page__header flex items-center justify-between px-5 pb-2 pt-4.5 max-md:px-4">
        <h1 className="m-0 text-xl font-bold">{t("historyTitle")}</h1>
      </header>

      <div className="points-page__summary px-5 pb-5 pt-7.5 text-center max-md:py-6">
        <h2 className="m-0 text-[clamp(2.25rem,5vw,3rem)] font-bold leading-[1.2] text-action-primary">
          {data.summary.balance}{" "}
          <span className="text-[0.8em]">{t("unit")}</span>
        </h2>
        <p className="mt-3.5 text-xs text-text-subtle">
          {t("expiresAt", { date: formatDate(data.summary.expiresAt, locale) })}
        </p>
      </div>

      <div
        className="points-page__filters flex justify-around border-y border-stroke-heavy/55 bg-surface-elevated/70"
        role="tablist"
        aria-label={t("filtersLabel")}
      >
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            className={cn(
              "points-page__filter relative min-w-27.5 cursor-pointer border-0 bg-transparent px-4 pb-3 pt-3.5 text-sm font-inherit text-text-subtle max-md:min-w-0 max-md:flex-1 max-md:px-2",
              filter === item && "font-bold text-action-primary",
            )}
            onClick={() => setFilter(item)}
          >
            {t(`filters.${item}`)}
            {filter === item && (
              <span className="absolute inset-x-4 bottom-0 h-1 rounded-full bg-action-primary max-md:inset-x-2" />
            )}
          </button>
        ))}
      </div>

      <ul className="points-page__transactions m-0 list-none px-5 max-md:px-4">
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            locale={locale}
            t={t}
          />
        ))}
      </ul>
    </section>
  );
}

function TransactionRow({
  transaction,
  locale,
  t,
}: {
  transaction: PointsTransaction;
  locale: string;
  t: ReturnType<typeof useTranslations<"account.points">>;
}) {
  const icon = POINTS_ICONS[transaction.type];

  return (
    <li className="points-transaction flex min-h-18.5 items-center gap-3.5 border-b border-stroke-heavy/55">
      <div className="points-transaction__content flex min-w-0 flex-1 flex-col items-end gap-1">
        <strong className="text-[0.9rem] font-bold">
          {t(`transaction.${transaction.type}`)}
        </strong>
        <span className="text-xs text-text-subtle">
          {formatDate(transaction.createdAt, locale)}
        </span>
      </div>
      <span
        className={cn(
          "points-transaction__icon grid size-9 place-items-center rounded-full bg-surface-card-primary",
          transaction.type === "spent" && "bg-success-100",
          transaction.type === "expired" && "bg-neutral-200",
        )}
      >
        <Image src={icon.src} alt="" width={icon.width} height={icon.height} />
      </span>
      <span
        className={cn(
          "points-transaction__amount min-w-18 text-base font-bold text-text-subtle",
          transaction.type === "earned" && "text-action-primary",
          transaction.type === "spent" && "text-success-700",
        )}
        dir="ltr"
      >
        {transaction.amount > 0 ? "+" : ""}
        {transaction.amount}
      </span>
    </li>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  }).format(new Date(value));
}
