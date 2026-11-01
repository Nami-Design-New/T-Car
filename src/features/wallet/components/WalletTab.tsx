"use client";

import { EmptyState } from "@/shared/ui/EmptyState";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Loader } from "@/shared/ui/Loader";
import { useTranslations } from "next-intl";
import type { WalletSummary as Summary, WalletTransaction } from "../model";

import TransactionsList from "./TransactionsList";
import WalletSummary from "./WalletSummary";

interface Props {
  summary: Summary;
  transactions: WalletTransaction[];
  loading?: boolean;
  /** Set when the wallet failed to load; ErrorState picks the message. */
  error?: unknown;
  onRetry?: () => void;
  onTopUp: () => void;
  onWithdraw: () => void;
}

export default function WalletTab({
  summary,
  transactions,
  loading = false,
  error,
  onRetry,
  onTopUp,
  onWithdraw,
}: Props) {
  const t = useTranslations("wallet");
  // if (loading) {
  //   return (
  //     <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
  //       <Loader fullScreen={false} />
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
        <ErrorState error={error} onRetry={onRetry} size="section" />
      </div>
    );
  }

  return (
    <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
      <WalletSummary
        summary={summary}
        onTopUp={onTopUp}
        onWithdraw={onWithdraw}
      />

      <div className="">
        <h3 className="text-text-primary mb-3.5 text-base font-bold">
          {t("history")}
        </h3>

        {transactions.length === 0 ? (
          <EmptyState title={t("empty.history")} size="section" />
        ) : (
          <TransactionsList transactions={transactions} />
        )}
      </div>
    </div>
  );
}
