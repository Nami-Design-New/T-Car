"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, type ReactNode } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import { Link, useRouter } from "@/i18n/navigation";
import { usePaginatedList } from "@/shared/hooks/usePaginatedList";
import { cn } from "@/shared/lib/cn";
import { fromActionResult } from "@/shared/lib/result";
import { InfiniteList } from "@/shared/ui/InfiniteList";
import { StateCard } from "@/shared/ui/StateCard";
import {
  POINTS_FILTERS,
  POINTS_TIME_ZONE,
  groupPointsTransactions,
  pointsSourceHref,
  type PointsData,
  type PointsFilter,
  type PointsTransaction,
} from "../model";
import { getPointsPageAction } from "../actions";

interface Props {
  data: PointsData;
  filter: PointsFilter;
}

/** "Points history": the balances, a filter, and every movement by month. */
export default function PointsPage({ data, filter }: Props) {
  const t = useTranslations("account.points");
  const format = useFormatter();
  const router = useRouter();
  const fetchPage = useCallback(
    async (page: number) => fromActionResult(await getPointsPageAction(page, filter)),
    [filter],
  );
  const transactions = usePaginatedList(fetchPage, {
    initialPage: data.page,
    scope: "points.history",
  });
  const groups = groupPointsTransactions(transactions.items);
  const { summary } = data;

  return (
    <section className="flex flex-col gap-6">
      <dl className="m-0 grid grid-cols-3 gap-3 max-sm:gap-2">
        <Stat label={t("stats.tierPoints")} tone="tier">
          {format.number(summary.tierPoints)}
        </Stat>
        <Stat label={t("stats.balance")} tone="balance">
          {format.number(summary.balance)}
        </Stat>
        <Stat label={t("stats.lastRedemption")} tone="balance">
          {summary.lastRedemption === null
            ? "—"
            : format.number(summary.lastRedemption)}
        </Stat>
      </dl>

      <div
        className="flex rounded-xl bg-neutral-100 p-1 md:self-start"
        role="tablist"
        aria-label={t("filtersLabel")}
      >
        {POINTS_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            className={cn(
              "text-text-subtle min-w-28 flex-1 cursor-pointer rounded-lg border-0 bg-transparent px-4 py-2.5 text-sm font-semibold transition-colors max-md:min-w-0",
              filter === item &&
                "text-action-primary bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
            )}
            onClick={() => router.replace(
              item === "all" ? "/account/points" : `/account/points?filter=${item}`,
              { scroll: false },
            )}
          >
            {t(`filters.${item}`)}
          </button>
        ))}
      </div>

      <InfiniteList
        key={filter}
        loading={transactions.loading}
        hasMore={transactions.hasMore}
        isEmpty={transactions.items.length === 0}
        error={transactions.error ?? undefined}
        onLoadMore={transactions.loadMore}
        onRetry={transactions.retry}
        className="flex flex-col gap-6"
      >
        {groups.map((group) => {
          const title =
            group.kind === "latest"
              ? t("latest")
              : format.dateTime(new Date(group.month), {
                  month: "long",
                  year: "numeric",
                  numberingSystem: "latn",
                  timeZone: "UTC",
                });
          return (
            <section
              key={group.kind === "latest" ? "latest" : group.month}
              className="flex flex-col gap-3"
            >
              <h2 className="text-text-subtle m-0 text-base font-bold">
                {title}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {group.transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        <InfiniteList.Loading className="mt-3">
          <div className="bg-surface-elevated h-20 animate-pulse rounded-xl" />
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

function Stat({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "tier" | "balance";
  children: ReactNode;
}) {
  return (
    <div className="border-stroke-light bg-surface-elevated flex min-w-0 flex-col gap-1.5 rounded-xl border p-4 max-sm:p-3">
      <dt className="text-text-subtle flex items-center gap-1.5 text-sm max-sm:text-xs">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            tone === "tier" ? "bg-success-700" : "bg-action-primary",
          )}
          aria-hidden="true"
        />
        <span className="truncate">{label}</span>
      </dt>
      <dd
        className={cn(
          "m-0 text-[clamp(1.25rem,3vw,1.75rem)] leading-tight font-bold",
          tone === "tier" ? "text-success-700" : "text-action-primary",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: PointsTransaction }) {
  const format = useFormatter();
  const { type, source } = transaction;
  const href = pointsSourceHref(source);
  const date = new Date(transaction.createdAt);
  const when = `${format.dateTime(date, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
    timeZone: POINTS_TIME_ZONE,
  })} · ${format.dateTime(date, {
    hour: "2-digit",
    minute: "2-digit",
    numberingSystem: "latn",
    timeZone: POINTS_TIME_ZONE,
  })}`;
  const Icon = type === "earned" ? FiArrowUp : FiArrowDown;
  // A real minus sign, and the sign before the number in both directions.
  const amount = `${transaction.amount > 0 ? "+" : "−"}${format.number(Math.abs(transaction.amount))}`;

  const content = (
    <>
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-full text-xl max-sm:size-10",
          type === "earned" && "bg-success-100 text-success-700",
          type === "used" && "bg-surface-card-primary text-action-primary",
        )}
        aria-hidden="true"
      >
        <Icon />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <strong className="text-base">{transaction.title}</strong>
        <span className="text-text-subtle text-sm">{when}</span>
      </span>
      <span
        className={cn(
          "shrink-0 text-lg font-bold",
          type === "earned" && "text-success-700",
          type === "used" && "text-action-primary",
        )}
        dir="ltr"
      >
        {amount}
      </span>
    </>
  );
  const rowClasses =
    "border-stroke-light bg-surface-elevated flex items-center gap-4 rounded-xl border p-4 max-sm:gap-3 max-sm:p-3";

  return (
    <li>
      {href ? (
        <Link
          href={href}
          className={cn(
            rowClasses,
            "text-text-primary hover:border-action-primary no-underline transition-colors",
          )}
        >
          {content}
        </Link>
      ) : (
        <div className={rowClasses}>{content}</div>
      )}
    </li>
  );
}
