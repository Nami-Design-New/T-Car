"use client";

import { EmptyState } from "@/shared/ui/EmptyState";
import { useTranslations } from "next-intl";
import type { WalletSummary as Summary, WalletTransaction } from "../model";

import TransactionsList from "./TransactionsList";
import WalletSummary from "./WalletSummary";

interface Props {
  summary: Summary;
  transactions: WalletTransaction[];
  onTopUp: () => void;
  onWithdraw: () => void;
}

export default function WalletTab({
  summary,
  transactions,
  onTopUp,
  onWithdraw,
}: Props) {
  const t = useTranslations("wallet");
  // Loading and load errors are the route's (account/(sections) loading.tsx
  // and error.tsx); this only renders a loaded wallet.
  return (
    <div className="border-stroke-light bg-surface-elevated rounded-xl border p-6">
      <WalletSummary
        summary={summary}
        onTopUp={onTopUp}
        onWithdraw={onWithdraw}
      />

      <div>
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
